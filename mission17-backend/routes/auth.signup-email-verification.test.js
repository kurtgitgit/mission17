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

const gmailSend = jest.fn();

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  logAudit: jest.fn(),
  verifyAdmin: (_req, _res, next) => next(),
  verifyAuthenticatedUser: (_req, _res, next) => next(),
  verifyFirebaseToken: (_req, _res, next) => next(),
}));

jest.unstable_mockModule('../utils/upload.js', () => ({
  upload: { fields: () => (_req, _res, next) => next() }
}));

jest.unstable_mockModule('googleapis', () => ({
  google: {
    auth: { OAuth2: jest.fn(() => ({ setCredentials: jest.fn() })) },
    gmail: jest.fn(() => ({ users: { messages: { send: gmailSend } } }))
  }
}));

const { default: authRouter } = await import('./auth.js');
const { default: SignupEmailVerification } = await import('../models/SignupEmailVerification.js');

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
    gmailSend.mockClear();
    await SignupEmailVerification.deleteMany({});
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
});
