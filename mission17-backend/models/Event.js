import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  points: { type: Number, default: 0 },
  description: { type: String },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);