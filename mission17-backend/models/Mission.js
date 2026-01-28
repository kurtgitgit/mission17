import mongoose from 'mongoose';

const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sdgNumber: { type: Number, required: true },
  points: { type: Number, required: true },
  description: { type: String },
  color: { type: String },
  
  // 👇 THIS IS THE MISSING FIELD!
  // Without this line, Mongoose deletes the image URL before saving.
  image: { type: String }, 
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Mission', MissionSchema);