import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit'; // 🆕 IMPORT RATE LIMITER
import mongoose from 'mongoose';
import User from '../models/User.js';
import Submission from '../models/Submission.js'; 
import Mission from '../models/Mission.js';
import AuditLog from '../models/AuditLog.js'; 
import Event from '../models/Event.js'; // 👈 Import the new model
import { spotCheckMiddleware } from '../utils/spotCheck.js'; // 🛡️ Import Spot Check
import { awardSdgPoints } from '../utils/blockchain.js'; // ⛓️ Import blockchain helper

const router = express.Router();

// ==========================================
// 🔧 HELPERS: LOGGING & EMAIL
// ==========================================

// 1. Audit Log Helper (Satisfies "Audit logging enabled")
const logAudit = async (userId, username, action, details, req) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await new AuditLog({ 
        userId, 
        username, 
        action, 
        details, 
        ipAddress: ip 
    }).save();
    console.log(`📝 AUDIT: ${action} by ${username}`); 
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};

// 2. Helper: Send OTP Email
const sendOTP = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  
  console.log(`🔐 DEBUG OTP for ${user.email}: ${otp}`); 

  user.otpCode = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; 
  await user.save();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Mission 17 Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Login Code',
      text: `Your Mission 17 verification code is: ${otp}. It expires in 10 minutes.`
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Email Send Failed:", error);
  }
};

// ==========================================
// 🛡️ SECURITY MIDDLEWARE (RBAC & Auth)
// ==========================================
const verifyAdmin = (req, res, next) => {
  const token = req.header('auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) return res.status(401).json({ message: "⛔ Access Denied: No Token Provided" });

  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing in .env");
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: "⛔ Forbidden: Admins Only" });
    }
    
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// ==========================================
// 🚦 RATE LIMITER (Prevents Brute Force)
// ==========================================
// 🆕 Added to satisfy "Rate limiting for logins"
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    message: { message: "⛔ Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
    // 📝 LOG ACTION
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

    // 📝 LOG ACTION
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

// ==========================================
// 🌍 STUDENT ROUTES
// ==========================================

// 5. SUBMIT MISSION
// 🛡️ SECURE CODE: HITL (Human-in-the-Loop) Middleware applied here.
// Randomly flags high-confidence AI results for manual review to catch adversarial attacks.
router.post('/submit-mission', spotCheckMiddleware, async (req, res) => {
  const { userId, missionId, missionTitle, image } = req.body; 
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newSubmission = new Submission({
      userId: user._id,
      username: user.username,
      missionId,
      missionTitle,
      imageUri: image, 
      status: req.missionStatus || 'Pending' // 🛡️ Use Spot Check status if available
    });

    await newSubmission.save();
    logAudit(userId, user.username, "MISSION_SUBMISSION", `Submitted mission: ${missionTitle}`, req);
    res.json({ 
      message: "Mission submitted for review!",
      status: newSubmission.status, // 👈 Return status so we can check if it was flagged
      submission: newSubmission // ✅ Return the full submission object
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 6. FETCH ALL MISSIONS
router.get('/all-missions', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ sdgNumber: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching missions" });
  }
});

// 7. LEADERBOARD
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({ role: { $ne: 'admin' } })
      .select('username points')
      .sort({ points: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

// 8. USER HISTORY
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID format" });
    }

    // ⚡ OPTIMIZED QUERY:
    // 1. .select('-imageUri') -> Don't send the heavy base64 image string in the list (saves bandwidth)
    // 2. .limit(20) -> Only get the 20 most recent (Pagination)
    const submissions = await Submission.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50); 
        
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
});

// 9. GET USER PROFILE
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 10. UPDATE PROFILE
router.put('/update-profile/:id', async (req, res) => {
  try {
    const { username, bio, walletAddress } = req.body; 
    
    // Only update fields that are provided to prevent overwriting with undefined
    const updateData = {};
    if (username) updateData.username = username;
    if (bio) updateData.bio = bio;
    if (walletAddress) updateData.walletAddress = walletAddress;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    // Use updatedUser.username to ensure we log the correct name (req.body.username might be undefined)
    logAudit(req.params.id, updatedUser.username, "PROFILE_UPDATE", "User updated profile information", req);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ==========================================
// 🔐 ADMIN ROUTES (RBAC Enforced)
// ==========================================

// 11. GET ALL USERS
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 12. GET PENDING SUBMISSIONS
router.get('/pending-submissions', verifyAdmin, async (req, res) => {
  try {
    // 🛡️ UPDATE: Fetch both 'Pending' AND 'Pending Admin Review'
    const pending = await Submission.find({ 
      status: { $in: ['Pending', 'Pending Admin Review'] } 
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 13. APPROVE MISSION (Audit Added)
router.post('/approve-mission', verifyAdmin, async (req, res) => {
  const { submissionId } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });
    
    const user = await User.findById(sub.userId);
    if (!user) {
      return res.status(404).json({ message: "User associated with submission not found." });
    }

    // ⛓️ Step 1: Award points on the blockchain
    // NOTE: This assumes your User model has a 'walletAddress' field.
    if (!user.walletAddress) {
      console.warn(`🟡 User ${user.username} has no wallet address. Skipping POINTS transaction.`);
      // If you require a wallet address to approve, uncomment the next line:
      // return res.status(400).json({ message: "User has no wallet address. Cannot send blockchain transaction." });
    }

    const pointsToAward = 100;
    let txHash = null;

    try {
      // Only attempt the transaction if a wallet address is present
      if (user.walletAddress) {
        // 🛡️ SECURE CODE: Blockchain Integration.
        // Awards points on-chain using dynamic gas fees to ensure reliability.
        txHash = await awardSdgPoints(user.walletAddress, pointsToAward);
      }
    } catch (blockchainError) {
      // If the blockchain part fails, we stop the entire process.
      return res.status(500).json({ 
        message: "Blockchain transaction failed. Mission not approved.",
        error: blockchainError.message 
      });
    }

    // ✅ Step 2: If blockchain is successful (or was skipped), update the database.
    sub.status = 'Approved';
    sub.blockchainTxHash = txHash || 'SKIPPED_NO_ADDRESS';
    user.points = (user.points || 0) + pointsToAward;
    
    await Promise.all([sub.save(), user.save()]);

    logAudit(req.user.id, req.user.username, "ADMIN_APPROVE", `Approved mission ${submissionId}. TX: ${txHash || 'Skipped'}`, req);
    res.json({ message: "Approved!", txHash });
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Approval Error", error: error.message });
  }
});

// 14. REJECT MISSION (Audit Added)
router.post('/reject-mission', verifyAdmin, async (req, res) => {
  const { submissionId, reason } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    sub.status = 'Rejected';
    sub.rejectionReason = reason || "No reason provided"; 
    await sub.save();
    logAudit(req.user.id, req.user.username, "ADMIN_REJECT", `Rejected mission submission ${submissionId}. Reason: ${reason}`, req);
    res.json({ message: "Mission rejected." });
  } catch (error) {
    res.status(500).json({ message: "Rejection Error" });
  }
});

// 15. CREATE MISSION
router.post('/add-mission', verifyAdmin, async (req, res) => {
  try {
    const newMission = new Mission(req.body);
    await newMission.save();
    logAudit(req.user.id, req.user.username, "ADMIN_MISSION_CREATE", `Created new mission: ${req.body.title}`, req);
    res.status(201).json({ message: "Mission created!" });
  } catch (error) {
    res.status(500).json({ message: "Error creating mission" });
  }
});

// 16. DELETE MISSION
router.delete('/delete-mission/:id', verifyAdmin, async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    logAudit(req.user.id, req.user.username, "ADMIN_MISSION_DELETE", `Deleted mission ID: ${req.params.id}`, req);
    res.json({ message: "Mission deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 17. UPDATE MISSION
router.put('/update-mission/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedMission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    logAudit(req.user.id, req.user.username, "ADMIN_MISSION_UPDATE", `Updated mission ID: ${req.params.id}`, req);
    res.json(updatedMission);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 18. ADMIN ADD USER
router.post('/add-user', verifyAdmin, async (req, res) => {
  let { username, email, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword, role: role || 'student' });
    await newUser.save();
    logAudit(req.user.id, req.user.username, "ADMIN_USER_CREATE", `Admin created user: ${username}`, req);
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// 19. ADMIN UPDATE USER
router.put('/admin-update-user/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    logAudit(req.user.id, req.user.username, "ADMIN_USER_UPDATE", `Admin updated user ID: ${req.params.id}`, req);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 20. ADMIN DELETE USER
router.delete('/delete-user/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    logAudit(req.user.id, req.user.username, "ADMIN_USER_DELETE", `Admin deleted user ID: ${req.params.id}`, req);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 21. CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect old password" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save(); 
    logAudit(userId, user.username, "PASSWORD_CHANGE", "User successfully changed their password", req);
    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🆕 VIEW AUDIT LOGS (Satisfies checklist)
router.get('/audit-logs', verifyAdmin, async (req, res) => {
    try {
      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching logs" });
    }
});

// ==========================================
// 📅 EVENT ROUTES (Consolidated)
// ==========================================

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
        const sanitizedResponse = {
            verdict: aiData.verdict,
            prediction: aiData.prediction,
            isVerified: aiData.is_verified,
            sdg: aiData.sdg,
            message: aiData.message
        };

        res.json(sanitizedResponse);
    } catch (error) {
        console.error("❌ Final Error in /analyze-proof:", error.message);
        res.status(500).json({ message: "Error during AI analysis.", error: error.message });
    }
});

export default router;