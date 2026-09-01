import { jest } from '@jest/globals';

// 1. Mock dependencies BEFORE dynamic imports
jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
}));

jest.unstable_mockModule('../config/firebase-admin.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/AuditLog.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({}),
  })),
}));

// 2. Dynamically import the module under test
const { verifyFirebaseToken, verifyAuthenticatedUser, verifyAdmin } = await import('./authMiddleware.js');
const { getAuth } = await import('firebase-admin/auth');
const User = (await import('../models/User.js')).default;

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyFirebaseToken', () => {
    it('should return 401 if token is missing', async () => {
      req.header.mockReturnValue(null);
      
      await verifyFirebaseToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if token is valid', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      
      await verifyFirebaseToken(req, res, next);
      
      expect(getAuth().verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(req.firebaseUser.uid).toBe('firebase-123');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyAuthenticatedUser', () => {
    it('should return 401 if user not found in MongoDB', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      User.findOne.mockResolvedValueOnce(null);
      
      await verifyAuthenticatedUser(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed.' });
    });

    it('should return 403 if account is pending', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      User.findOne.mockResolvedValueOnce({ accountStatus: 'pending' });
      
      await verifyAuthenticatedUser(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Your account is awaiting administrator approval.' });
    });

    it('should call next for approved user', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      const mockUser = { accountStatus: 'approved', _id: 'mongo-456' };
      User.findOne.mockResolvedValueOnce(mockUser);
      
      await verifyAuthenticatedUser(req, res, next);
      
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyAdmin', () => {
    it('should return 403 if user is not admin', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      User.findOne.mockResolvedValueOnce({ accountStatus: 'approved', role: 'resident' });
      
      await verifyAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: administrators only.' });
    });

    it('should call next if user is admin', async () => {
      req.header = jest.fn((name) => name === 'Authorization' ? 'Bearer valid-token' : null);
      getAuth().verifyIdToken.mockResolvedValueOnce({ uid: 'firebase-123' });
      const mockAdmin = { accountStatus: 'approved', role: 'admin' };
      User.findOne.mockResolvedValueOnce(mockAdmin);
      
      await verifyAdmin(req, res, next);
      
      expect(req.user).toBe(mockAdmin);
      expect(next).toHaveBeenCalled();
    });
  });
});
