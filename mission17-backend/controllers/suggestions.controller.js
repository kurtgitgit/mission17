// controllers/suggestions.controller.js
// Business logic for private citizen feedback and sentiment analysis.

import Suggestion from '../models/Suggestion.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { analyzeSentiment } from '../utils/sentimentAnalyzer.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['New', 'Under Review', 'Resolved', 'Dismissed'];

// POST / — Resident: Submit private feedback / concern to Barangay Head
export const submitSuggestion = asyncHandler(async (req, res) => {
  const { userId, username, title, category, description, isAnonymous } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  // 🧠 Run bilingual sentiment analysis
  const analysis = analyzeSentiment(`${title} ${description}`);

  const suggestion = await Suggestion.create({
    userId:      userId || null,
    username:    isAnonymous ? 'Anonymous Resident' : (username || 'Resident'),
    title:       title.trim(),
    category:    category || 'General',
    description: description.trim(),
    sentiment:   analysis.sentiment,
    sentimentScore: analysis.score,
    isAnonymous: !!isAnonymous,
    isPrivate:   true,
    status:      'New'
  });

  res.status(201).json({
    message: 'Thank you! Your feedback has been securely sent to the Barangay Captain.',
    suggestion
  });
});

// GET / — Admin: Get all private feedback
export const getAllSuggestions = asyncHandler(async (req, res) => {
  const { sentiment, status } = req.query;
  const filter = {};
  if (sentiment) filter.sentiment = sentiment;
  if (status)    filter.status    = status;

  const suggestions = await Suggestion.find(filter)
    .populate('userId', 'firstName lastName username email contactNo')
    .sort({ createdAt: -1 });

  // Hide sensitive personal identifiers if submitted as anonymous
  const sanitized = suggestions.map(s => {
    const doc = s.toObject();
    if (doc.isAnonymous) {
      delete doc.userId;
      doc.username = 'Anonymous Resident';
    }
    return doc;
  });

  res.json(sanitized);
});

// GET /stats — Admin: Get sentiment KPI statistics
export const getSentimentStats = asyncHandler(async (req, res) => {
  const total = await Suggestion.countDocuments();
  const positive = await Suggestion.countDocuments({ sentiment: 'Positive' });
  const neutral  = await Suggestion.countDocuments({ sentiment: 'Neutral' });
  const negative = await Suggestion.countDocuments({ sentiment: 'Negative' });

  const resolved = await Suggestion.countDocuments({ status: 'Resolved' });
  const underReview = await Suggestion.countDocuments({ status: 'Under Review' });
  const pending = await Suggestion.countDocuments({ status: 'New' });

  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const neutralPercent  = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;

  res.json({
    total,
    positive,
    neutral,
    negative,
    positivePercent,
    neutralPercent,
    negativePercent,
    resolved,
    underReview,
    pending
  });
});

// GET /my/:userId — Resident: Get own feedback history
export const getMySuggestions = asyncHandler(async (req, res) => {
  const suggestions = await Suggestion.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(suggestions);
});

// PATCH /:id/status — Admin: Update status and add official reply
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminReply } = req.body;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const suggestion = await Suggestion.findByIdAndUpdate(
    req.params.id,
    {
      ...(status && { status }),
      ...(adminReply !== undefined && { adminReply })
    },
    { new: true }
  );

  if (!suggestion) return res.status(404).json({ message: 'Feedback not found.' });

  // 🔔 Send push and in-app notification to the resident if available
  if (suggestion.userId) {
    const notifMap = {
      'Resolved':     { title: '✅ Feedback Resolved',     type: 'success', message: `Your concern "${suggestion.title}" has been addressed by the Barangay Captain!${adminReply ? ' Note: ' + adminReply : ''}` },
      'Under Review': { title: '🔍 Feedback Under Review',  type: 'info',    message: `Your message "${suggestion.title}" is currently being processed by our office.` },
      'Dismissed':    { title: 'ℹ️ Feedback Update',        type: 'warning', message: `Your message "${suggestion.title}" has been reviewed.${adminReply ? ' Note: ' + adminReply : ''}` },
      'New':          { title: '📩 Official Reply Added',   type: 'info',    message: `The Barangay replied to your concern "${suggestion.title}": ${adminReply}` },
    };

    const notif = notifMap[status] || notifMap['New'];
    if (notif) {
      await Notification.create({ userId: suggestion.userId, ...notif });

      // Trigger mobile lock-screen alert
      const residentUser = await User.findById(suggestion.userId).select('expoPushToken');
      if (residentUser?.expoPushToken) {
        await sendPushNotification(
          residentUser.expoPushToken,
          `🏛️ Barangay Feedback Update`,
          notif.message,
          { screen: 'Suggestions', feedbackId: suggestion._id.toString() }
        );
      }
    }
  }

  res.json({ message: 'Feedback updated successfully.', suggestion });
});

// DELETE /:id — Admin: Delete feedback
export const deleteSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findByIdAndDelete(req.params.id);
  if (!suggestion) return res.status(404).json({ message: 'Feedback not found.' });
  res.json({ message: 'Feedback record deleted.' });
});

