import { jest } from '@jest/globals';
import { bootstrapSuperAdmin, isStrongBootstrapPassword } from './bootstrapSuperAdmin.js';

const configuration = {
  email: 'capstone.mission17@gmail.com',
  username: 'Mission17Admin',
  firstName: 'Mission17',
  lastName: 'Administrator',
  password: 'Temporary!Pass123',
};

const makeUserModel = (records = []) => {
  const data = [...records];
  class UserModel {
    constructor(values) {
      Object.assign(this, values, { _id: `user-${data.length + 1}` });
      data.push(this);
    }

    async save() {
      return this;
    }
  }

  UserModel.findOne = jest.fn(async (query) => data.find((record) => {
    if (query.firebaseUid) return record.firebaseUid === query.firebaseUid;
    if (query.email) return query.email.test(record.email);
    if (query.role) {
      return record.role === query.role && (!query._id?.$ne || record._id !== query._id.$ne);
    }
    return false;
  }) || null);
  return { UserModel, data };
};

const makeAuth = ({ firebaseUser, oldUidExists = false } = {}) => ({
  getUserByEmail: jest.fn(async () => {
    if (firebaseUser) return firebaseUser;
    const error = new Error('not found');
    error.code = 'auth/user-not-found';
    throw error;
  }),
  getUser: jest.fn(async () => {
    if (oldUidExists) return { uid: 'old-active-user' };
    const error = new Error('not found');
    error.code = 'auth/user-not-found';
    throw error;
  }),
  createUser: jest.fn(async () => ({ uid: 'new-firebase-uid' })),
  deleteUser: jest.fn(async () => {}),
});

const makeAuditLog = () => ({ create: jest.fn(async () => {}) });

describe('bootstrap Super Admin recovery', () => {
  test('requires a 12-character complex temporary password only when a Firebase account must be created', async () => {
    expect(isStrongBootstrapPassword('Short1!')).toBe(false);
    expect(isStrongBootstrapPassword('Temporary!Pass123')).toBe(true);

    const { UserModel } = makeUserModel();
    await expect(bootstrapSuperAdmin({
      auth: makeAuth(), UserModel, AuditLogModel: makeAuditLog(),
      configuration: { ...configuration, apply: true, password: '' },
    })).rejects.toThrow('BOOTSTRAP_SUPER_ADMIN_PASSWORD');
  });

  test('reports a dry run without changing Firebase or MongoDB', async () => {
    const { UserModel, data } = makeUserModel();
    const auth = makeAuth({ firebaseUser: { uid: 'existing-firebase-uid' } });
    const audit = makeAuditLog();

    await expect(bootstrapSuperAdmin({
      auth, UserModel, AuditLogModel: audit, configuration,
    })).resolves.toMatchObject({ mode: 'dry-run', firebase: 'existing account will be reused' });

    expect(data).toHaveLength(0);
    expect(auth.createUser).not.toHaveBeenCalled();
    expect(audit.create).not.toHaveBeenCalled();
  });

  test('creates a verified Super Admin profile for an existing Firebase identity', async () => {
    const { UserModel, data } = makeUserModel();
    const audit = makeAuditLog();

    const result = await bootstrapSuperAdmin({
      auth: makeAuth({ firebaseUser: { uid: 'existing-firebase-uid' } }),
      UserModel,
      AuditLogModel: audit,
      configuration: { ...configuration, apply: true },
    });

    expect(result).toMatchObject({ mode: 'applied', firebase: 'reused', database: 'created' });
    expect(data[0]).toMatchObject({ role: 'super_admin', accountStatus: 'approved', isVerified: true, mfaEnabled: true });
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'BOOTSTRAP_SUPER_ADMIN_CREATED' }));
  });

  test('refuses to replace another active Super Admin', async () => {
    const { UserModel } = makeUserModel([
      { _id: 'captain-1', email: 'another-captain@example.com', firebaseUid: 'other-uid', role: 'super_admin' },
    ]);

    await expect(bootstrapSuperAdmin({
      auth: makeAuth({ firebaseUser: { uid: 'existing-firebase-uid' } }),
      UserModel,
      AuditLogModel: makeAuditLog(),
      configuration: { ...configuration, apply: true },
    })).rejects.toThrow('Another Super Admin already exists');
  });

  test('restores a MongoDB profile linked to a stale Firebase UID', async () => {
    const profile = {
      _id: 'captain-1', email: configuration.email, firebaseUid: 'deleted-firebase-uid', role: 'resident',
      async save() { return this; },
    };
    const { UserModel } = makeUserModel([profile]);

    const result = await bootstrapSuperAdmin({
      auth: makeAuth({ firebaseUser: { uid: 'new-firebase-uid' } }),
      UserModel,
      AuditLogModel: makeAuditLog(),
      configuration: { ...configuration, apply: true },
    });

    expect(result).toMatchObject({ database: 'restored' });
    expect(profile).toMatchObject({ firebaseUid: 'new-firebase-uid', role: 'super_admin', accountStatus: 'approved', isVerified: true });
  });
});
