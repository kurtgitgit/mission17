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
import User from '../models/User.js';
import { verifyAdmin, verifyAuthenticatedUser, logAudit } from '../utils/authMiddleware.js';
import { getAuth } from 'firebase-admin/auth';

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
  const { username, email, password, role = 'resident', points = 0 } = req.body;
  try {
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';
    const normalizedPoints = Number(points);

    if (!normalizedUsername || !normalizedEmail || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Username, email, and a password of at least six characters are required.' });
    }
    if (!['resident', 'lgu', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (!Number.isInteger(normalizedPoints) || normalizedPoints < 0) {
      return res.status(400).json({ message: 'Points must be a non-negative whole number.' });
    }
    if (await User.exists({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] })) {
      return res.status(409).json({ message: 'A user with that username or email already exists.' });
    }

    // Firebase Authentication is the password authority. Never store Firebase
    // account passwords in MongoDB.
    const firebaseUser = await getAuth().createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedUsername,
    });

    const nameParts = normalizedUsername.split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.join(' ') || 'Account';

    try {
      const newUser = new User({
        firebaseUid: firebaseUser.uid,
        username: normalizedUsername,
        email: normalizedEmail,
        role: normalizedRole,
        points: normalizedPoints,
        firstName,
        lastName,
        accountStatus: 'approved',
      });
      await newUser.save();
    } catch (error) {
      await getAuth().deleteUser(firebaseUser.uid).catch(() => {});
      throw error;
    }

    logAudit(req.user.id, req.user.username, 'ADMIN_USER_CREATE', `Admin created user: ${username}`, req);
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'A Firebase user with that email already exists.' });
    }
    res.status(500).json({ message: 'Error creating user' });
  }
});

// 3. ADMIN UPDATE USER
router.put('/admin-update-user/:id', verifyAdmin, async (req, res) => {
  let firebaseEmailChanged = false;
  let previousFirebaseEmail = null;
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

    const updateData = {};
    if (typeof req.body.username === 'string' && req.body.username.trim()) {
      updateData.username = req.body.username.trim();
    }
    if (typeof req.body.email === 'string' && req.body.email.trim()) {
      updateData.email = req.body.email.trim().toLowerCase();
    }
    if (req.body.role !== undefined) {
      const role = typeof req.body.role === 'string' ? req.body.role.toLowerCase() : '';
      if (!['resident', 'lgu', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
      }
      updateData.role = role;
    }
    if (req.body.points !== undefined) {
      const points = Number(req.body.points);
      if (!Number.isInteger(points) || points < 0) {
        return res.status(400).json({ message: 'Points must be a non-negative whole number.' });
      }
      updateData.points = points;
    }
    if (req.body.accountStatus !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(req.body.accountStatus)) {
        return res.status(400).json({ message: 'Invalid account status.' });
      }
      updateData.accountStatus = req.body.accountStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No permitted fields were provided.' });
    }

    if (updateData.username && updateData.username !== userToUpdate.username) {
      const conflictingUsername = await User.exists({
        _id: { $ne: userToUpdate._id },
        username: updateData.username,
      });
      if (conflictingUsername) {
        return res.status(409).json({ message: 'A user with that username already exists.' });
      }
    }

    if (updateData.email && updateData.email !== userToUpdate.email) {
      const conflictingEmail = await User.exists({
        _id: { $ne: userToUpdate._id },
        email: updateData.email,
      });
      if (conflictingEmail) {
        return res.status(409).json({ message: 'A user with that email already exists.' });
      }
    }

    // Keep Firebase and MongoDB emails aligned. Password updates belong to
    // Firebase's authenticated password-reset/change-password flows.
    if (updateData.email && updateData.email !== userToUpdate.email && userToUpdate.firebaseUid) {
      await getAuth().updateUser(userToUpdate.firebaseUid, { email: updateData.email });
      firebaseEmailChanged = true;
      previousFirebaseEmail = userToUpdate.email;
    }

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (firebaseEmailChanged && previousFirebaseEmail) {
        await getAuth().updateUser(userToUpdate.firebaseUid, { email: previousFirebaseEmail }).catch(() => {});
      }
      throw error;
    }
    logAudit(req.user.id, req.user.username, 'ADMIN_USER_UPDATE', `Admin updated user ID: ${req.params.id}`, req);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// 4. ADMIN DELETE USER
router.delete('/delete-user/:id', verifyAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    if (userToDelete.firebaseUid) {
      try {
        await getAuth().deleteUser(userToDelete.firebaseUid);
      } catch (fbError) {
        console.error('Firebase delete error:', fbError.message);
        return res.status(502).json({ message: 'Could not delete the Firebase account. No data was removed.' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    logAudit(req.user.id, req.user.username, 'ADMIN_USER_DELETE', `Admin deleted user ID: ${req.params.id} from Mongo & Firebase`, req);
    res.json({ message: 'User completely deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// 5. GET USER PROFILE
router.get('/user/:id', verifyAuthenticatedUser, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: you can only view your own profile.' });
    }

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
router.put('/update-profile/:id', verifyAuthenticatedUser, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: you can only update your own profile.' });
    }

    if (req.body.email !== undefined && req.body.email !== req.user.email) {
      return res.status(400).json({ message: 'Email changes must be completed through the Firebase account flow.' });
    }

    const { 
      username, bio, walletAddress,
      firstName, middleName, lastName, email, mobileNumber,
      birthDate, age, gender, civilStatus, placeOfBirth,
      completeAddress, nationality, religion, yearsOfResidency, voterStatus,
      employmentStatus, occupation, educationalAttainment
    } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (civilStatus !== undefined) updateData.civilStatus = civilStatus;
    if (placeOfBirth !== undefined) updateData.placeOfBirth = placeOfBirth;
    if (completeAddress !== undefined) updateData.completeAddress = completeAddress;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (religion !== undefined) updateData.religion = religion;
    if (yearsOfResidency !== undefined) updateData.yearsOfResidency = yearsOfResidency;
    if (voterStatus !== undefined) updateData.voterStatus = voterStatus;
    if (employmentStatus !== undefined) updateData.employmentStatus = employmentStatus;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (educationalAttainment !== undefined) updateData.educationalAttainment = educationalAttainment;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    logAudit(req.user._id, updatedUser.username, 'PROFILE_UPDATE', 'User updated profile information', req);
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
