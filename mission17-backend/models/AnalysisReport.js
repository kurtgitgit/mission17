import mongoose from 'mongoose';

const AnalysisReportSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
    unique: true // One report per submission; re-analysis overwrites via upsert
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // --- AI Output Fields ---
  prediction:  { type: String },  // e.g. "SDG12_Recycling"
  confidence:  { type: String },  // e.g. "87%" — stored server-side, NEVER exposed to client
  verdict:     { type: String },  // "VERIFIED" | "REJECTED" | "UNCERTAIN"
  message:     { type: String },  // Human-readable verdict message
  isVerified:  { type: Boolean, default: false },
  sdg:         { type: String },  // e.g. "SDG 12"
  sourceCheck: { type: String },  // "📸 Raw Picture" | "🤖 AI Generated / Invalid"

  analyzedAt: { type: Date, default: Date.now }
});

export default mongoose.model('AnalysisReport', AnalysisReportSchema);
