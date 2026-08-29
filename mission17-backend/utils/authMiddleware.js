/**
 * Shared Auth Middleware & Helpers
 * Location: utils/authMiddleware.js
 *
 * Centralises verifyAdmin and logAudit so all route files
 * can import them instead of redefining them locally.
 */

import admin from '../config/firebase-admin.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// 📝 AUDIT LOG HELPER
// ==========================================
export const logAudit = async (userId, username, action, details, req) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // ⚡ OPTIMIZATION: Don't 'await' the save so the user doesn't wait for the DB write
    new AuditLog({ userId, username, action, details, ipAddress: ip }).save()
      .then(() => console.log(`📝 AUDIT: ${action} by ${username}`))
      .catch(err => console.error("Audit Log Error:", err));
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};

// ==========================================
// 🛡️ ADMIN-ONLY MIDDLEWARE (RBAC)
// ==========================================
export const verifyAdmin = async (req, res, next) => {
  const token =
    req.header('auth-token') ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token)
    return res.status(401).json({ message: '⛔ Access Denied: No Token Provided' });

  try {
    const { getAuth } = await import('firebase-admin/auth');
    let uid = null;

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (firebaseErr) {
      // In development fallback, check if token matches an active admin userId or mock
      if (token.length === 24) {
        const directUser = await User.findById(token);
        if (directUser && directUser.role === 'admin') {
          req.user = directUser;
          return next();
        }
      }
      return res.status(401).json({ message: '⛔ Session Expired. Please log in again.', error: firebaseErr.message });
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '⛔ Forbidden: Admins Only' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Authentication failed', error: err.message });
  }
};

