/**
 * Auth Routes
 * Location: routes/auth.js
 * Prefix:   /api/auth  (mounted in index.js)
 *
 * Handles ONLY authentication & account security:
 *  POST /signup          — Register new resident
 *  POST /login           — Login (with MFA check)
 *  POST /verify-otp      — Submit MFA OTP code
 *  POST /toggle-mfa      — Enable / disable MFA
 *  PUT  /change-password — Change own password
 *  GET  /audit-logs      — Admin: view audit trail
 *
 * All other domains (submissions, missions, events, users)
 * are handled in their own route files.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import rateLimit from 'express-rate-limit';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { logAudit, verifyAdmin, verifyAuthenticatedUser, verifyFirebaseToken } from '../utils/authMiddleware.js';
import multer from 'multer';
import path from 'path';

// ==========================================
// 📂 MULTER CONFIGURATION FOR FILE UPLOADS
// ==========================================
import { upload } from '../utils/upload.js';
import {
  createLegalConsentRecord,
  hasCurrentLegalConsent
} from '../utils/legalConsent.js';
import { normalizeResidentProfile, validateResidentProfile } from '../utils/residentProfileValidation.js';

// 🛡️ ANTI-FRAUD: Known disposable email domains
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
  'dispostable.com', 'getnada.com', 'boun.cr'
];

const isDisposableEmail = (email) => {
  const domain = email.split('@')[1];
  return DISPOSABLE_DOMAINS.includes(domain);
};


const router = express.Router();

const isStrongPassword = (password) => typeof password === 'string'
  && password.length >= 8
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /\d/.test(password)
  && /[^A-Za-z0-9]/.test(password);

const GMAIL_OAUTH_REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const encodeGmailMessage = ({ from, to, subject, text, html }) => {
  const cleanHeader = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const boundary = `mission17-${Date.now()}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(cleanHeader(subject), 'utf8').toString('base64')}?=`;
  const message = [
    `From: "Mission 17" <${cleanHeader(from)}>`,
    `To: ${cleanHeader(to)}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`
  ].join('\r\n');

  return Buffer.from(message, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendGmailEmail = async ({ to, subject, text, html }) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, EMAIL_USER } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !EMAIL_USER) {
    throw new Error('Gmail API is not fully configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and EMAIL_USER.');
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GMAIL_OAUTH_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodeGmailMessage({ from: EMAIL_USER, to, subject, text, html })
    }
  });
};
// ==========================================
// 🔧 EMAIL HELPER (OTP)
// ==========================================
const sendOTP = async (user, type = 'mfa') => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const isSignup = type === 'signup';
  const subject = isSignup ? 'Activate Your Account - Welcome to Mission 17!' : 'Security Verification Code - Mission 17';
  const title = isSignup ? 'Welcome to the Mission!' : 'Your Login Code';
  const subtitle = isSignup
    ? `We're excited to have you, ${user.username}! To finish setting up your account and start your journey, please verify your email:`
    : 'To complete your sign in, please use the following verification code:';

  try {
    const htmlTemplate = `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MISSION <span style="color: #3b82f6;">17</span></h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Security Verification</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 10px; padding: 40px; text-align: center; border: 1px solid #f3f4f6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.01);">
          <h2 style="color: #374151; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">${title}</h2>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">${subtitle}</p>
          
          <div style="background: linear-gradient(to right, #eff6ff, #f8fafc); border: 2px dashed #93c5fd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af;">${otp}</span>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">⏳ This code expires in 10 minutes.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">If you didn't request this code, you can safely ignore this email. Your account remains secure.</p>
        </div>
      </div>
    `;

    await sendGmailEmail({
      to: user.email,
      subject,
      text: `${title}: ${otp}. It expires in 10 minutes.`,
      html: htmlTemplate
    });
    // Replace the current code only after the new one was accepted by the
    // email provider. A failed resend must not invalidate a still-valid code.
    await User.findByIdAndUpdate(user._id, {
      otpCode: otp,
      otpExpires: Date.now() + 10 * 60 * 1000
    });
    console.log(`OTP email sent successfully to ${user.email} via Gmail API.`);
    return true;
  } catch (error) {
    console.error('OTP email send failed:', error?.message || error);
    return false;
  }
};

// ==========================================
// 💌 EMAIL HELPER (WELCOME)
// ==========================================
const sendWelcomeEmail = async (user) => {
  try {
    const htmlTemplate = `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MISSION <span style="color: #3b82f6;">17</span></h1>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 10px; padding: 40px; text-align: center; border: 1px solid #f3f4f6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.01);">
          <h2 style="color: #374151; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">Welcome to Mission 17!</h2>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">Hi <strong>${user.username}</strong>, your account has been successfully created!</p>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">We are thrilled to have you on board. Get ready to explore barangay services and participate in community activities!</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">You received this because you registered at Mission 17.</p>
        </div>
      </div>
    `;

    await sendGmailEmail({
      to: user.email,
      subject: 'Welcome to Mission 17!',
      text: 'Hi ' + user.username + ', welcome to Mission 17! Your account was successfully created.',
      html: htmlTemplate
    });
    console.log('Welcome email sent successfully to ' + user.email + ' via Gmail API.');
  } catch (error) {
    console.error('Welcome email send failed:', error?.message || error);
  }
};


// ==========================================
// 🚦 RATE LIMITER (Brute Force Protection)
// ==========================================
// 🛡️ SECURE CODE: Rate Limiting for logins — max 5 attempts per 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  // 👇 ADD THIS SKIP FUNCTION to un-bias the tests
  skip: (req) => {
    // If the request comes from localhost (your test script), don't block it!
    const clientIp = req.ip || req.connection.remoteAddress;
    return clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
  },
  message: { message: '⛔ Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP resend requests. Please wait before trying again.' }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please wait before trying again.' }
});

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================

// 1. SYNC USER (Called after Firebase Signup or Login)
const cpUpload = upload.fields([
  { name: 'validIdFront', maxCount: 1 },
  { name: 'validIdBack', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]);

router.post('/sync-user', verifyFirebaseToken, cpUpload, async (req, res) => {
  try {
    const decodedToken = req.firebaseUser;
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    let user = await User.findOne({ firebaseUid });

    // If not found by UID, check if they exist by email (Legacy Account Migration)
    if (!user && email) {
      user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
      if (user) {
        // Never attach an unverified Firebase identity to an existing account.
        // This prevents possession of an unverified matching email from taking
        // over a legacy MongoDB account.
        if (decodedToken.email_verified !== true) {
          return res.status(403).json({ message: 'Please verify your email before linking this account.' });
        }
        // Link the existing legacy account to the new Firebase UID using updateOne to bypass strict validation
        await User.updateOne({ _id: user._id }, { $set: { firebaseUid } });
        user.firebaseUid = firebaseUid; // Update local object for subsequent logic
        await logAudit(
          user._id,
          user.username,
          'FIREBASE_ACCOUNT_LINKED',
          'Legacy account linked after verified Firebase identity.',
          req
        );
      }
    }
    // If user already exists in MongoDB, just return it (Login Flow)
    if (user) {
      // A rejected resident may authenticate only far enough to see the review
      // reason and correct/resubmit their registration. This does not grant
      // any normal protected-route access (enforced in authMiddleware).
      if (user.accountStatus === 'rejected') {
        return res.status(200).json({ user, registrationActionRequired: true });
      }

      if (req.body.isAdminLogin && !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied: Admins only." });
      }

      // 🛡️ MFA (OTP) Check
      // We also trigger this for 'pending' users so they can verify their email!
      // Pending residents need an OTP only until their email is verified.
      // Admin accounts always require it; active residents follow their MFA setting.
      const requiresEmailVerification = user.accountStatus === 'pending' && user.isVerified !== true;
      if (requiresEmailVerification || ['admin', 'super_admin'].includes(user.role) || user.mfaEnabled) {
        if (user.otpCode && user.otpExpires && user.otpExpires.getTime() > Date.now()) {
          return res.status(200).json({ mfaRequired: true, tempUserId: user._id });
        }
        const delivered = await sendOTP(user, requiresEmailVerification ? 'signup' : 'mfa');
        if (!delivered) return res.status(502).json({ message: 'The verification code could not be delivered. Please try again later.' });
        await logAudit(user._id, user.username, "OTP_SENT", "OTP sent to email for two-factor verification", req);
        return res.status(200).json({ mfaRequired: true, tempUserId: user._id });
      }

      logAudit(user._id, user.username, "LOGIN_SUCCESS", "User synced successfully via Firebase", req);
      return res.status(200).json({ user });
    }

    // Otherwise, create a new user in MongoDB (Signup Flow)
    const { username } = req.body;

    // This applies only to a newly created resident record. Existing and legacy
    // accounts retain their historical access and are not backfilled here.
    if (!hasCurrentLegalConsent(req.body)) {
      return res.status(400).json({
        message: 'Please accept the current Privacy Notice and Terms of Use before creating an account.'
      });
    }

    const residentProfile = normalizeResidentProfile(req.body);
    const profileValidationError = validateResidentProfile(residentProfile, { requireCore: true, minimumAge: 18 });
    if (profileValidationError) return res.status(400).json({ message: profileValidationError });

    // Grab file URLs if they exist
    const validIdFrontUrl = req.files && req.files['validIdFront'] ? req.files['validIdFront'][0].path : null;
    const validIdBackUrl = req.files && req.files['validIdBack'] ? req.files['validIdBack'][0].path : null;
    const profileImageUrl = req.files && req.files['profileImage'] ? req.files['profileImage'][0].path : null;
    if (!validIdFrontUrl || !validIdBackUrl) {
      return res.status(400).json({ message: 'Clear photos of both the front and back of a valid ID are required.' });
    }

    // Use firstName+lastName for the auto-generated username
    const generatedUsername = `${residentProfile.firstName}${residentProfile.lastName}`.replace(/\s+/g, '') + firebaseUid.slice(-6);
    const requestedUsername = typeof username === 'string' ? username.trim() : '';
    const cleanUsername = requestedUsername || generatedUsername || (email ? email.split('@')[0] + firebaseUid.slice(-6) : '');

    user = new User({
      firebaseUid,
      username: cleanUsername,
      email: email,
      // New accounts are always residents. Elevated roles require a protected admin process.
      role: 'resident',
      isVerified: decodedToken.email_verified || false,
      accountStatus: 'pending',
      legalConsent: createLegalConsentRecord(),

      ...residentProfile,
      validIdFrontUrl, validIdBackUrl, profileImageUrl
    });

    await user.save();

    logAudit(user._id, user.username, "SIGNUP_INITIATED", "New account synced via Firebase", req);

    res.status(201).json({ message: "Account created and synced!", user });
  } catch (error) {
    console.error("Sync Error:", error);
    if (error?.name === 'ValidationError') return res.status(400).json({ message: error.message });
    if (error?.code === 11000) return res.status(409).json({ message: 'An account with the same username or email already exists.' });
    res.status(500).json({ message: "Failed to sync user data with Firebase." });
  }
});

// ==========================================
// ==========================================
// 🛡️ VERIFY OTP ROUTE (Nodemailer)
// ==========================================
router.post('/verify-otp', verifyFirebaseToken, otpVerifyLimiter, async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(401).json({ message: 'Your account is not registered in this service.' });
    }
    if (user.accountStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account registration was rejected.' });
    }

    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'A valid six-digit OTP is required.' });
    }

    if (user.otpCode !== otp || user.otpExpires < Date.now()) {
      logAudit(user._id, user.username, "LOGIN_FAILED", "Invalid or expired OTP", req);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP verifies email possession. It must never replace human account approval.
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          otpCode: null,
          otpExpires: null,
          isVerified: true
        }
      },
      { new: true }
    );

    logAudit(user._id, user.username, "OTP_VERIFIED", "Email OTP verified", req);
    res.json({ message: "OTP verified. Account approval is still required.", user: updatedUser });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// Request a fresh code without forcing the user to restart the login flow.
router.post('/resend-otp', verifyFirebaseToken, otpResendLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user || user.accountStatus === 'rejected') return res.status(403).json({ message: 'This account is not eligible to receive a verification code.' });
    const requiresOtp = user.accountStatus === 'pending' || ['admin', 'super_admin'].includes(user.role) || user.mfaEnabled;
    if (!requiresOtp) return res.status(400).json({ message: 'Two-factor authentication is not enabled for this account.' });

    const delivered = await sendOTP(user, user.accountStatus === 'pending' ? 'signup' : 'mfa');
    if (!delivered) return res.status(502).json({ message: 'The code could not be delivered. Please try again later.' });
    await logAudit(user._id, user.username, 'OTP_RESENT', 'OTP resent at user request.', req);
    return res.json({ message: 'A new verification code was sent to your registered email.' });
  } catch (error) {
    console.error('OTP resend error:', error);
    return res.status(500).json({ message: 'Unable to resend the verification code right now.' });
  }
});

// 4. TOGGLE MFA
router.post('/toggle-mfa', verifyAuthenticatedUser, async (req, res) => {
  const { enable } = req.body;
  try {
    if (typeof enable !== 'boolean') {
      return res.status(400).json({ message: 'enable must be a boolean.' });
    }

    if (['admin', 'super_admin'].includes(req.user.role) && enable === false) {
      return res.status(403).json({ message: 'Two-factor authentication is required for administrator accounts.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { mfaEnabled: enable }, { new: true });
    logAudit(user._id, user.username, "MFA_TOGGLE", `MFA set to ${enable}`, req);
    res.json({
      message: `MFA is now ${enable ? 'Enabled' : 'Disabled'}`,
      mfaEnabled: user.mfaEnabled,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating MFA" });
  }
});

// Firebase owns the actual password. This route stores only bcrypt hashes of
// recently accepted passwords, allowing each client to reject reuse before it
// asks Firebase to update the credential.
router.post('/password-history/:action', verifyAuthenticatedUser, async (req, res) => {
  const { action } = req.params;
  const { password } = req.body;
  if (!['validate', 'record'].includes(action)) return res.status(404).json({ message: 'Unknown password-history action.' });
  if (!isStrongPassword(password)) return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.' });

  try {
    const user = await User.findById(req.user._id).select('+passwordHistory');
    const hashes = user.passwordHistory || [];

    if (action === 'validate') {
      const wasUsed = (await Promise.all(hashes.map((hash) => bcrypt.compare(password, hash)))).some(Boolean);
      if (wasUsed) return res.status(400).json({ message: 'Choose a password you have not used recently.' });
      return res.json({ allowed: true });
    }

    const alreadyRecorded = (await Promise.all(hashes.map((hash) => bcrypt.compare(password, hash)))).some(Boolean);
    if (!alreadyRecorded) {
      const hash = await bcrypt.hash(password, 12);
      user.passwordHistory = [hash, ...hashes].slice(0, 5);
    }
    await user.save();
    await logAudit(user._id, user.username, 'PASSWORD_HISTORY_RECORDED', 'Password history updated after a credential change.', req);
    return res.json({ message: 'Password history updated.' });
  } catch (error) {
    console.error('Password history error:', error);
    return res.status(500).json({ message: 'Unable to validate password history right now.' });
  }
});

// ==========================================
// 🌐 GOOGLE AUTHENTICATION (Migrated to Firebase)
// ==========================================
// Google Sign-In is now handled on the client via Firebase Auth.
// The client gets a Firebase ID Token and passes it to /sync-user.


// ==========================================
// 🔐 ADMIN ROUTES
// ==========================================

// 6. VIEW AUDIT LOGS
router.get('/audit-logs', verifyAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// ==========================================
// 🔔 SAVE EXPO PUSH TOKEN
// ==========================================
router.post('/save-push-token', verifyAuthenticatedUser, async (req, res) => {
  const { expoPushToken } = req.body;
  if (typeof expoPushToken !== 'string' || !/^(?:ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(expoPushToken)) {
    return res.status(400).json({ message: "A valid Expo push token is required." });
  }

  try {
    await User.findByIdAndUpdate(req.user._id, { expoPushToken, pushNotificationsEnabled: true });
    res.json({ message: "Push token saved successfully." });
  } catch (error) {
    console.error("Error saving push token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/notification-preference', verifyAuthenticatedUser, async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') return res.status(400).json({ message: 'enabled must be a boolean.' });

  try {
    const update = enabled
      ? { $set: { pushNotificationsEnabled: true } }
      : { $set: { pushNotificationsEnabled: false }, $unset: { expoPushToken: 1 } };
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    await logAudit(user._id, user.username, 'PUSH_PREFERENCE_UPDATE', `Push notifications set to ${enabled}`, req);
    return res.json({
      message: `Push notifications are now ${enabled ? 'enabled' : 'disabled'}.`,
      pushNotificationsEnabled: user.pushNotificationsEnabled
    });
  } catch (error) {
    console.error('Notification preference error:', error);
    return res.status(500).json({ message: 'Could not update notification preferences.' });
  }
});

// Pending accounts cannot access normal authenticated routes, but a resident
// who has completed email verification may opt in to account-review pushes.
// The Firebase UID is derived from the verified token; no user ID is accepted
// from the client, preventing a device token from being attached to another user.
router.post('/save-pending-push-token', verifyFirebaseToken, async (req, res) => {
  const { expoPushToken } = req.body;
  if (typeof expoPushToken !== 'string' || !/^(?:ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(expoPushToken)) {
    return res.status(400).json({ message: 'A valid Expo push token is required.' });
  }

  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user || user.accountStatus !== 'pending' || !user.isVerified) {
      return res.status(403).json({ message: 'Only verified pending accounts can register for review updates.' });
    }

    user.expoPushToken = expoPushToken;
    user.pushNotificationsEnabled = true;
    await user.save();
    await logAudit(user._id, user.username, 'PENDING_PUSH_TOKEN_SAVED', 'Resident opted in to account-review notifications.', req);
    return res.json({ message: 'Account-review notifications enabled.' });
  } catch (error) {
    console.error('Error saving pending Expo push token:', error);
    return res.status(500).json({ message: 'Could not save notification preference.' });
  }
});

export default router;
