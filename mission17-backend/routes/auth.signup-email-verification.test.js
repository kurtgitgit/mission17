import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'signup-verification-test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
process.env.EMAIL_USER = 'test@example.com';
process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL = 'recovery-admin@example.com';
process.env.FIREBASE_WEB_API_KEY = 'test-firebase-web-api-key';

const gmailSend = jest.fn();
const firebaseAuth = {
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  verifyIdToken: jest.fn(),
};

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  logAudit: jest.fn(),
  verifyAdmin: (_req, _res, next) => next(),
  verifyAuthenticatedUser: (_req, _res, next) => next(),
  verifyFirebaseToken: (_req, _res, next) => next(),
}));

jest.unstable_mockModule('../utils/upload.js', () => ({
  upload: {
    fields: () => (req, _res, next) => {
      req.files = {
        validIdFront: [{ path: 'https://res.cloudinary.com/test/id-front.jpg' }],
        validIdBack: [{ path: 'https://res.cloudinary.com/test/id-back.jpg' }]
      };
      next();
    }
  }
}));

jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => firebaseAuth)
}));

jest.unstable_mockModule('googleapis', () => ({
  google: {
    auth: { OAuth2: jest.fn(() => ({ setCredentials: jest.fn() })) },
    gmail: jest.fn(() => ({ users: { messages: { send: gmailSend } } }))
  }
}));

const { default: authRouter } = await import('./auth.js');
const { default: SignupEmailVerification } = await import('../models/SignupEmailVerification.js');
const { default: User } = await import('../models/User.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const decodeRawEmail = (raw) => Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

describe('early signup email verification', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    gmailSend.mockClear();
    Object.values(firebaseAuth).forEach(mock => mock.mockReset());
    await SignupEmailVerification.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('sends a short-lived hashed OTP and issues a registration token only after verification', async () => {
    const start = await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email: 'new.resident@example.com', firstName: 'New' });

    expect(start.status).toBe(200);
    expect(gmailSend).toHaveBeenCalledTimes(1);

    const sentMessage = decodeRawEmail(gmailSend.mock.calls[0][0].requestBody.raw);
    expect(sentMessage).toMatch(/^Date:/mi);
    expect(sentMessage).toMatch(/^Message-ID:/mi);
    expect(sentMessage).toMatch(/^MIME-Version: 1\.0$/mi);
    expect(sentMessage).toMatch(/^Content-Type: multipart\/alternative;/mi);
    const otp = sentMessage.match(/\b\d{6}\b/)?.[0];
    expect(otp).toMatch(/^\d{6}$/);

    const storedBeforeVerification = await SignupEmailVerification.findOne({ email: 'new.resident@example.com' }).select('+otpHash');
    expect(storedBeforeVerification.otpHash).not.toBe(otp);
    expect(storedBeforeVerification.verifiedAt).toBeNull();

    const verify = await request(app)
      .post('/api/auth/verify-signup-email')
      .send({ email: 'new.resident@example.com', otp });

    expect(verify.status).toBe(200);
    const claims = jwt.verify(verify.body.verificationToken, process.env.JWT_SECRET);
    expect(claims).toMatchObject({ purpose: 'signup_email_verification', email: 'new.resident@example.com' });

    const storedAfterVerification = await SignupEmailVerification.findOne({ email: 'new.resident@example.com' });
    expect(storedAfterVerification.verifiedAt).toBeTruthy();
  });

  it('enforces the resend cooldown without replacing the valid code', async () => {
    await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email: 'cooldown@example.com', firstName: 'Cool' })
      .expect(200);
    const stored = await SignupEmailVerification.findOne({ email: 'cooldown@example.com' }).select('+otpHash');

    const resend = await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email: 'cooldown@example.com', firstName: 'Cool' });

    expect(resend.status).toBe(429);
    expect(resend.body.retryAfterSeconds).toBeGreaterThan(0);
    const afterResend = await SignupEmailVerification.findOne({ email: 'cooldown@example.com' }).select('+otpHash');
    expect(afterResend.otpHash).toBe(stored.otpHash);
  });

  it('creates Firebase and MongoDB accounts on the backend and makes retries idempotent', async () => {
    const email = 'resident@example.com';
    const start = await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email, firstName: 'Juan' })
      .expect(200);
    expect(start.body.message).toMatch(/Verification code sent/i);

    const sentMessage = decodeRawEmail(gmailSend.mock.calls[0][0].requestBody.raw);
    const otp = sentMessage.match(/\b\d{6}\b/)?.[0];
    const verify = await request(app)
      .post('/api/auth/verify-signup-email')
      .send({ email, otp })
      .expect(200);

    firebaseAuth.getUserByEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    firebaseAuth.createUser.mockResolvedValueOnce({ uid: 'firebase-resident-123' });

    const payload = {
      email,
      password: 'Secure!Pass123',
      signupVerificationToken: verify.body.verificationToken,
      privacyAccepted: 'true',
      termsAccepted: 'true',
      policyVersion: '2026-09-08-capstone-v1',
      firstName: 'Juan',
      middleName: '',
      lastName: 'Dela Cruz',
      birthDate: '01/01/2000',
      age: '26',
      gender: 'Male',
      civilStatus: 'Single',
      nationality: 'Filipino',
      purok: 'Purok 1',
      completeAddress: 'Bagong Pag-asa Road',
      mobileNumber: '09123456789',
      voterStatus: 'Registered',
      employmentStatus: 'Employed',
      idType: 'PhilSys National ID / ePhilID'
    };

    const registration = await request(app)
      .post('/api/auth/register-resident')
      .send(payload);

    expect(registration.status).toBe(201);
    expect(firebaseAuth.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email,
      emailVerified: true,
      disabled: false
    }));
    expect(await User.findOne({ email })).toMatchObject({
      firebaseUid: 'firebase-resident-123',
      role: 'resident',
      accountStatus: 'pending',
      isVerified: true
    });

    const retry = await request(app)
      .post('/api/auth/register-resident')
      .send(payload);

    expect(retry.status).toBe(200);
    expect(retry.body.alreadyRegistered).toBe(true);
    expect(firebaseAuth.createUser).toHaveBeenCalledTimes(1);
  });

  it('recovers an orphan Firebase identity after the resident proves email ownership', async () => {
    const email = 'orphan@example.com';
    await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email, firstName: 'Ana' })
      .expect(200);
    const sentMessage = decodeRawEmail(gmailSend.mock.calls[0][0].requestBody.raw);
    const otp = sentMessage.match(/\b\d{6}\b/)?.[0];
    const verify = await request(app)
      .post('/api/auth/verify-signup-email')
      .send({ email, otp })
      .expect(200);

    firebaseAuth.getUserByEmail.mockResolvedValueOnce({ uid: 'orphan-firebase-123', customClaims: {} });
    firebaseAuth.updateUser.mockResolvedValueOnce({ uid: 'orphan-firebase-123' });

    const registration = await request(app)
      .post('/api/auth/register-resident')
      .send({
        email,
        password: 'Secure!Pass123',
        signupVerificationToken: verify.body.verificationToken,
        privacyAccepted: 'true',
        termsAccepted: 'true',
        policyVersion: '2026-09-08-capstone-v1',
        firstName: 'Ana',
        lastName: 'Santos',
        birthDate: '01/01/2000',
        age: '26',
        gender: 'Female',
        civilStatus: 'Single',
        nationality: 'Filipino',
        purok: 'Purok 2',
        completeAddress: 'Bagong Pag-asa Road',
        mobileNumber: '09987654321',
        voterStatus: 'Not Registered',
        employmentStatus: 'Student',
        idType: 'PhilSys National ID / ePhilID'
      });

    expect(registration.status).toBe(201);
    expect(firebaseAuth.updateUser).toHaveBeenCalledWith('orphan-firebase-123', expect.objectContaining({
      password: 'Secure!Pass123',
      emailVerified: true,
      disabled: false
    }));
    expect(firebaseAuth.createUser).not.toHaveBeenCalled();
  });

  it('blocks the protected recovery administrator email from public resident registration', async () => {
    const registration = await request(app)
      .post('/api/auth/register-resident')
      .send({
        email: process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL,
        password: 'Secure!Pass123'
      });

    expect(registration.status).toBe(409);
    expect(registration.body.message).toMatch(/protected recovery administrator/i);
    expect(firebaseAuth.getUserByEmail).not.toHaveBeenCalled();
    expect(firebaseAuth.createUser).not.toHaveBeenCalled();
  });

  it('rolls back a newly created Firebase identity when the MongoDB profile cannot be saved', async () => {
    const email = 'rollback@example.com';
    await User.create({
      firebaseUid: 'existing-uid',
      username: 'AlreadyUsed',
      email: 'existing@example.com',
      firstName: 'Existing',
      lastName: 'Resident',
      birthDate: '01/01/2000',
      age: '26',
      gender: 'Male',
      civilStatus: 'Single',
      nationality: 'Filipino',
      purok: 'Purok 1',
      completeAddress: 'Bagong Pag-asa Road',
      mobileNumber: '09123456789',
      voterStatus: 'Registered',
      employmentStatus: 'Employed'
    });

    await request(app)
      .post('/api/auth/start-signup-verification')
      .send({ email, firstName: 'Retry' })
      .expect(200);
    const sentMessage = decodeRawEmail(gmailSend.mock.calls[0][0].requestBody.raw);
    const otp = sentMessage.match(/\b\d{6}\b/)?.[0];
    const verify = await request(app)
      .post('/api/auth/verify-signup-email')
      .send({ email, otp })
      .expect(200);

    firebaseAuth.getUserByEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    firebaseAuth.createUser.mockResolvedValueOnce({ uid: 'firebase-rollback-123' });
    firebaseAuth.deleteUser.mockResolvedValueOnce();

    const registration = await request(app)
      .post('/api/auth/register-resident')
      .send({
        email,
        username: 'AlreadyUsed',
        password: 'Secure!Pass123',
        signupVerificationToken: verify.body.verificationToken,
        privacyAccepted: 'true',
        termsAccepted: 'true',
        policyVersion: '2026-09-08-capstone-v1',
        firstName: 'Retry',
        lastName: 'Resident',
        birthDate: '01/01/2000',
        age: '26',
        gender: 'Male',
        civilStatus: 'Single',
        nationality: 'Filipino',
        purok: 'Purok 3',
        completeAddress: 'Bagong Pag-asa Road',
        mobileNumber: '09987654321',
        voterStatus: 'Not Registered',
        employmentStatus: 'Student',
        idType: 'PhilSys National ID / ePhilID'
      });

    expect(registration.status).toBe(409);
    expect(registration.body.message).toMatch(/username is already in use/i);
    expect(firebaseAuth.deleteUser).toHaveBeenCalledWith('firebase-rollback-123');
    expect(await User.findOne({ email })).toBeNull();
  });

  it('returns a Firebase session for a registered BrgyLink account', async () => {
    const email = 'fallback.login@example.com';
    await User.create({
      firebaseUid: 'firebase-fallback-123',
      username: 'FallbackResident',
      email,
      firstName: 'Fallback',
      lastName: 'Resident',
      accountStatus: 'approved',
      isVerified: true
    });
    firebaseAuth.verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-fallback-123', email });
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        idToken: 'firebase-id-token',
        refreshToken: 'firebase-refresh-token',
        expiresIn: '3600'
      })
    });

    const response = await request(app)
      .post('/api/auth/login-session')
      .send({ email, password: 'Secure!Pass123' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      idToken: 'firebase-id-token',
      refreshToken: 'firebase-refresh-token',
      expiresIn: 3600
    });
    expect(firebaseAuth.verifyIdToken).toHaveBeenCalledWith('firebase-id-token');
  });

  it('does not reveal whether the email or password was incorrect', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } })
    });

    const response = await request(app)
      .post('/api/auth/login-session')
      .send({ email: 'unknown@example.com', password: 'Wrong!Pass123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password.');
    expect(firebaseAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('refreshes fallback Firebase sessions without handling a password', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id_token: 'refreshed-id-token',
        refresh_token: 'rotated-refresh-token',
        expires_in: '3600'
      })
    });

    const response = await request(app)
      .post('/api/auth/refresh-session')
      .send({ refreshToken: 'firebase-refresh-token' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      idToken: 'refreshed-id-token',
      refreshToken: 'rotated-refresh-token',
      expiresIn: 3600
    });
  });

  it('preserves a retryable error when Firebase session refresh is temporarily unavailable', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'INTERNAL_ERROR' } })
    });

    const response = await request(app)
      .post('/api/auth/refresh-session')
      .send({ refreshToken: 'firebase-refresh-token' });

    expect(response.status).toBe(503);
    expect(response.body.message).toMatch(/temporarily unavailable/i);
  });
});
