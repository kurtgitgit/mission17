import mongoose from 'mongoose';

// One shared write guard makes roster membership and order changes serializable.
const schema = new mongoose.Schema({
  _id: { type: String },
  revision: { type: Number, default: 0 },
}, { versionKey: false });

export default mongoose.model('OfficialDirectoryRevision', schema);
