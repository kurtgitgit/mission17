// routes/announcements.js
// Prefix: /api/announcements

import express from 'express';
import { Expo } from 'expo-server-sdk';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET / — Public: all active announcements
router.get('/', asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ isActive: true })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(50);
  res.json(announcements);
}));

// GET /:id — Public: single announcement
router.get('/:id', asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  res.json(announcement);
}));

// POST / — Admin: create announcement
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const { title, body, category, image, isPinned } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and body are required.' });

  const announcement = await Announcement.create({
    title, body,
    category:  category || 'general',
    image:     image    || null,
    isPinned:  isPinned || false,
    postedBy:  req.user?.username || 'Admin',
  });

  // 🚀 SEND PUSH NOTIFICATIONS
  try {
    const expo = new Expo();
    // Get all users who have registered a push token
    const usersWithTokens = await User.find({ expoPushToken: { $exists: true, $ne: '' } });
    
    let messages = [];
    for (let user of usersWithTokens) {
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        continue;
      }
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: `📢 New Barangay Announcement`,
        body: title,
        data: { announcementId: announcement._id },
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error("Push Notification Error:", error);
  }

  logAudit(req.user.id, req.user.username, 'ANNOUNCEMENT_POST', `Posted: ${title}`, req);
  res.status(201).json({ message: 'Announcement posted.', announcement });
}));

// PUT /:id — Admin: update announcement
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  logAudit(req.user.id, req.user.username, 'ANNOUNCEMENT_UPDATE', `Updated: ${announcement.title}`, req);
  res.json({ message: 'Announcement updated.', announcement });
}));

// DELETE /:id — Admin: delete announcement
router.delete('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  logAudit(req.user.id, req.user.username, 'ANNOUNCEMENT_DELETE', `Deleted: ${announcement.title}`, req);
  res.json({ message: 'Announcement deleted.' });
}));

// PATCH /:id/pin — Admin: toggle pin
router.patch('/:id/pin', verifyAdmin, asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  announcement.isPinned = !announcement.isPinned;
  await announcement.save();
  res.json({ message: `${announcement.isPinned ? 'Pinned' : 'Unpinned'}.`, isPinned: announcement.isPinned });
}));

export default router;
