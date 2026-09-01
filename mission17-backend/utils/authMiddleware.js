/**
 * Shared authentication, authorization, and audit helpers.
 */

import '../config/firebase-admin.js';
import { getAuth } from 'firebase-admin/auth';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const logAudit = async (userId, username, action, details, req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    new AuditLog({ userId, username, action, details, ipAddress }).save()
      .then(() => console.log(`AUDIT: ${action} by ${username}`))
      .catch((error) => console.error('Audit log error:', error));
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const getRequestToken = (req) => {
  const authorization = req.header('Authorization');
  return req.header('auth-token') || authorization?.replace(/^Bearer\s+/i, '');
};

const getVerifiedFirebaseToken = async (req) => {
  const token = getRequestToken(req);
  if (!token) {
    const error = new Error('Authentication token is required.');
    error.status = 401;
    throw error;
  }

  return getAuth().verifyIdToken(token);
};

// Verifies Firebase identity without requiring a MongoDB user record. This is
// used only for the initial account-sync route, where the MongoDB record may
// not exist yet. It must be placed before any upload middleware.
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    req.firebaseUser = await getVerifiedFirebaseToken(req);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};

const getAuthenticatedUser = async (req) => {
  const decodedToken = await getVerifiedFirebaseToken(req);
  const user = await User.findOne({ firebaseUid: decodedToken.uid });

  if (!user) {
    const error = new Error('Your account is not registered in this service.');
    error.status = 401;
    throw error;
  }

  if (user.accountStatus === 'rejected') {
    const error = new Error('Your account registration was rejected.');
    error.status = 403;
    throw error;
  }

  if (user.accountStatus === 'pending') {
    const error = new Error('Your account is awaiting administrator approval.');
    error.status = 403;
    throw error;
  }

  return user;
};

export const verifyAuthenticatedUser = async (req, res, next) => {
  try {
    req.user = await getAuthenticatedUser(req);
    return next();
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ message: status === 401 ? 'Authentication failed.' : error.message });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: administrators only.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ message: status === 401 ? 'Authentication failed.' : error.message });
  }
};
