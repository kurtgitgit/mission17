import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('../models/Notification.js', () => ({
  default: { find: jest.fn(), deleteMany: jest.fn() },
}));
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAuthenticatedUser: (_req, _res, next) => next(),
}));

const { default: Notification } = await import('../models/Notification.js');
const { default: notificationsRouter } = await import('./notifications.js');

let currentUser;
const app = express();
app.use((req, _res, next) => {
  req.user = currentUser;
  next();
});
app.use(notificationsRouter);

describe('notification clearing', () => {
  beforeEach(() => {
    currentUser = { _id: 'resident-1', role: 'resident' };
    Notification.find.mockReset();
    Notification.deleteMany.mockReset();
  });

  it('returns an empty notification history as a private non-cacheable array', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    Notification.find.mockReturnValue(query);

    const response = await request(app).get('/notifications/resident-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(response.headers['cache-control']).toMatch(/private/i);
    expect(response.headers['cache-control']).toMatch(/no-store/i);
    expect(Notification.find).toHaveBeenCalledWith({ userId: 'resident-1' });
  });

  it("permanently clears only the signed-in resident's notification history", async () => {
    Notification.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const response = await request(app).delete('/notifications/resident-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Notifications cleared.', deletedCount: 3 });
    expect(Notification.deleteMany).toHaveBeenCalledWith({ userId: 'resident-1' });
  });

  it("rejects a resident trying to clear another resident's notifications", async () => {
    const response = await request(app).delete('/notifications/resident-2');

    expect(response.status).toBe(403);
    expect(Notification.deleteMany).not.toHaveBeenCalled();
  });

  it("allows an administrator to clear the selected resident's notifications", async () => {
    currentUser = { _id: 'admin-1', role: 'admin' };
    Notification.deleteMany.mockResolvedValue({ deletedCount: 1 });

    const response = await request(app).delete('/notifications/resident-2');

    expect(response.status).toBe(200);
    expect(Notification.deleteMany).toHaveBeenCalledWith({ userId: 'resident-2' });
  });
});
