import mongoose from 'mongoose';
import { archiveFields } from '../utils/archiveFields.js';

const AnnouncementSchema = new mongoose.Schema({
  ...archiveFields,
  expiresAt: { type: Date, default: null, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  body: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  category: {
    type: String,
    required: true,
    default: 'general',
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 50
  },
  image: { type: String, default: null, maxlength: 2048 },
  postedBy: { type: String, required: true }, // admin username
  isPinned: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false }, // 🚨 High-priority Emergency Broadcast
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', AnnouncementSchema);
