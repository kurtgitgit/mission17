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
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['resident', 'lgu', 'admin'],
    default: 'resident' 
  },
  points: { type: Number, default: 0 },
  completedMissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],

  // ==================================================
  // ⛓️ NEW FIELD FOR BLOCKCHAIN INTEGRATION
  // ==================================================
  walletAddress: { type: String, default: null },


  // ==================================================
  // 🛡️ NEW FIELDS FOR MFA (Multi-Factor Auth)
  // ==================================================
  mfaEnabled: { 
    type: Boolean, 
    default: false 
  }, 
  mfaSecret: { 
    type: String 
  }, // (Reserved for Google Authenticator if needed later)
  
  otpCode: { 
    type: String 
  },
  otpExpires: { 
    type: Date 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  }

}, { timestamps: true });

export default mongoose.model('User', UserSchema);