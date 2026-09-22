import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  // Added after initial release. Existing events without an end time remain readable.
  endTime: { type: String },
  location: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  // Legacy field retained so old documents remain readable.
  points: { type: Number, select: false },
  description: { type: String },
  image: { type: String }
}, { timestamps: true });

// A rapid double-click must not be able to publish the same event twice.
EventSchema.index({ title: 1, date: 1, time: 1, location: 1 }, { unique: true });

export default mongoose.model('Event', EventSchema);
