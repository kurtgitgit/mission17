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
    default: 'General'
  },
  description: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral'
  },
  sentimentScore: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Resolved', 'Dismissed', 'Approved', 'Rejected'],
    default: 'New'
  },

  adminReply: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Suggestion', suggestionSchema);

