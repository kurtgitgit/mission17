import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin: jest.fn((req, res, next) => {
    const role = req.headers['x-mock-user-role'];
    if (['admin', 'super_admin'].includes(role)) {
      req.user = { _id: req.headers['x-mock-user-id'], role, username: role };
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: administrators only.' });
  }),
  verifySuperAdmin: jest.fn((req, res, next) => {
    if (req.headers['x-mock-user-role'] === 'super_admin') {
      req.user = { _id: req.headers['x-mock-user-id'], role: 'super_admin', username: 'captain' };
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: Barangay Captain access is required.' });
  }),
  verifyAuthenticatedUser: jest.fn((_req, res) => res.status(401).json({ message: 'Authentication failed.' })),
  verifyRegistrationReviewUser: jest.fn((_req, res) => res.status(401).json({ message: 'Authentication failed.' })),
  logAudit: jest.fn(),
}));

const userQuery = {
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    find: jest.fn(() => userQuery),
    countDocuments: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(true),
  },
}));
jest.unstable_mockModule('../models/Notification.js', () => ({ default: {} }));
jest.unstable_mockModule('firebase-admin/auth', () => ({ getAuth: jest.fn(() => ({})) }));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({ sendPushNotification: jest.fn() }));

const usersRouter = (await import('./users.js')).default;
const app = express();
app.use(express.json());
app.use('/api/auth', usersRouter);

describe('User management authorization', () => {
  const adminHeaders = { 'x-mock-user-id': 'admin123', 'x-mock-user-role': 'admin' };

  it('allows a regular admin to list users for operational dashboards', async () => {
    const response = await request(app).get('/api/auth/users').set(adminHeaders);
    expect(response.status).toBe(200);
  });

  it.each([
    ['post', '/api/auth/add-user'],
    ['put', '/api/auth/admin-update-user/user123'],
    ['patch', '/api/auth/users/user123/account-status'],
    ['delete', '/api/auth/delete-user/user123'],
  ])('blocks a regular admin from %s %s', async (method, path) => {
    const response = await request(app)[method](path).set(adminHeaders).send({});
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden: Barangay Captain access is required.');
  });

  it('allows the Barangay Captain through the create-account authorization gate', async () => {
    const response = await request(app)
      .post('/api/auth/add-user')
      .set('x-mock-user-id', 'captain123')
      .set('x-mock-user-role', 'super_admin')
      .send({ username: 'Staff Admin', email: 'staff@example.com', password: 'Temporary!Pass1', role: 'admin' });

    // The mocked existing-user check proves the handler was reached without
    // creating a Firebase or MongoDB account during this authorization test.
    expect(response.status).toBe(409);
  });
});
