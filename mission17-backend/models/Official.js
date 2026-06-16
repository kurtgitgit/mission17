import mongoose from 'mongoose';

const OfficialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  photo: { type: String, default: null },
  contact: { type: String, default: null },
  email: { type: String, default: null },
  term: { type: String, default: null }, // e.g. "2023-2026"
  committee: { type: String, default: null },
  order: { type: Number, default: 99 }  // for sorting (Punong Brgy first)
}, { timestamps: true });

export default mongoose.model('Official', OfficialSchema);
