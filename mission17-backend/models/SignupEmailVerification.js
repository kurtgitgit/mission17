import mongoose from 'mongoose';

// A short-lived record used only while a resident is registering. It is not a
// user account and does not contain a password or resident profile details.
const SignupEmailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  otpHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, min: 0 },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('SignupEmailVerification', SignupEmailVerificationSchema);
