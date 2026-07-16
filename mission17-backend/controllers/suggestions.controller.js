// controllers/suggestions.controller.js
// Business logic for community suggestions — separated from routing.

import Suggestion from '../models/Suggestion.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['New', 'Under Review', 'Approved', 'Rejected'];

// POST / — Resident: Submit new suggestion
export const submitSuggestion = asyncHandler(async (req, res) => {
  const { userId, username, title, category, description, isAnonymous } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  const suggestion = await Suggestion.create({
    userId, // Always store userId so the user can see their own history
    username:    isAnonymous ? 'Anonymous' : username,
    title,
    category,
    description,
    isAnonymous,
  });

  res.status(201).json(suggestion);
});

// GET / — Admin: Get all suggestions
export const getAllSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await Suggestion.find().populate('userId', 'firstName lastName username').sort({ createdAt: -1 });
  
  // Hide userId from admin for anonymous suggestions
  const sanitizedSuggestions = suggestions.map(s => {
    const doc = s.toObject();
    if (doc.isAnonymous) {
      delete doc.userId;
    }
    return doc;
  });

  res.json(sanitizedSuggestions);
});

// GET /my/:userId — Resident: Get own suggestions
export const getMySuggestions = asyncHandler(async (req, res) => {
  const suggestions = await Suggestion.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(suggestions);
});

// PATCH /:id/status — Admin: Update status and add reply
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminReply } = req.body;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const suggestion = await Suggestion.findByIdAndUpdate(
    req.params.id,
    { ...(status && { status }), ...(adminReply !== undefined && { adminReply }) },
    { new: true }
  );

  if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });

  // Send notification to the resident (skip anonymous)
  if (suggestion.userId && status && !suggestion.isAnonymous) {
    const notifMap = {
      'Approved':     { title: '✅ Feedback Approved!',     type: 'success', message: `Your suggestion "${suggestion.title}" has been approved by the Barangay!${adminReply ? ' Reply: ' + adminReply : ''}` },
      'Rejected':     { title: '❌ Feedback Not Accepted',  type: 'error',   message: `Your suggestion "${suggestion.title}" was not accepted.${adminReply ? ' Reason: ' + adminReply : ''}` },
      'Under Review': { title: '🔍 Feedback Under Review',  type: 'info',    message: `Your suggestion "${suggestion.title}" is now being reviewed by the Barangay.` },
    };
    const notif = notifMap[status];
    if (notif) {
      await Notification.create({ userId: suggestion.userId, ...notif });
    }
  }

  res.json(suggestion);
});

// DELETE /:id — Admin: Delete a suggestion
export const deleteSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findByIdAndDelete(req.params.id);
  if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });
  res.json({ message: 'Suggestion deleted successfully.' });
});
