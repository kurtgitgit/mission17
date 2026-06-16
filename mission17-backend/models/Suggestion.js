import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  username: {
    type: String,
    default: 'Anonymous'
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Infrastructure', 'Events', 'Safety', 'Cleanliness', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Approved', 'Rejected'],
    default: 'New'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  adminReply: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Suggestion', suggestionSchema);
