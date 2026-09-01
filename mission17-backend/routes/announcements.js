// routes/announcements.js
// Prefix: /api/announcements

import express from 'express';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPushNotifications } from '../utils/pushNotifier.js';

const router = express.Router();

const BASE_CATEGORIES = ['general', 'health', 'safety', 'environment', 'events', 'services'];

// GET / — Public: all active announcements
router.get('/', asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ isActive: true })
    .sort({ isUrgent: -1, isPinned: -1, createdAt: -1 })
    .limit(50);
  res.json(announcements);
}));

// GET /categories — Public: dynamic category list from active bulletins
router.get('/categories', asyncHandler(async (req, res) => {
  const distinctCats = await Announcement.distinct('category', { isActive: true });
  const merged = Array.from(new Set([...BASE_CATEGORIES, ...distinctCats.map(c => c.toLowerCase())]));
  res.json(merged);
}));

// GET /:id — Public: single announcement
router.get('/:id', asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  res.json(announcement);
}));

// POST / — Admin: create announcement
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const { title, body, category, image, isPinned, isUrgent, relatedSdg, sdgActionTitle } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and body are required.' });

  const cleanedCat = (category || 'general').trim().toLowerCase();

  const announcement = await Announcement.create({
    title,
    body,
    category: cleanedCat,
    image:    image    || null,
    isPinned: isPinned || false,
    isUrgent: isUrgent || false,
    relatedSdg: relatedSdg ? Number(relatedSdg) : null,
    sdgActionTitle: sdgActionTitle || '',
    postedBy: req.user?.username || 'Admin',
  });

  // 🚀 SEND REAL-TIME PUSH NOTIFICATIONS TO ALL REGISTERED RESIDENTS
  try {
    const usersWithTokens = await User.find({ expoPushToken: { $exists: true, $ne: '' } }).select('expoPushToken');
    const notifTitle = isUrgent 
      ? `🚨 EMERGENCY ALERT: ${title}` 
      : (relatedSdg ? `🌱 Green Initiative (SDG ${relatedSdg}): ${title}` : `📢 Barangay Announcement: ${title}`);
    const notifBody = isUrgent
      ? `URGENT ADVISORY: ${body.slice(0, 120)}${body.length > 120 ? '…' : ''}`
      : body.slice(0, 100);

    const result = await sendPushNotifications(usersWithTokens.map((user) => ({
        pushToken: user.expoPushToken,
        priority: isUrgent ? 'high' : 'normal',
        channelId: isUrgent ? 'emergency' : 'default',
        title: notifTitle,
        body: notifBody,
        data: {
          screen: 'Announcements',
          announcementId: announcement._id.toString(),
          category: cleanedCat,
          isUrgent: announcement.isUrgent,
          relatedSdg: announcement.relatedSdg
        },
      })));
    console.log(`📲 ${result.acceptedCount} announcement notifications accepted by Expo for processing.`);
  } catch (error) {
    console.error("Push Notification Error:", error);
  }

  logAudit(req.user._id || req.user.id, req.user.username, 'ANNOUNCEMENT_POST', `Posted: ${title} (${cleanedCat}${isUrgent ? ', URGENT' : ''}${relatedSdg ? `, SDG ${relatedSdg}` : ''})`, req);
  res.status(201).json({ message: isUrgent ? '🚨 Urgent emergency alert posted and queued for notification processing.' : 'Announcement posted successfully.', announcement });
}));

// PUT /:id — Admin: update announcement
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const { title, body, category, image, isPinned, isUrgent, relatedSdg, sdgActionTitle, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (body !== undefined) updateData.body = body;
  if (category !== undefined) updateData.category = category.trim().toLowerCase();
  if (image !== undefined) updateData.image = image;
  if (isPinned !== undefined) updateData.isPinned = isPinned;
  if (isUrgent !== undefined) updateData.isUrgent = isUrgent;
  if (relatedSdg !== undefined) updateData.relatedSdg = relatedSdg ? Number(relatedSdg) : null;
  if (sdgActionTitle !== undefined) updateData.sdgActionTitle = sdgActionTitle;
  if (isActive !== undefined) updateData.isActive = isActive;

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });

  logAudit(req.user._id || req.user.id, req.user.username, 'ANNOUNCEMENT_UPDATE', `Updated announcement: ${announcement.title}`, req);
  res.json({ message: 'Announcement updated successfully.', announcement });
}));

// DELETE /:id — Admin: delete announcement
router.delete('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  logAudit(req.user._id || req.user.id, req.user.username, 'ANNOUNCEMENT_DELETE', `Deleted: ${announcement.title}`, req);
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
