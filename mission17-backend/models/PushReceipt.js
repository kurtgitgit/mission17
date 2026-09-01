import mongoose from 'mongoose';

const PushReceiptSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  expoPushToken: { type: String, required: true },
  status: { type: String, enum: ['pending', 'ok', 'error'], default: 'pending', index: true },
  errorCode: { type: String },
  checkedAt: { type: Date },
}, {
  timestamps: true,
});

// Receipt records are operational diagnostics, not permanent user data.
PushReceiptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model('PushReceipt', PushReceiptSchema);
