// routes/suggestions.js
// Pure routing — all logic lives in suggestions.controller.js

import express from 'express';
import { verifyAdmin, verifyAuthenticatedUser } from '../utils/authMiddleware.js';
import { submitSuggestion, getAllSuggestions, getSentimentStats, getMySuggestions, updateStatus, deleteSuggestion } from '../controllers/suggestions.controller.js';

const router = express.Router();

router.post('/',             verifyAuthenticatedUser, submitSuggestion);
router.get('/stats',         verifyAdmin, getSentimentStats);
router.get('/',              verifyAdmin, getAllSuggestions);
router.get('/my/:userId',    verifyAuthenticatedUser, getMySuggestions);
router.patch('/:id/status', verifyAdmin, updateStatus);
router.delete('/:id',       verifyAdmin, deleteSuggestion);

export default router;
