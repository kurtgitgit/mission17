import mongoose from 'mongoose';

const OfficialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  photo: { type: String, default: null },
  contact: { type: String, default: null, match: [/^09\d{9}$/, 'Contact must be an 11-digit Philippine mobile number.'] },
  email: { type: String, default: null },
  term: { type: String, default: null, match: [/^\d{4}\s*[-–]\s*\d{4}$/, 'Term must use the format YYYY - YYYY.'] },
  // Normalized name + position + term.  Sparse keeps legacy records valid
  // until they are edited, while preventing new duplicate council profiles.
  identityKey: { type: String, unique: true, sparse: true, select: false },
  committee: { type: String, default: null },
  order: { type: Number, default: 99 },  // for sorting (Punong Brgy first)
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archiveReason: { type: String, trim: true, maxlength: 500, default: null }
}, { timestamps: true });

export default mongoose.model('Official', OfficialSchema);
