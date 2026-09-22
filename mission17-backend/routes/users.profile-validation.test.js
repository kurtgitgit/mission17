import { jest } from '@jest/globals';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';

const residentId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin: (_req, _res, next) => next(),
  verifySuperAdmin: (_req, _res, next) => next(),
  verifyAuthenticatedUser: (req, _res, next) => {
    req.user = {
      _id: residentId,
      id: residentId.toString(),
      email: 'resident@example.com',
      username: 'resident',
      role: 'resident',
    };
    next();
  },
  verifyRegistrationReviewUser: (_req, _res, next) => next(),
  logAudit: jest.fn(),
}));

jest.unstable_mockModule('../utils/pushNotifier.js', () => ({
  sendPushNotification: jest.fn(async () => ({ accepted: false })),
}));

jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
  })),
}));

const usersRouter = (await import('./users.js')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', usersRouter);

describe('resident edit-profile validation', () => {
  it('rejects numeric names in edit profile', async () => {
    const response = await request(app)
      .put(`/api/auth/update-profile/${residentId}`)
      .send({ firstName: '11111' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/First name may contain letters/i);
  });

  it('rejects an edit-profile birthdate below the minimum age', async () => {
    const today = new Date();
    const response = await request(app)
      .put(`/api/auth/update-profile/${residentId}`)
      .send({ birthDate: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}` });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Residents must be at least 18 years old to register.');
  });
});
