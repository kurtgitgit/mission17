// routes/blotter-reports.js
// Pure routing — all logic lives in blotter.controller.js

import express from 'express';
import { verifyAdmin, verifyAuthenticatedUser } from '../utils/authMiddleware.js';
import { submitReport, getMyReports, getEvidence, getAllReports, updateStatus, getPublicReport } from '../controllers/blotter.controller.js';

const router = express.Router();

// Public route must come BEFORE /:id/status or other generic params if any, but since it's /public/... it's fine
router.get('/public/:referenceNumber', getPublicReport);

router.post('/',              verifyAuthenticatedUser, submitReport);
router.get('/my/:userId',     verifyAuthenticatedUser, getMyReports);
router.get('/:id/evidence',   verifyAuthenticatedUser, getEvidence);
router.get('/',   verifyAdmin, getAllReports);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
