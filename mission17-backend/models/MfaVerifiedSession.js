import mongoose from 'mongoose';

const MfaVerifiedSessionSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true },
  firebaseAuthTime: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

MfaVerifiedSessionSchema.index(
  { firebaseUid: 1, firebaseAuthTime: 1 },
  { unique: true }
);
MfaVerifiedSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('MfaVerifiedSession', MfaVerifiedSessionSchema);
