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
  expoPushToken: {
    type: String
  },
  // ==================================================
  // 📝 EXTENDED RESIDENT INFORMATION
  // ==================================================
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  birthDate: { type: String },
  age: { type: String },
  placeOfBirth: { type: String },
  gender: { type: String },
  civilStatus: { type: String },
  nationality: { type: String },
  religion: { type: String },
  completeAddress: { type: String },
  purok: { type: String },
  yearsOfResidency: { type: String },
  mobileNumber: { type: String },
  voterStatus: { type: String },
  employmentStatus: { type: String },
  occupation: { type: String },
  householdHead: { type: String },
  emergencyContactPerson: { type: String },
  numberOfFamilyMembers: { type: String },
  educationalAttainment: { type: String },
  bloodType: { type: String },
  disability: { type: String },
  validIdUrl: { type: String },
  profileImageUrl: { type: String },
  accountStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // Admin must approve before login
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