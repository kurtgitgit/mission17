// routes/blotter-reports.js
// Pure routing — all logic lives in blotter.controller.js

import express from 'express';
import { verifyAdmin } from '../utils/authMiddleware.js';
import { submitReport, getMyReports, getAllReports, updateStatus } from '../controllers/blotter.controller.js';

const router = express.Router();

router.post('/',              submitReport);
router.get('/my/:userId',     getMyReports);
router.get('/',   verifyAdmin, getAllReports);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
