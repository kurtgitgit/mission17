import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: {
    type: String,
    enum: ['general', 'health', 'safety', 'environment', 'events', 'services'],
    default: 'general'
  },
  image: { type: String, default: null },
  postedBy: { type: String, required: true }, // admin username
  isPinned: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', AnnouncementSchema);
