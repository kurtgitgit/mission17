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
const User = (await import('../models/User.js')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', usersRouter);

describe('resident edit-profile validation', () => {
  it('returns the resident profile as a private non-cacheable response', async () => {
    const profile = {
      _id: residentId,
      email: 'resident@example.com',
      firstName: 'Test',
      lastName: 'Resident',
    };
    const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(profile),
    });

    const response = await request(app).get(`/api/auth/user/${residentId}`);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toMatch(/private/i);
    expect(response.headers['cache-control']).toMatch(/no-store/i);
    expect(response.body.email).toBe(profile.email);
    findByIdSpy.mockRestore();
  });

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
    expect(response.body.message).toBe('Residents must be at least 15 years old to register.');
  });
});
