import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// 1. Mock middlewares BEFORE importing the router
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAuthenticatedUser: jest.fn((req, res, next) => {
    // We will control req.user from our tests using a custom header
    if (req.headers['x-mock-user-id']) {
      req.user = { 
        _id: req.headers['x-mock-user-id'], 
        role: req.headers['x-mock-user-role'] || 'resident' 
      };
      return next();
    }
    return res.status(401).json({ message: 'Authentication failed.' });
  }),
  verifyAdmin: jest.fn((req, res, next) => {
    const role = req.headers['x-mock-user-role'];
    if (['admin', 'super_admin'].includes(role)) {
      req.user = { _id: req.headers['x-mock-user-id'], role };
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: administrators only.' });
  }),
  logAudit: jest.fn()
}));

// Mock Models and external services
jest.unstable_mockModule('../models/BlotterReport.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
  }
}));
jest.unstable_mockModule('../models/User.js', () => ({ default: { findById: jest.fn() } }));
jest.unstable_mockModule('../models/Notification.js', () => ({ default: { create: jest.fn() } }));
jest.unstable_mockModule('../utils/blockchain.js', () => ({ awardSdgPoints: jest.fn() }));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({ sendPushNotification: jest.fn() }));

const fsMock = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
};
jest.unstable_mockModule('fs', () => ({
  default: fsMock,
  existsSync: fsMock.existsSync,
  mkdirSync: fsMock.mkdirSync,
}));

// 2. Import router dynamically after mocking
const blotterRouter = (await import('./blotter-reports.js')).default;
const BlotterReport = (await import('../models/BlotterReport.js')).default;
const User = (await import('../models/User.js')).default;
const Notification = (await import('../models/Notification.js')).default;

// Setup Express app for Supertest
const app = express();
app.use(express.json());
app.use('/api/blotter-reports', blotterRouter);

describe('Blotter Reports API (IDOR & RBAC)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'mission17-test';
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('GET /api/blotter-reports/my/:userId', () => {
    it('should allow user to view their own reports', async () => {
      BlotterReport.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ referenceNumber: 'REP123' }])
      });

      const res = await request(app)
        .get('/api/blotter-reports/my/user123')
        .set('x-mock-user-id', 'user123');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ referenceNumber: 'REP123' }]);
    });

    it('should block user from viewing another user\'s reports (IDOR)', async () => {
      const res = await request(app)
        .get('/api/blotter-reports/my/user999')
        .set('x-mock-user-id', 'user123');
      
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: you can only view your own reports.');
    });
  });

  describe('GET /api/blotter-reports/:id/evidence', () => {
    it('should block user from viewing evidence of a report they do not own', async () => {
      // Mock the report as belonging to 'user999'
      BlotterReport.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          userId: 'user999',
          evidenceUrl: '/uploads/secret.jpg'
        })
      });

      const res = await request(app)
        .get('/api/blotter-reports/reportABC/evidence')
        .set('x-mock-user-id', 'user123'); // requester is user123
      
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: you cannot view this evidence.');
    });

    it('should allow the owner to view their own evidence', async () => {
      BlotterReport.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          userId: 'user123',
          evidenceUrl: '/uploads/my-secret.jpg'
        })
      });
      fsMock.existsSync.mockReturnValue(true);

      const res = await request(app)
        .get('/api/blotter-reports/reportABC/evidence')
        .set('x-mock-user-id', 'user123'); // requester is user123 (the owner)
      
      // Expected to either return the file or 404 if file missing, but NOT 403
      // Since it's a file send, supertest might get binary. We just check status.
      // Wait, since we can't easily mock res.sendFile in supertest to return content safely without a real file, 
      // we can just check it doesn't return 403. 
      // Actually express will try to send the file and fail because the path doesn't exist on disk, resulting in 404 or 500.
      // Let's just expect it not to be 403.
      expect(res.status).not.toBe(403);
    });

    it('should allow admin to view evidence of any report', async () => {
      BlotterReport.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          userId: 'user999',
          evidenceUrl: '/uploads/secret.jpg'
        })
      });
      fsMock.existsSync.mockReturnValue(true);

      const res = await request(app)
        .get('/api/blotter-reports/reportABC/evidence')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin'); // requester is admin
      
      expect(res.status).not.toBe(403);
    });

    it('should proxy an approved Cloudinary image for an administrator', async () => {
      BlotterReport.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          userId: 'user999',
          evidenceUrl: 'https://res.cloudinary.com/mission17-test/image/upload/v1/blotter/evidence.webp'
        })
      });
      global.fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((name) => name === 'content-type' ? 'image/webp' : '4')
        },
        arrayBuffer: jest.fn().mockResolvedValue(Uint8Array.from([1, 2, 3, 4]).buffer)
      });

      const res = await request(app)
        .get('/api/blotter-reports/reportABC/evidence')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should reject external evidence hosts without fetching them', async () => {
      BlotterReport.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          userId: 'user123',
          evidenceUrl: 'https://example.com/private.jpg'
        })
      });

      const res = await request(app)
        .get('/api/blotter-reports/reportABC/evidence')
        .set('x-mock-user-id', 'user123');

      expect(res.status).toBe(404);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/blotter-reports/:id/status', () => {
    const makeReport = () => ({
      _id: 'reportABC',
      userId: 'user123',
      referenceNumber: 'BLOTTER-2026-12345',
      status: 'Pending',
      hearingStage: 'None',
      hearingDate: null,
      blockchainTxHash: null,
      save: jest.fn().mockResolvedValue(undefined),
    });

    beforeEach(() => {
      Notification.create.mockResolvedValue({});
      User.findById.mockResolvedValue(null);
    });

    it('blocks a regular admin from changing the case status', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({ status: 'In Progress' });

      expect(res.status).toBe(403);
      expect(report.save).not.toHaveBeenCalled();
    });

    it('requires a hearing date and presiding officer before a regular admin can schedule a hearing', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({ status: 'Pending', hearingStage: 'Mediation (1st Hearing)' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('hearing date and time');
      expect(report.save).not.toHaveBeenCalled();
    });

    it('requires a presiding officer before a regular admin can schedule a hearing', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({
          status: 'Pending',
          hearingStage: 'Mediation (1st Hearing)',
          hearingDate: '2026-09-26T09:30:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('presiding officer');
      expect(report.save).not.toHaveBeenCalled();
    });

    it('allows a regular admin to maintain complete hearing details without changing status', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({
          status: 'Pending',
          respondentName: 'Respondent',
          hearingStage: 'Mediation (1st Hearing)',
          hearingDate: '2026-09-26T09:30:00.000Z',
          luponOfficerInCharge: 'Lupon Chair',
        });

      expect(res.status).toBe(200);
      expect(report.respondentName).toBe('Respondent');
      expect(report.hearingDate).toEqual(new Date('2026-09-26T09:30:00.000Z'));
      expect(report.luponOfficerInCharge).toBe('Lupon Chair');
      expect(report.save).toHaveBeenCalledTimes(1);
    });

    it('allows the Barangay Captain to approve a pending blotter', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'captain123')
        .set('x-mock-user-role', 'super_admin')
        .send({ status: 'In Progress' });

      expect(res.status).toBe(200);
      expect(report.status).toBe('In Progress');
      expect(report.save).toHaveBeenCalledTimes(1);
    });

    it('prevents the Barangay Captain from moving a case status backward', async () => {
      const report = { ...makeReport(), status: 'In Progress' };
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'captain123')
        .set('x-mock-user-role', 'super_admin')
        .send({ status: 'Pending' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('cannot move backward');
      expect(report.status).toBe('In Progress');
      expect(report.save).not.toHaveBeenCalled();
    });

    it('prevents a completed Lupon hearing stage from being selected again', async () => {
      const report = { ...makeReport(), hearingStage: 'Conciliation (2nd Hearing)' };
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({ status: 'Pending', hearingStage: 'Mediation (1st Hearing)' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('cannot move backward');
      expect(report.hearingStage).toBe('Conciliation (2nd Hearing)');
      expect(report.save).not.toHaveBeenCalled();
    });

    it('locks a terminal Lupon outcome from further stage changes', async () => {
      const report = { ...makeReport(), hearingStage: 'Amicable Settlement' };
      BlotterReport.findById.mockResolvedValue(report);

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'admin123')
        .set('x-mock-user-role', 'admin')
        .send({ status: 'Pending', hearingStage: 'Issued Certificate to File Action (CFA)' });

      expect(res.status).toBe(409);
      expect(report.save).not.toHaveBeenCalled();
    });

    it('keeps a Captain dismissal successful when resident notification fails', async () => {
      const report = makeReport();
      BlotterReport.findById.mockResolvedValue(report);
      Notification.create.mockRejectedValueOnce(new Error('notification unavailable'));

      const res = await request(app)
        .patch('/api/blotter-reports/reportABC/status')
        .set('x-mock-user-id', 'captain123')
        .set('x-mock-user-role', 'super_admin')
        .send({ status: 'Dismissed' });

      expect(res.status).toBe(200);
      expect(report.status).toBe('Dismissed');
      expect(report.save).toHaveBeenCalledTimes(1);
    });
  });
});
