import mongoose from 'mongoose';

const DocumentRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  documentType: {
    type: String,
    enum: [
      'Barangay Clearance',
      'Certificate of Indigency',
      'Certificate of Residency',
      'Business Clearance',
      'Certificate of Good Moral Character',
      'Barangay ID'
    ],
    required: true
  },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: { type: String, default: null },
  processedBy: { type: String, default: null },  // admin username who handled it
  pickupDate: { type: Date, default: null },
  referenceNumber: { type: String, unique: true }  // auto-generated ref number
}, { timestamps: true });

// ⚡ PERFORMANCE INDEXES
// Optimize dashboard queries for pending requests and recent activity
DocumentRequestSchema.index({ status: 1, createdAt: -1 });
DocumentRequestSchema.index({ createdAt: -1 });

// Auto-generate reference number before save
DocumentRequestSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.referenceNumber = `BP-${new Date().getFullYear()}-${rand}`;
  }
  next();
});

export default mongoose.model('DocumentRequest', DocumentRequestSchema);
