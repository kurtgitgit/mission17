# Bootstrap Super Admin Recovery

This is a manual disaster-recovery procedure for the single Barangay Captain account. It never runs when the API server starts and it does not hardcode a password.

## Required server-only environment variables

```env
BOOTSTRAP_SUPER_ADMIN_EMAIL=capstone.mission17@gmail.com
BOOTSTRAP_SUPER_ADMIN_USERNAME=Mission17Admin
BOOTSTRAP_SUPER_ADMIN_FIRST_NAME=Mission17
BOOTSTRAP_SUPER_ADMIN_LAST_NAME=Administrator
# Required only if Firebase Authentication no longer has this email.
BOOTSTRAP_SUPER_ADMIN_PASSWORD=replace-with-a-unique-12-plus-character-temporary-password
```

Keep these values in the backend server's `.env` or secret manager. Do not commit them or put them in the mobile app.

## Safe workflow

1. Restore MongoDB/Firebase backups first when available.
2. Confirm there is no other active Super Admin account that should remain in control.
3. Run the preview from `mission17-backend`:

   ```powershell
   npm run admin:bootstrap
   ```

4. Review whether Firebase and the BrgyLink profile will be created or restored.
5. Apply only after confirming the exact account email:

   ```powershell
   npm run admin:bootstrap -- --apply --confirm-email=capstone.mission17@gmail.com
   ```

6. Sign in, complete the required OTP, then rotate the temporary password through Firebase's password-reset flow if a Firebase account was recreated.
7. Remove or rotate `BOOTSTRAP_SUPER_ADMIN_PASSWORD` after recovery. Keep the email and profile values for future recovery.

## Behavior and safeguards

- MongoDB missing but Firebase exists: recreates the approved `super_admin` profile.
- Firebase missing but MongoDB exists: creates Firebase only after a strong temporary password is provided, then safely relinks the profile.
- Both missing: recreates both records.
- Another Super Admin exists: stops without changing anything.
- An existing profile linked to a different active Firebase identity: stops without changing anything.
- Every applied recovery creates an audit-log entry.
