// controllers/suggestions.controller.js
// Business logic for community suggestions — separated from routing.

import Suggestion from '../models/Suggestion.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['New', 'Under Review', 'Approved', 'Rejected'];

// POST / — Resident: Submit new suggestion
export const submitSuggestion = asyncHandler(async (req, res) => {
  const { userId, username, title, category, description, isAnonymous } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  const suggestion = await Suggestion.create({
    userId:      isAnonymous ? null : userId,
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
  const suggestions = await Suggestion.find().sort({ createdAt: -1 });
  res.json(suggestions);
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
    { ...(status && { status }), ...(adminReply && { adminReply }) },
    { new: true }
  );

  if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });

  res.json(suggestion);
});
