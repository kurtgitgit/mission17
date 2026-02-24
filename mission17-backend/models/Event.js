import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  color: { type: String, default: '#3b82f6' }
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);