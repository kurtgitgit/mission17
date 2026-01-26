import mongoose from 'mongoose';

const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sdgNumber: { type: String, required: true },
  description: { type: String },
  points: { type: Number, default: 100 },
  color: { type: String, default: '#3b82f6' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Mission', MissionSchema);