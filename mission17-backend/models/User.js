import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String, 
    required: true,
    unique: true 
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // 🛡️ NEW SECURITY FIELD
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student' // Everyone is a student by default
  },
  points: { type: Number, default: 0 },
  completedMissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);