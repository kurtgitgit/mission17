/**
 * Auth Routes
 * Location: routes/auth.js
 * Prefix:   /api/auth  (mounted in index.js)
 *
 * Handles ONLY authentication & account security:
 *  POST /signup          — Register new student
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
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js'; 
import Mission from '../models/Mission.js';
import Event from '../models/Event.js'; // 👈 Import the new model
import { spotCheckMiddleware } from '../utils/spotCheck.js'; // 🛡️ Import Spot Check
import { awardSdgPoints } from '../utils/blockchain.js'; // ⛓️ Import blockchain helper
import { sanitizeAiResponse } from '../utils/privacy.js'; // 🛡️ Import Privacy Masking
import { logAudit, verifyAdmin } from '../utils/authMiddleware.js';

const router = express.Router();

// ==========================================
// 🔧 EMAIL HELPER (OTP)
// ==========================================
const sendOTP = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`🔍 DEBUG OTP for ${user.email}: ${otp}`);

  user.otpCode = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Mission 17 Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Login Code',
      text: `Your Mission 17 verification code is: ${otp}. It expires in 10 minutes.`,
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email Send Failed:', error);
  }
};

// ==========================================
// 🚦 RATE LIMITER (Brute Force Protection)
// ==========================================
// 🆕 Added to satisfy "Rate limiting for logins"
// 🛡️ SECURE CODE: NETWORK THROTTLING
// 🛡️ SECURE CODE: Rate Limiting for logins — max 5 attempts per 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: '⛔ Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================

// 1. REGISTER
router.post('/signup', async (req, res) => {
  let { username, email, password } = req.body; 
  try {
    if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'student',
      points: 0
    });

    await newUser.save();
    // 🔒 LOG ACTION
    logAudit(newUser._id, newUser.username, "SIGNUP", "New user account created", req);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 2. LOGIN (🛡️ UPDATED WITH MFA, AUDIT & RATE LIMITER)
// 🆕 Added 'loginLimiter' middleware here
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
        logAudit(user._id, user.username, "LOGIN_FAILED", "Failed login attempt (Wrong Password)", req);
        return res.status(400).json({ message: "Invalid Password!" });
    }

    if (req.body.isAdminLogin && user.role !== 'admin') {
      logAudit(user._id, user.username, "LOGIN_DENIED", "Unauthorized Admin login attempt", req);
      return res.status(403).json({ message: "⛔ Access Denied: Admins Only" });
    }

    if (user.mfaEnabled) {
      await sendOTP(user);
      return res.status(202).json({ 
        message: "OTP Sent", 
        mfaRequired: true, 
        userId: user._id 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    // 🔒 LOG ACTION
    logAudit(user._id, user.username, "LOGIN_SUCCESS", "User logged in successfully", req);

    const { password, ...others } = user._doc;
    res.status(200).json({ token, user: others });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// 3. VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otpCode !== otp || user.otpExpires < Date.now()) {
      logAudit(user._id, user.username, "MFA_FAILED", "Invalid or expired OTP entered", req);
      return res.status(400).json({ message: "Invalid or Expired Code" });
    }

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );
    
    logAudit(user._id, user.username, "MFA_SUCCESS", "MFA verification successful", req);

    const { password, ...others } = user._doc;
    res.status(200).json({ token, user: others });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. TOGGLE MFA
router.post('/toggle-mfa', async (req, res) => {
  const { userId, enable } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { mfaEnabled: enable }, { new: true });
    logAudit(userId, user?.username || "Unknown", "MFA_TOGGLE", `MFA set to ${enable}`, req);
    res.json({ message: `MFA is now ${enable ? 'Enabled' : 'Disabled'}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating MFA" });
  }
});

// 5. CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    logAudit(userId, user.username, 'PASSWORD_CHANGE', 'User successfully changed their password', req);
    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

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

// GET Events
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events" });
    }
});

// POST Event
router.post('/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: "Error creating event" });
    }
});

// DELETE Event
router.delete('/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting event" });
    }
});

// UPDATE Event
router.put('/events/:id', async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: "Error updating event" });
    }
});

// =================================================================
// 🛡️ SECURE AI PROXY (Prevents Model Inversion/Extraction Attacks)
// =================================================================
// This endpoint acts as a secure gatekeeper. The frontend calls this,
// and this endpoint calls the Python AI server internally. It receives
// the raw confidence score but ONLY returns a sanitized Pass/Fail result.
router.post('/analyze-proof', verifyAdmin, async (req, res) => {
    const { submissionId } = req.body;
    console.log(`🤖 Analyze Proof Requested for ID: ${submissionId}`);

    try {
        // 1. Fetch the submission to get the image URI
        const submission = await Submission.findById(submissionId);
        if (!submission || !submission.imageUri) {
            console.error("❌ Submission or imageUri missing");
            return res.status(404).json({ message: "Submission or image not found." });
        }

        // 2. Fetch the image data from the URI
        let imageBlob;
        try {
            console.log("📸 Fetching image from URI...");
            const imageResponse = await fetch(submission.imageUri);
            if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            imageBlob = await imageResponse.blob();
            console.log(`✅ Image fetched. Size: ${imageBlob.size} bytes, Type: ${imageBlob.type}`);
        } catch (fetchError) {
            console.error("❌ Error fetching image URI:", fetchError.message);
            throw new Error("Invalid Image Data in Database");
        }
        
        // 3. Forward the image to the Python AI Server
        let aiData;
        try {
            console.log(`🚀 Sending to AI Server: ${process.env.AI_SERVER_URL}`);
            const formData = new FormData();
            formData.append('file', imageBlob, 'proof.jpg');

            const aiResponse = await fetch(process.env.AI_SERVER_URL, {
                method: 'POST',
                body: formData,
            });

            if (!aiResponse.ok) {
                const errText = await aiResponse.text();
                throw new Error(`AI Server Error (${aiResponse.status}): ${errText}`);
            }
            aiData = await aiResponse.json();
            console.log("✅ AI Response received");
        } catch (aiError) {
            console.error("❌ Error communicating with AI Server:", aiError.message);
            if (aiError.cause && aiError.cause.code === 'ECONNREFUSED') {
                throw new Error("AI Server is offline. Is app.py running?");
            }
            throw aiError;
        }

        // 4. SANITIZE THE RESPONSE (The Core Mitigation)
        // 🛡️ SECURE CODE: Output Sanitization.
        // Prevents Model Extraction by hiding raw confidence scores from the client.
        // 🛡️ SECURE CODE: RESPONSE MASKING
        const sanitizedResponse = sanitizeAiResponse(aiData);

        res.json(sanitizedResponse);
    } catch (error) {
        console.error("❌ Final Error in /analyze-proof:", error.message);
        res.status(500).json({ message: "Error during AI analysis.", error: error.message });
    }
});

export default router;
