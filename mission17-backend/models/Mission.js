import mongoose from 'mongoose';

const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  sdgNumber: { type: Number, required: true, min: 1, max: 17 },
  // Retained for backward compatibility with existing records. New missions
  // no longer expose or use the former rewards system.
  points: { type: Number, select: false },
  description: { type: String, maxlength: 1000 },
  color: { type: String, match: [/^#[0-9a-f]{6}$/i, 'Color must be a six-digit hex value.'] },
  
  // 👇 THIS IS THE MISSING FIELD!
  // Without this line, Mongoose deletes the image URL before saving.
  image: { type: String }, 
  // Soft-hide retired or incorrect sample missions without deleting their history.
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Mission', MissionSchema);
