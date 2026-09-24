const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isStrongBootstrapPassword = (password) => typeof password === 'string'
  && password.length >= 12
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /\d/.test(password)
  && /[^A-Za-z0-9]/.test(password);

const isFirebaseUserNotFound = (error) => error?.code === 'auth/user-not-found';

const normalizeConfiguration = (configuration = {}) => ({
  email: typeof configuration.email === 'string' ? configuration.email.trim().toLowerCase() : '',
  username: typeof configuration.username === 'string' ? configuration.username.trim() : '',
  firstName: typeof configuration.firstName === 'string' ? configuration.firstName.trim() : '',
  lastName: typeof configuration.lastName === 'string' ? configuration.lastName.trim() : '',
  password: configuration.password,
  apply: configuration.apply === true,
});

const validateConfiguration = (configuration) => {
  if (!EMAIL_PATTERN.test(configuration.email)) {
    throw new Error('BOOTSTRAP_SUPER_ADMIN_EMAIL must be a valid email address.');
  }
  if (!configuration.username || !configuration.firstName || !configuration.lastName) {
    throw new Error('BOOTSTRAP_SUPER_ADMIN_USERNAME, BOOTSTRAP_SUPER_ADMIN_FIRST_NAME, and BOOTSTRAP_SUPER_ADMIN_LAST_NAME are required.');
  }
};

const findMongoUser = async (UserModel, firebaseUid, email) => {
  const byUid = await UserModel.findOne({ firebaseUid });
  if (byUid) return byUid;
  return UserModel.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
};

const canReplaceStaleFirebaseUid = async (auth, currentFirebaseUid) => {
  if (!currentFirebaseUid) return true;
  try {
    await auth.getUser(currentFirebaseUid);
    return false;
  } catch (error) {
    if (isFirebaseUserNotFound(error)) return true;
    throw error;
  }
};

/**
 * Restores the single configured Barangay Captain account after a data-loss event.
 * It is deliberately invoked only by a CLI script; do not import it into server startup.
 */
export const bootstrapSuperAdmin = async ({ auth, UserModel, AuditLogModel, configuration }) => {
  const config = normalizeConfiguration(configuration);
  validateConfiguration(config);

  let firebaseUser;
  let firebaseUserExists = true;
  try {
    firebaseUser = await auth.getUserByEmail(config.email);
  } catch (error) {
    if (!isFirebaseUserNotFound(error)) throw error;
    firebaseUserExists = false;
  }

  if (!firebaseUserExists && config.apply && !isStrongBootstrapPassword(config.password)) {
    throw new Error('BOOTSTRAP_SUPER_ADMIN_PASSWORD is required only when Firebase must be recreated, and must be at least 12 characters with upper-case, lower-case, number, and special character.');
  }

  const firebaseUidForLookup = firebaseUser?.uid || '__bootstrap-firebase-user-missing__';
  const existingUser = await findMongoUser(UserModel, firebaseUidForLookup, config.email);
  const existingCaptain = await UserModel.findOne({
    role: 'super_admin',
    ...(existingUser?._id ? { _id: { $ne: existingUser._id } } : {}),
  });

  if (existingCaptain) {
    throw new Error(`Another Super Admin already exists (${existingCaptain.email}). Refusing to replace it.`);
  }

  // Detect an identity collision during preview too. This prevents a dry-run
  // from claiming recovery is safe when the MongoDB profile belongs to another
  // still-active Firebase account.
  if (existingUser && firebaseUserExists && existingUser.firebaseUid && existingUser.firebaseUid !== firebaseUser.uid) {
    const staleUid = await canReplaceStaleFirebaseUid(auth, existingUser.firebaseUid);
    if (!staleUid) {
      throw new Error('The existing BrgyLink profile is linked to a different active Firebase account. Resolve the identity mismatch before recovery.');
    }
  }

  if (!config.apply) {
    return {
      mode: 'dry-run',
      firebase: firebaseUserExists ? 'existing account will be reused' : 'Firebase account will be created',
      database: existingUser ? 'existing BrgyLink profile will be restored' : 'BrgyLink Super Admin profile will be created',
      email: config.email,
    };
  }

  let createdFirebaseUser = false;
  try {
    if (!firebaseUserExists) {
      firebaseUser = await auth.createUser({
        email: config.email,
        password: config.password,
        displayName: config.username,
      });
      createdFirebaseUser = true;
    }

    let user = existingUser;
    let action;
    if (user) {
      if (user.firebaseUid && user.firebaseUid !== firebaseUser.uid) {
        // The same collision was checked in preview. Keep this second check for
        // direct callers that invoke the helper without a prior dry run.
        const staleUid = await canReplaceStaleFirebaseUid(auth, user.firebaseUid);
        if (!staleUid) throw new Error('The existing BrgyLink profile is linked to a different active Firebase account. Resolve the identity mismatch before recovery.');
      }

      user.firebaseUid = firebaseUser.uid;
      user.email = config.email;
      user.role = 'super_admin';
      user.accountStatus = 'approved';
      user.isVerified = true;
      await user.save();
      action = 'BOOTSTRAP_SUPER_ADMIN_RESTORED';
    } else {
      user = new UserModel({
        firebaseUid: firebaseUser.uid,
        username: config.username,
        email: config.email,
        firstName: config.firstName,
        lastName: config.lastName,
        role: 'super_admin',
        accountStatus: 'approved',
        isVerified: true,
        mfaEnabled: true,
      });
      await user.save();
      action = 'BOOTSTRAP_SUPER_ADMIN_CREATED';
    }

    await AuditLogModel.create({
      userId: user._id,
      username: user.username,
      action,
      details: `Manual bootstrap recovery completed for ${config.email}.`,
      ipAddress: 'bootstrap-script',
    });

    return {
      mode: 'applied',
      firebase: createdFirebaseUser ? 'created' : 'reused',
      database: existingUser ? 'restored' : 'created',
      email: config.email,
      userId: user._id.toString(),
    };
  } catch (error) {
    if (createdFirebaseUser && firebaseUser?.uid) {
      await auth.deleteUser(firebaseUser.uid).catch(() => {});
    }
    throw error;
  }
};

export { isStrongBootstrapPassword };
