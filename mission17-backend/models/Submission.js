import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: String,
  missionTitle: String,
  missionId: String,
  
  // 👇 This is the correct field for the image string
  imageUri: String, 
  
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Submission', SubmissionSchema);