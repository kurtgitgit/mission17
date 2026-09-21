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

const normalizeAnnouncementData = (body = {}) => {
  const data = {};
  if (body.title !== undefined) data.title = typeof body.title === 'string' ? body.title.trim().replace(/\s+/g, ' ') : body.title;
  if (body.body !== undefined) data.body = typeof body.body === 'string' ? body.body.trim() : body.body;
  if (body.category !== undefined) data.category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : body.category;
  if (body.image !== undefined) data.image = body.image || null;
  if (body.isPinned !== undefined) data.isPinned = body.isPinned;
  if (body.isUrgent !== undefined) data.isUrgent = body.isUrgent;
  if (body.relatedSdg !== undefined) data.relatedSdg = body.relatedSdg === null || body.relatedSdg === '' ? null : Number(body.relatedSdg);
  if (body.sdgActionTitle !== undefined) data.sdgActionTitle = typeof body.sdgActionTitle === 'string' ? body.sdgActionTitle.trim() : body.sdgActionTitle;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  return data;
};

const validateAnnouncement = (data, { partial = false } = {}) => {
  if (!partial || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.length < 3 || data.title.length > 150) return 'Title must be between 3 and 150 characters.';
  }
  if (!partial || data.body !== undefined) {
    if (typeof data.body !== 'string' || data.body.length < 10 || data.body.length > 5000) return 'Body must be between 10 and 5,000 characters.';
  }
  if (data.category !== undefined && (typeof data.category !== 'string' || data.category.length < 2 || data.category.length > 50)) return 'Category must be between 2 and 50 characters.';
  if (data.image !== undefined && data.image !== null && (typeof data.image !== 'string' || data.image.length > 2048)) return 'Cover image URL is invalid or too long.';
  if (data.relatedSdg !== undefined && data.relatedSdg !== null && (!Number.isInteger(data.relatedSdg) || data.relatedSdg < 1 || data.relatedSdg > 17)) return 'Related SDG must be a whole number from 1 to 17.';
  if (data.sdgActionTitle !== undefined && (typeof data.sdgActionTitle !== 'string' || data.sdgActionTitle.length > 160)) return 'SDG action title cannot exceed 160 characters.';
  for (const field of ['isPinned', 'isUrgent', 'isActive']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') return `${field} must be true or false.`;
  }
  return null;
};

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
  const data = normalizeAnnouncementData({ category: 'general', isPinned: false, isUrgent: false, ...req.body });
  const validationError = validateAnnouncement(data);
  if (validationError) return res.status(400).json({ message: validationError });
  const recentDuplicate = await Announcement.findOne({
    title: data.title,
    body: data.body,
    createdAt: { $gte: new Date(Date.now() - 60_000) }
  });
  if (recentDuplicate) return res.status(409).json({ message: 'This announcement was already posted.' });

  const announcement = await Announcement.create({
    ...data,
    postedBy: req.user?.username || 'Admin',
  });
  const { title, body, isUrgent, relatedSdg } = announcement;
  const cleanedCat = announcement.category;

  // 🚀 SEND REAL-TIME PUSH NOTIFICATIONS TO ALL REGISTERED RESIDENTS
  try {
    const usersWithTokens = await User.find({
      expoPushToken: { $exists: true, $ne: '' },
      pushNotificationsEnabled: { $ne: false }
    }).select('expoPushToken');
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
  const updateData = normalizeAnnouncementData(req.body);
  const validationError = validateAnnouncement(updateData, { partial: true });
  if (validationError) return res.status(400).json({ message: validationError });

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
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
