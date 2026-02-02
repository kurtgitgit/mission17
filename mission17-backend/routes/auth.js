import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Submission from '../models/Submission.js'; 
import Mission from '../models/Mission.js';

const router = express.Router();

// 1. REGISTER
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body; // 👈 Extract role
  try {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'Student', // 👈 Save role (or default)
      points: 0
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
    
    // 👇 Return role so frontend knows who logged in
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        points: user.points,
        role: user.role 
      } 
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
      points: user.points || 0,
      role: user.role || 'Student',
      bio: user.bio || "" 
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

// 5. SUBMIT MISSION
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
      imageUri, 
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

// 6. ADMIN: GET PENDING SUBMISSIONS
router.get('/pending-submissions', async (req, res) => {
  try {
    const pending = await Submission.find({ status: 'Pending' });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 7. ADMIN: APPROVE MISSION
router.post('/approve-mission', async (req, res) => {
  const { submissionId } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    const user = await User.findById(sub.userId);
    if (user) {
      user.points = (user.points || 0) + 100; 
      await user.save();
    }

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

    sub.status = 'Rejected';
    sub.rejectionReason = reason || "No reason provided"; 
    
    await sub.save();
    res.json({ message: "Mission rejected." });
  } catch (error) {
    res.status(500).json({ message: "Rejection Error" });
  }
});

// 9. MOBILE: USER MISSION HISTORY
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId }).sort({ createdAt: -1 }); 
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

// 10. ADMIN: CREATE MISSION
router.post('/add-mission', async (req, res) => {
  const { title, sdgNumber, description, color, points, image } = req.body;
  try {
    const newMission = new Mission({ title, sdgNumber, description, color, points, image });
    await newMission.save();
    res.status(201).json({ message: "Mission created!", mission: newMission });
  } catch (error) {
    res.status(500).json({ message: "Error creating mission" });
  }
});

// 11. MOBILE: FETCH MISSIONS
router.get('/all-missions', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ sdgNumber: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching missions" });
  }
});

// 12. MOBILE: LEADERBOARD
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find().select('username points').sort({ points: -1 }).limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

// 13. ADMIN: DELETE MISSION
router.delete('/delete-mission/:id', async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ message: "Mission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 14. MOBILE: UPDATE PROFILE
router.put('/update-profile/:id', async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { username, bio }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 15. ADMIN: ADD USER
router.post('/add-user', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'Student', // 👈 Save role
      points: 0
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// 16. ADMIN: UPDATE USER
router.put('/admin-update-user/:id', async (req, res) => {
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

// 17. ADMIN: DELETE USER
router.delete('/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 18. ADMIN: UPDATE MISSION
router.put('/update-mission/:id', async (req, res) => {
  try {
    const updatedMission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMission);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

export default router;