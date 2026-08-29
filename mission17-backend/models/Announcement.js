import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: {
    type: String,
    required: true,
    default: 'general',
    trim: true,
    lowercase: true
  },
  image: { type: String, default: null },
  postedBy: { type: String, required: true }, // admin username
  isPinned: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false }, // 🚨 High-priority Emergency Broadcast
  relatedSdg: { type: Number, default: null }, // e.g. 13 for Climate Action, 15 for Tree Planting, 12 for Recycling
  sdgActionTitle: { type: String, default: '' }, // e.g. "Join Purok 3 Clean-up Drive & Log Proof"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', AnnouncementSchema);


