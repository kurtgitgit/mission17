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
    if (req.headers['x-mock-user-role'] === 'admin') {
      req.user = { _id: req.headers['x-mock-user-id'], role: 'admin' };
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
jest.unstable_mockModule('../models/User.js', () => ({ default: {} }));
jest.unstable_mockModule('../models/Notification.js', () => ({ default: {} }));
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

// Setup Express app for Supertest
const app = express();
app.use(express.json());
app.use('/api/blotter-reports', blotterRouter);

describe('Blotter Reports API (IDOR & RBAC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
});
