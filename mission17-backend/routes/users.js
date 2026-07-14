/**
 * User Routes
 * Location: routes/users.js
 * Prefix:   /api/auth  (mounted in index.js — no URL changes for existing clients)
 *
 * Routes:
 *  GET    /users                    — Admin: list all users (no passwords)
 *  POST   /add-user                 — Admin: create a user
 *  PUT    /admin-update-user/:id    — Admin: update any user
 *  DELETE /delete-user/:id          — Admin: delete a user
 *  GET    /user/:id                 — Resident: get own profile
 *  PUT    /update-profile/:id       — Resident: update own profile
 *  GET    /leaderboard              — Public: top 10 residents by points
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';

const router = express.Router();

// 1. GET ALL USERS (Admin) - With Pagination & Search
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'approved') query.accountStatus = 'approved';
    if (status === 'pending') query.accountStatus = { $ne: 'approved' };

    const users = await User.find(query)
      .select('-password')
      .sort({ _id: -1 }) // Sort newest first
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. ADMIN ADD USER
router.post('/add-user', verifyAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword, role: role || 'resident' });
    await newUser.save();
    logAudit(req.user.id, req.user.username, 'ADMIN_USER_CREATE', `Admin created user: ${username}`, req);
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// 3. ADMIN UPDATE USER
router.put('/admin-update-user/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    logAudit(req.user.id, req.user.username, 'ADMIN_USER_UPDATE', `Admin updated user ID: ${req.params.id}`, req);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// 4. ADMIN DELETE USER
router.delete('/delete-user/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    logAudit(req.user.id, req.user.username, 'ADMIN_USER_DELETE', `Admin deleted user ID: ${req.params.id}`, req);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// 5. GET USER PROFILE
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 5b. GET USER IDS (Admin)
router.get('/user-ids/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('validIdFrontUrl validIdBackUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const formatUrl = (uri) => {
      if (!uri) return null;
      if (uri.startsWith('http')) return uri;
      if (uri.startsWith('uploads\\') || uri.startsWith('uploads/')) {
         const norm = uri.replace(/\\/g, '/');
         return `${req.protocol}://${req.get('host')}/${norm}`;
      }
      return uri;
    };

    res.json({
      front: formatUrl(user.validIdFrontUrl),
      back: formatUrl(user.validIdBackUrl)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 6. UPDATE OWN PROFILE
router.put('/update-profile/:id', async (req, res) => {
  try {
    const { username, bio, walletAddress } = req.body;

    // Only update provided fields
    const updateData = {};
    if (username)      updateData.username      = username;
    if (bio)           updateData.bio           = bio;
    if (walletAddress) updateData.walletAddress = walletAddress;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    logAudit(req.params.id, updatedUser.username, 'PROFILE_UPDATE', 'User updated profile information', req);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// 7. LEADERBOARD (Public)
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({ role: { $ne: 'admin' } })
      .select('username points')
      .sort({ points: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

export default router;
