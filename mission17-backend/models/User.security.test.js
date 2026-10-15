import User from './User.js';

describe('User security-sensitive field projections', () => {
  it('excludes OTP and authenticator secrets from default Mongoose projections', () => {
    for (const field of ['otpCode', 'otpExpires', 'mfaSecret', 'passwordHistory']) {
      expect(User.schema.path(field).options.select).toBe(false);
    }
  });
});
