import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: String,
  missionTitle: String,
  missionId: String,
  
  // 👇 This is the correct field for the image string
  imageUri: String, 
  
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  rejectionReason: { type: String },
  blockchainTxHash: { type: String },
  createdAt: { type: Date, default: Date.now, index: true } // ⚡ Added index for sorting
});

// Create a compound index for faster user-specific history lookups
SubmissionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Submission', SubmissionSchema);