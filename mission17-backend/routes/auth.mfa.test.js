import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'synthetic-mfa-test-secret';
process.env.GOOGLE_CLIENT_ID = 'synthetic-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'synthetic-client-secret';
process.env.GOOGLE_REFRESH_TOKEN = 'synthetic-refresh-token';
process.env.EMAIL_USER = 'synthetic@example.test';

const User = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
};
const recordMfaVerifiedSession = jest.fn();
const logAudit = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({ default: User }));
jest.unstable_mockModule('../models/AuditLog.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../models/SignupEmailVerification.js', () => ({ default: {} }));
jest.unstable_mockModule('../models/MfaVerifiedSession.js', () => ({ default: {} }));
jest.unstable_mockModule('../utils/mfaSession.js', () => ({
  recordMfaVerifiedSession,
  hasMfaVerifiedSession: jest.fn(),
}));
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  logAudit,
  verifyAdmin: (_req, _res, next) => next(),
  verifyAuthenticatedUser: (_req, _res, next) => next(),
  verifyFirebaseToken: (_req, _res, next) => next(),
}));
jest.unstable_mockModule('../utils/upload.js', () => ({
  upload: { fields: () => (_req, _res, next) => next() },
}));
jest.unstable_mockModule('firebase-admin/auth', () => ({ getAuth: jest.fn(() => ({})) }));
jest.unstable_mockModule('googleapis', () => ({
  google: { auth: { OAuth2: jest.fn() }, gmail: jest.fn() },
}));

const authRouter = (await import('./auth.js')).default;
const { verifyOtpHandler } = await import('./auth.js');
const syncUserHandler = authRouter.stack
  .find((layer) => layer.route?.path === '/sync-user')
  .route.stack.at(-1).handle;

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const makeAdmin = () => ({
  _id: 'synthetic-admin-record',
  firebaseUid: 'synthetic-admin-uid',
  username: 'SyntheticAdmin',
  role: 'admin',
  accountStatus: 'approved',
  isVerified: true,
  mfaEnabled: false,
  otpCode: '654321',
  otpExpires: new Date(Date.now() + 60_000),
});

describe('MFA verification handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const user = makeAdmin();
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    User.findOneAndUpdate.mockResolvedValue({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      username: user.username,
      role: user.role,
      accountStatus: user.accountStatus,
      isVerified: true,
    });
    recordMfaVerifiedSession.mockResolvedValue(undefined);
  });

  it('atomically consumes the code and records proof bound to the Firebase sign-in', async () => {
    const nowBefore = Date.now();
    const req = {
      body: { otp: '654321' },
      firebaseUser: { uid: 'synthetic-admin-uid', auth_time: Math.floor(Date.now() / 1000) - 30 },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = makeResponse();

    await verifyOtpHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('OTP verified'),
      user: expect.not.objectContaining({ otpCode: expect.anything(), otpExpires: expect.anything() }),
    }));
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'synthetic-admin-record',
        firebaseUid: 'synthetic-admin-uid',
        otpCode: '654321',
        otpExpires: { $gt: expect.any(Date) },
        accountStatus: { $ne: 'rejected' },
      },
      { $set: { otpCode: null, otpExpires: null, isVerified: true } },
      { new: true }
    );
    expect(recordMfaVerifiedSession).toHaveBeenCalledWith(
      'synthetic-admin-uid',
      req.firebaseUser.auth_time,
      expect.any(Date)
    );
    expect(Date.now() - nowBefore).toBeLessThan(2_000);
  });

  it('does not create MFA proof when an already-consumed code loses the atomic update race', async () => {
    User.findOneAndUpdate.mockResolvedValueOnce(null);
    const req = {
      body: { otp: '654321' },
      firebaseUser: { uid: 'synthetic-admin-uid', auth_time: Math.floor(Date.now() / 1000) - 30 },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = makeResponse();

    await verifyOtpHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(recordMfaVerifiedSession).not.toHaveBeenCalled();
  });

  it('rejects a privileged account token without Firebase auth_time before consuming the OTP', async () => {
    const req = {
      body: { otp: '654321' },
      firebaseUser: { uid: 'synthetic-admin-uid' },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = makeResponse();

    await verifyOtpHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    expect(recordMfaVerifiedSession).not.toHaveBeenCalled();
  });

  it('never returns selected OTP or MFA secrets from account sync', async () => {
    const user = {
      ...makeAdmin(),
      role: 'resident',
      otpCode: '654321',
      otpExpires: new Date(Date.now() + 60_000),
      mfaSecret: 'synthetic-secret',
      passwordHistory: ['synthetic-hash'],
    };
    User.findOne.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(user) });
    const req = {
      firebaseUser: { uid: user.firebaseUid, email: 'synthetic@example.test', email_verified: true },
      body: {},
      files: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = makeResponse();

    await syncUserHandler(req, res);

    const payload = res.json.mock.calls[0][0].user;
    expect(payload).not.toHaveProperty('otpCode');
    expect(payload).not.toHaveProperty('otpExpires');
    expect(payload).not.toHaveProperty('mfaSecret');
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('passwordHistory');
  });

  it('does not bind a verified Firebase identity to an account already linked elsewhere', async () => {
    const legacyAccount = {
      ...makeAdmin(),
      firebaseUid: 'different-existing-uid',
      email: 'synthetic+attacker@example.test',
    };
    User.findOne
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(legacyAccount) });
    const req = {
      firebaseUser: {
        uid: 'attacker-controlled-uid',
        email: legacyAccount.email,
        email_verified: true,
      },
      body: {},
      files: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = makeResponse();

    await syncUserHandler(req, res);

    expect(User.findOne).toHaveBeenNthCalledWith(2, {
      email: expect.any(RegExp),
    });
    const emailPattern = User.findOne.mock.calls[1][0].email;
    expect(emailPattern.test('synthetic+attacker@example.test')).toBe(true);
    expect(emailPattern.test('syntheticttttattacker@exampleXtest')).toBe(false);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.updateOne).not.toHaveBeenCalled();
  });
});
