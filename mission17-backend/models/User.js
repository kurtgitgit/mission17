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
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    // `super_admin` is reserved for the Punong Barangay (Barangay Captain).
    // It is deliberately not available through public registration.
    enum: ['resident', 'lgu', 'admin', 'super_admin'],
    default: 'resident' 
  },
  expoPushToken: {
    type: String
  },
  pushNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  // ==================================================
  // 📝 EXTENDED RESIDENT INFORMATION
  // ==================================================
  firstName: { type: String, required: true, trim: true, maxlength: 80, match: [/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, 'First name contains invalid characters.'] },
  middleName: { type: String, trim: true, maxlength: 80, match: [/^(?:[\p{L}\p{M}][\p{L}\p{M} .'-]*)?$/u, 'Middle name contains invalid characters.'] },
  lastName: { type: String, required: true, trim: true, maxlength: 80, match: [/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, 'Last name contains invalid characters.'] },
  suffix: { type: String, trim: true, maxlength: 20 },
  birthDate: { type: String, trim: true, maxlength: 40 },
  age: { type: String, trim: true, match: [/^\d{1,3}$/, 'Age must be a whole number.'] },
  placeOfBirth: { type: String, trim: true, maxlength: 160 },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  civilStatus: { type: String, enum: ['Single', 'Married', 'Widowed', 'Separated'] },
  nationality: { type: String, trim: true, minlength: 2, maxlength: 80 },
  religion: { type: String, trim: true, maxlength: 80 },
  completeAddress: { type: String, trim: true, minlength: 5, maxlength: 250 },
  purok: { type: String },
  yearsOfResidency: { type: String },
  mobileNumber: { type: String, match: [/^09\d{9}$/, 'Mobile number must be an 11-digit Philippine number beginning with 09.'] },
  voterStatus: { type: String, enum: ['Registered', 'Not Registered'] },
  employmentStatus: { type: String, enum: ['', 'Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'] },
  occupation: { type: String, trim: true, maxlength: 120 },
  householdHead: { type: String },
  emergencyContactPerson: { type: String },
  numberOfFamilyMembers: { type: String },
  educationalAttainment: { type: String, trim: true, maxlength: 120 },
  bloodType: { type: String },
  disability: { type: String },
  profileImageUrl: { type: String },
  validIdFrontUrl: { type: String },
  validIdBackUrl: { type: String },
  fcmToken: { type: String },
  accountStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // Admin must approve before login
  },
  // Kept with the account so a resident can see exactly what to correct before
  // submitting the registration for another review.
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  lastResubmittedAt: { type: Date },
  // Legacy field retained so existing accounts require no destructive migration.
  points: { type: Number, select: false },
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
  // Firebase remains the password authority.  We retain hashes only to stop a
  // user from cycling through recently used passwords after a verified change.
  passwordHistory: {
    type: [String],
    select: false,
    default: []
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  // Recorded only for residents created after the capstone policy consent flow.
  // It remains optional so historical accounts are not changed or blocked.
  legalConsent: {
    privacyVersion: { type: String },
    termsVersion: { type: String },
    acceptedAt: { type: Date }
  }

}, { timestamps: true });

export default mongoose.model('User', UserSchema);
