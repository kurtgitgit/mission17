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

const findById = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    find: jest.fn(() => userQuery),
    findById,
    countDocuments: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(true),
  },
}));
jest.unstable_mockModule('../models/Notification.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}) },
}));
jest.unstable_mockModule('firebase-admin/auth', () => ({ getAuth: jest.fn(() => ({})) }));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({ sendPushNotification: jest.fn().mockResolvedValue({ accepted: false }) }));

const usersRouter = (await import('./users.js')).default;
const User = (await import('../models/User.js')).default;
const app = express();
app.use(express.json());
app.use('/api/auth', usersRouter);

describe('User management authorization', () => {
  const adminHeaders = { 'x-mock-user-id': 'admin123', 'x-mock-user-role': 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    userQuery.select.mockReturnThis();
    userQuery.sort.mockReturnThis();
    userQuery.skip.mockReturnThis();
    userQuery.limit.mockResolvedValue([]);
    User.countDocuments.mockResolvedValue(0);
    User.exists.mockResolvedValue(true);
  });

  it('allows a regular admin to list resident accounts only', async () => {
    const response = await request(app).get('/api/auth/users').set(adminHeaders);
    expect(response.status).toBe(200);
    expect(User.find).toHaveBeenCalledWith({ role: 'resident' });
    expect(User.countDocuments).toHaveBeenCalledWith({ role: 'resident' });
  });

  it.each([
    ['post', '/api/auth/add-user'],
    ['put', '/api/auth/admin-update-user/user123'],
    ['delete', '/api/auth/delete-user/user123'],
  ])('blocks a regular admin from %s %s', async (method, path) => {
    const response = await request(app)[method](path).set(adminHeaders).send({});
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden: Barangay Captain access is required.');
  });

  it('allows a regular admin to approve a verified pending resident', async () => {
    const resident = {
      _id: 'resident123',
      role: 'resident',
      isVerified: true,
      accountStatus: 'pending',
      username: 'pending.resident',
      expoPushToken: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    findById.mockResolvedValueOnce(resident);

    const response = await request(app)
      .patch('/api/auth/users/resident123/account-status')
      .set(adminHeaders)
      .send({ accountStatus: 'approved' });

    expect(response.status).toBe(200);
    expect(resident.accountStatus).toBe('approved');
    expect(resident.save).toHaveBeenCalledTimes(1);
  });

  it('blocks a regular admin from reviewing a staff account', async () => {
    findById.mockResolvedValueOnce({
      _id: 'staff123',
      role: 'admin',
      isVerified: true,
      accountStatus: 'pending',
    });

    const response = await request(app)
      .patch('/api/auth/users/staff123/account-status')
      .set(adminHeaders)
      .send({ accountStatus: 'approved' });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/limited to resident registrations/i);
  });

  it('blocks a regular admin from changing an already reviewed resident', async () => {
    findById.mockResolvedValueOnce({
      _id: 'resident123',
      role: 'resident',
      isVerified: true,
      accountStatus: 'approved',
    });

    const response = await request(app)
      .patch('/api/auth/users/resident123/account-status')
      .set(adminHeaders)
      .send({ accountStatus: 'rejected', rejectionReason: 'Duplicate registration.' });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/only pending resident registrations/i);
  });

  it('allows a regular admin to inspect a resident ID submission', async () => {
    findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        role: 'resident',
        idType: 'National ID',
        validIdFrontUrl: 'https://example.com/front.jpg',
        validIdBackUrl: 'https://example.com/back.jpg',
      }),
    });

    const response = await request(app)
      .get('/api/auth/user-ids/resident123')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(response.body.idType).toBe('National ID');
  });

  it('blocks a regular admin from inspecting a staff ID record', async () => {
    findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        role: 'admin',
        idType: 'National ID',
        validIdFrontUrl: 'https://example.com/staff-front.jpg',
      }),
    });

    const response = await request(app)
      .get('/api/auth/user-ids/staff123')
      .set(adminHeaders);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/only inspect resident identification/i);
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
