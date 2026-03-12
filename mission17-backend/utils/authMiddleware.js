/**
 * Shared Auth Middleware & Helpers
 * Location: utils/authMiddleware.js
 *
 * Centralises verifyAdmin and logAudit so all route files
 * can import them instead of redefining them locally.
 */

import jwt from 'jsonwebtoken';
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
export const verifyAdmin = (req, res, next) => {
  const token =
    req.header('auth-token') ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token)
    return res.status(401).json({ message: '⛔ Access Denied: No Token Provided' });

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in .env');

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (verified.role !== 'admin') {
      return res.status(403).json({ message: '⛔ Forbidden: Admins Only' });
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};
