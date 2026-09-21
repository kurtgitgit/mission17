import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
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
  relatedSdg: { type: Number, min: 1, max: 17, default: null }, // e.g. 13 for Climate Action, 15 for Tree Planting, 12 for Recycling
  sdgActionTitle: { type: String, trim: true, maxlength: 160, default: '' }, // e.g. "Join Purok 3 Clean-up Drive & Log Proof"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', AnnouncementSchema);

