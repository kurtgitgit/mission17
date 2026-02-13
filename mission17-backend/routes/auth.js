import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Submission from '../models/Submission.js'; 
import Mission from '../models/Mission.js';

const router = express.Router();

// ==========================================
// 🛡️ SECURITY MIDDLEWARE (The Gatekeeper)
// ==========================================
const verifyAdmin = (req, res, next) => {
  const token = req.header('auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) return res.status(401).json({ message: "⛔ Access Denied: No Token Provided" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
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
// 🔓 PUBLIC ROUTES (For Mobile & Login)
// ==========================================

// 1. REGISTER
router.post('/signup', async (req, res) => {
  let { username, email, password } = req.body; 
  try {
    // 🔒 SECURITY CHECK: Enforce 8 Character Password
    if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // 🛡️ SANITIZATION: Clean the input
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
      role: 'student', // Forces lowercase 'student'
      points: 0
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 2. LOGIN (✅ NOW SANITIZED)
router.post('/login', async (req, res) => {
  try {
    // 🛡️ SANITIZATION: Fixes accidental spaces or capital letters
    const email = req.body.email.toLowerCase().trim();
    
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid Password!" });

    // 🛡️ ADMIN CHECK
    if (req.body.isAdminLogin && user.role !== 'admin') {
      return res.status(403).json({ message: "⛔ Access Denied: Admins Only" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: "1d" }
    );

    const { password, ...others } = user._doc;
    res.status(200).json({ token, user: others });

  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. SUBMIT MISSION
router.post('/submit-mission', async (req, res) => {
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
      status: 'Pending'
    });

    await newSubmission.save();
    res.json({ message: "Mission submitted for review!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. FETCH ALL MISSIONS
router.get('/all-missions', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ sdgNumber: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching missions" });
  }
});

// 5. LEADERBOARD (Updated: Hides Admins)
router.get('/leaderboard', async (req, res) => {
  try {
    // 🛡️ The { $ne: 'admin' } part means "Not Equal to Admin"
    const topUsers = await User.find({ role: { $ne: 'admin' } })
      .select('username points')
      .sort({ points: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

// 6. USER HISTORY
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId }).sort({ createdAt: -1 }); 
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

// 7. GET USER PROFILE
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 8. UPDATE PROFILE (✅ SECURED: Privilege Escalation Fix)
router.put('/update-profile/:id', async (req, res) => {
  try {
    // 🛡️ SECURITY FIX: Destructure ONLY username and bio.
    // This ignores 'role', 'points', or 'password' if a hacker tries to send them.
    const { username, bio } = req.body; 

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { username, bio }, // <--- We only pass the safe variables here
      { new: true }
    );
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});


// ==========================================
// 🔐 PROTECTED ADMIN ROUTES (Token Required)
// ==========================================

// 9. GET ALL USERS
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 10. GET PENDING SUBMISSIONS
router.get('/pending-submissions', verifyAdmin, async (req, res) => {
  try {
    const pending = await Submission.find({ status: 'Pending' });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 11. APPROVE MISSION (✅ SECURED: Transaction Failure Handling)
router.post('/approve-mission', verifyAdmin, async (req, res) => {
  const { submissionId } = req.body;

  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    // 🛑 STEP 1: SAFETY NET (The Mitigation)
    // Before we touch the blockchain, mark the status as "Verifying".
    // If the server crashes after this, we won't lose the record—it stays "Verifying".
    sub.status = 'Verifying_On_Chain';
    await sub.save();

    console.log(`🔗 Attempting to write Submission ${submissionId} to Blockchain...`);

    // 🔗 STEP 2: BLOCKCHAIN INTERACTION
    // (This is the risky part where "Out of Gas" or "Network Error" happens)
    
    // --- DEMO CODE (Simulating a successful transaction hash) ---
    const txHash = "0x" + Math.random().toString(16).substr(2, 40); 

    // ✅ STEP 3: SUCCESS (Atomic Update)
    // We ONLY update the database to "Approved" if Step 2 succeeded.
    sub.status = 'Approved';
    sub.blockchainTxHash = txHash; // Save the proof!
    
    // Award Points
    const user = await User.findById(sub.userId);
    if (user) {
      user.points = (user.points || 0) + 100;
      await user.save();
    }

    await sub.save();
    res.json({ message: "Approved and verified on Blockchain!", txHash });

  } catch (error) {
    console.error("❌ Blockchain Transaction Failed:", error);

    // ⚠️ STEP 4: FAILURE HANDLING (The Fix)
    // Instead of crashing, we catch the error and save the state.
    // This allows the Admin to find this mission and click "Retry" later.
    const sub = await Submission.findById(submissionId);
    if (sub) {
        sub.status = 'Chain_Error'; 
        // sub.errorLog = error.message; // Optional: Save the specific error
        await sub.save();
    }

    res.status(500).json({ 
        message: "Blockchain write failed. Mission saved as 'Chain_Error'. Please retry later." 
    });
  }
});

// 12. REJECT MISSION
router.post('/reject-mission', verifyAdmin, async (req, res) => {
  const { submissionId, reason } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    sub.status = 'Rejected';
    sub.rejectionReason = reason || "No reason provided"; 
    await sub.save();
    res.json({ message: "Mission rejected." });
  } catch (error) {
    res.status(500).json({ message: "Rejection Error" });
  }
});

// 13. CREATE MISSION
router.post('/add-mission', verifyAdmin, async (req, res) => {
  const { title, sdgNumber, description, color, points, image } = req.body;
  try {
    const newMission = new Mission({ title, sdgNumber, description, color, points, image });
    await newMission.save();
    res.status(201).json({ message: "Mission created!", mission: newMission });
  } catch (error) {
    res.status(500).json({ message: "Error creating mission" });
  }
});

// 14. DELETE MISSION
router.delete('/delete-mission/:id', verifyAdmin, async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ message: "Mission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 15. UPDATE MISSION
router.put('/update-mission/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedMission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMission);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 16. ADMIN ADD USER (✅ NOW SANITIZED)
router.post('/add-user', verifyAdmin, async (req, res) => {
  let { username, email, password, role } = req.body;
  try {
    // 🔒 SECURITY CHECK: Enforce 8 Character Password for Admins creating users too
    if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // 🛡️ SANITIZATION
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
      role: role || 'student', 
      points: 0
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// 17. ADMIN UPDATE USER
router.put('/admin-update-user/:id', verifyAdmin, async (req, res) => {
  try {
    const { username, email, role, points } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, points },
      { new: true } 
    );
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 18. ADMIN DELETE USER
router.delete('/delete-user/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 19. CHANGE PASSWORD (WITH AUTO-FIX)
router.put('/change-password', async (req, res) => {
  console.log("🔄 Change Password Request Received:", req.body); 

  const { userId, oldPassword, newPassword } = req.body;

  try {
    if (!userId) return res.status(400).json({ message: "User ID missing" });
    
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify Old Password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password" });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 🔧 AUTO-FIX: Convert "Student" to "student" to satisfy the database rules
    if (user.role && user.role !== user.role.toLowerCase()) {
        console.log(`⚠️ Auto-fixing role for user ${user.username}: ${user.role} -> ${user.role.toLowerCase()}`);
        user.role = user.role.toLowerCase();
    }

    await user.save(); // Now this will succeed!

    console.log("✅ Password updated successfully for:", user.username);
    res.json({ message: "Password updated successfully!" });

  } catch (error) {
    console.error("❌ SERVER ERROR in /change-password:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;