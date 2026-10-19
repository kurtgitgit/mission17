// routes/announcements.js
// Prefix: /api/announcements

import express from 'express';
import mongoose from 'mongoose';
import { buildVisibleAnnouncementFilter } from '../utils/announcementVisibility.js';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPushNotifications } from '../utils/pushNotifier.js';

const router = express.Router();

const BASE_CATEGORIES = ['general', 'health', 'safety', 'environment', 'services'];

const normalizeAnnouncementData = (body = {}) => {
  const data = {};
  if (body.title !== undefined) data.title = typeof body.title === 'string' ? body.title.trim().replace(/\s+/g, ' ') : body.title;
  if (body.body !== undefined) data.body = typeof body.body === 'string' ? body.body.trim() : body.body;
  if (body.category !== undefined) data.category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : body.category;
  if (body.image !== undefined) data.image = body.image || null;
  if (body.isPinned !== undefined) data.isPinned = body.isPinned;
  if (body.isUrgent !== undefined) data.isUrgent = body.isUrgent;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt;
  return data;
};

const validateAnnouncement = (data, { partial = false } = {}) => {
  if (data.expiresAt !== undefined && (typeof data.expiresAt !== 'string' || !Number.isFinite(new Date(data.expiresAt).getTime()) || new Date(data.expiresAt) <= new Date())) return 'Expiration must be a valid future date and time.';
  if (!partial || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.length < 3 || data.title.length > 150) return 'Title must be between 3 and 150 characters.';
  }
  if (!partial || data.body !== undefined) {
    if (typeof data.body !== 'string' || data.body.length < 10 || data.body.length > 5000) return 'Body must be between 10 and 5,000 characters.';
  }
  if (data.category !== undefined && (typeof data.category !== 'string' || data.category.length < 2 || data.category.length > 50)) return 'Category must be between 2 and 50 characters.';
  if (data.image !== undefined && data.image !== null && (typeof data.image !== 'string' || data.image.length > 2048)) return 'Cover image URL is invalid or too long.';
  for (const field of ['isPinned', 'isUrgent', 'isActive']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') return `${field} must be true or false.`;
  }
  return null;
};

// GET / — Public: all active announcements
router.get('/', asyncHandler(async (req, res) => {
  const announcements = await Announcement.find(buildVisibleAnnouncementFilter())
    .sort({ isUrgent: -1, isPinned: -1, createdAt: -1 })
    .limit(50);
  res.set('Cache-Control', 'no-store');
  res.json(announcements);
}));

// GET /categories — Public: dynamic category list from active bulletins
router.get('/categories', asyncHandler(async (req, res) => {
  const distinctCats = await Announcement.distinct('category', buildVisibleAnnouncementFilter());
  const merged = Array.from(new Set([...BASE_CATEGORIES, ...distinctCats.map(c => c.toLowerCase())]));
  res.json(merged);
}));

// GET /:id — Public: active announcement only. Inactive announcements must
// not remain reachable after they disappear from the public listing.
router.get('/manage', verifyAdmin, asyncHandler(async (req, res) => {
  const now = new Date();
  const filters = {
    active: buildVisibleAnnouncementFilter(now),
    expired: { isArchived: { $ne: true }, isActive: true, expiresAt: { $lte: now, $ne: null } },
    archived: { $or: [{ isArchived: true }, { isActive: false }] },
    all: {},
  };
  if (!Object.hasOwn(filters, req.query.view || 'active')) return res.status(400).json({ message: 'Invalid post view.' });
  res.set('Cache-Control', 'private, no-store');
  res.json(await Announcement.find(filters[req.query.view || 'active']).sort({ createdAt: -1, _id: -1 }).limit(500));
}));

router.patch('/:id/archive', verifyAdmin, asyncHandler(async (req, res) => {
  if (typeof req.body.archived !== 'boolean' || !mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Provide a valid post ID and archive selection.' });
  const post = await Announcement.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Announcement not found.' });
  let expiresAt = post.expiresAt;
  if (!req.body.archived) {
    if (req.body.expiresAt !== undefined) {
      const error = validateAnnouncement({ expiresAt: req.body.expiresAt }, { partial: true });
      if (error) return res.status(400).json({ message: error });
      expiresAt = new Date(req.body.expiresAt);
    }
    if (!expiresAt || expiresAt <= new Date()) return res.status(400).json({ message: 'Choose a new future expiration before restoring this post.' });
  }
  await Announcement.updateOne({ _id: post._id }, { $set: { isArchived: req.body.archived, archivedAt: req.body.archived ? new Date() : null, archivedBy: req.body.archived ? req.user._id : null, isActive: !req.body.archived, expiresAt } });
  logAudit(req.user._id, req.user.username, req.body.archived ? 'ANNOUNCEMENT_ARCHIVE' : 'ANNOUNCEMENT_RESTORE', `Post: ${post._id}`, req);
  res.json({ message: req.body.archived ? 'Post archived.' : 'Post restored.' });
}));

export const getPublicAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({ _id: req.params.id, ...buildVisibleAnnouncementFilter() });
  if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
  res.json(announcement);
});
router.get('/:id', getPublicAnnouncementById);

// POST / — Admin: create announcement
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const data = normalizeAnnouncementData({ category: 'general', isPinned: false, isUrgent: false, ...req.body });
  if (data.expiresAt === undefined) data.expiresAt = new Date(Date.now() + (data.isUrgent ? 1 : 7) * 86400000).toISOString();
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
  const { title, body, isUrgent } = announcement;
  const cleanedCat = announcement.category;

  // 🚀 SEND REAL-TIME PUSH NOTIFICATIONS TO ALL REGISTERED RESIDENTS
  try {
    const usersWithTokens = await User.find({
      expoPushToken: { $exists: true, $ne: '' },
      pushNotificationsEnabled: { $ne: false }
    }).select('expoPushToken');
    const notifTitle = isUrgent
      ? `🚨 EMERGENCY ALERT: ${title}`
      : `📢 Barangay Announcement: ${title}`;
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
          isUrgent: announcement.isUrgent
        },
      })));
    console.log(`📲 ${result.acceptedCount} announcement notifications accepted by Expo for processing.`);
  } catch (error) {
    console.error("Push Notification Error:", error);
  }

  logAudit(req.user._id || req.user.id, req.user.username, 'ANNOUNCEMENT_POST', `Posted: ${title} (${cleanedCat}${isUrgent ? ', URGENT' : ''})`, req);
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
