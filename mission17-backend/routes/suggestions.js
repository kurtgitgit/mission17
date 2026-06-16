// routes/suggestions.js
// Pure routing — all logic lives in suggestions.controller.js

import express from 'express';
import { verifyAdmin } from '../utils/authMiddleware.js';
import { submitSuggestion, getAllSuggestions, getMySuggestions, updateStatus } from '../controllers/suggestions.controller.js';

const router = express.Router();

router.post('/',             submitSuggestion);
router.get('/',              getAllSuggestions);
router.get('/my/:userId',    getMySuggestions);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
