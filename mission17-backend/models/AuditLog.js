import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String }, // Store username too, in case user is deleted
  action: { type: String, required: true }, // e.g., "LOGIN", "MISSION_APPROVED"
  details: { type: String }, // e.g., "Approved submission for User X"
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', AuditLogSchema);