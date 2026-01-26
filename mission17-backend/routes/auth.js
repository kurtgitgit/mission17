import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Submission from '../models/Submission.js'; // Ensure you created this model
import Mission from '../models/Mission.js';

const router = express.Router();

// 1. REGISTER
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: cleanEmail,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "secretKey123", { expiresIn: "1h" });
    res.json({ 
      token, 
      user: { id: user._id, username: user.username, points: user.points } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. GET USER DETAILS
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      points: user.points || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. GET ALL USERS (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 5. SUBMIT MISSION (Updated: Saves to Submissions instead of adding points)
router.post('/submit-mission', async (req, res) => {
  const { userId, missionId, missionTitle, imageUri } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newSubmission = new Submission({
      userId: user._id,
      username: user.username,
      missionId,
      missionTitle,
      imageUri, // The photo link from the app
      status: 'Pending'
    });

    await newSubmission.save();
    console.log(`📩 New Submission from [${user.username}] for [${missionTitle}]`);
    res.json({ message: "Mission submitted for review!" });
  } catch (error) {
    console.log("❌ Submission Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 6. ADMIN: GET ALL PENDING SUBMISSIONS
router.get('/pending-submissions', async (req, res) => {
  try {
    const pending = await Submission.find({ status: 'Pending' });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 7. ADMIN: APPROVE MISSION (Awards points here)
router.post('/approve-mission', async (req, res) => {
  const { submissionId } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    // 1. Award points to the user
    const user = await User.findById(sub.userId);
    if (user) {
      user.points = (user.points || 0) + 100;
      await user.save();
    }

    // 2. Mark as Approved
    sub.status = 'Approved';
    await sub.save();

    console.log(`✅ Approved: 100pts awarded to [${user?.username}]`);
    res.json({ message: "Approved and points awarded!" });
  } catch (error) {
    res.status(500).json({ message: "Approval Error" });
  }
});
// 8. ADMIN: REJECT MISSION
router.post('/reject-mission', async (req, res) => {
  const { submissionId, reason } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    // Mark as Rejected and save the reason
    sub.status = 'Rejected';
    // If you haven't added 'rejectionReason' to your Submission model yet, 
    // MongoDB will still save it as a new field!
    sub.rejectionReason = reason || "No reason provided"; 
    
    await sub.save();

    console.log(`❌ Rejected mission for ID: ${submissionId}. Reason: ${reason}`);
    res.json({ message: "Mission rejected and user notified." });
  } catch (error) {
    res.status(500).json({ message: "Rejection Error" });
  }
});
// 9. MOBILE: GET USER'S MISSION HISTORY
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }); // Show newest first
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});
// 10. ADMIN: CREATE NEW MISSION
router.post('/add-mission', async (req, res) => {
  const { title, sdgNumber, description, color, points } = req.body;
  try {
    const newMission = new Mission({ title, sdgNumber, description, color, points });
    await newMission.save();
    res.status(201).json({ message: "Mission created!", mission: newMission });
  } catch (error) {
    res.status(500).json({ message: "Error creating mission" });
  }
});

// 11. MOBILE: FETCH ALL DYNAMIC MISSIONS
router.get('/all-missions', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ sdgNumber: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching missions" });
  }
});
// 12. MOBILE: GET LEADERBOARD
router.get('/leaderboard', async (req, res) => {
  try {
    // Fetch users, sort by points (highest first), limit to top 10
    const topUsers = await User.find()
      .select('username points')
      .sort({ points: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

export default router;