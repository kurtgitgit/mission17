import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String, 
    required: true,
    unique: true // No two users can have the same name
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
  // Gamification Fields
  points: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    default: 'Rookie'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);