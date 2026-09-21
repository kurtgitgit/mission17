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
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['General', 'Infrastructure', 'Public Safety', 'Cleanliness', 'Community Events', 'Other Concern'],
    default: 'General'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
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
    maxlength: 2000,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Suggestion', suggestionSchema);
