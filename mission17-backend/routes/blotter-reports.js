// routes/blotter-reports.js
// Pure routing — all logic lives in blotter.controller.js

import express from 'express';
import { verifyAdmin } from '../utils/authMiddleware.js';
import { submitReport, getMyReports, getAllReports, updateStatus, getPublicReport } from '../controllers/blotter.controller.js';

const router = express.Router();

// Public route must come BEFORE /:id/status or other generic params if any, but since it's /public/... it's fine
router.get('/public/:referenceNumber', getPublicReport);

router.post('/',              submitReport);
router.get('/my/:userId',     getMyReports);
router.get('/',   verifyAdmin, getAllReports);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
