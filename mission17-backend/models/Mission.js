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
  // Soft-hide retired or incorrect sample missions without deleting their history.
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Mission', MissionSchema);
