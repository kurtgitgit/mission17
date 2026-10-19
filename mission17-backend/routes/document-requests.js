// routes/document-requests.js
// Pure routing — all logic lives in document-requests.controller.js

import express from 'express';
import DocumentRequest from '../models/DocumentRequest.js';
import { archiveRecord } from '../utils/serviceArchive.js';
import { verifyAdmin, verifyAuthenticatedUser } from '../utils/authMiddleware.js';
import { submitRequest, getMyRequests, getAllRequests, updateStatus } from '../controllers/document-requests.controller.js';

const router = express.Router();

router.post('/',             verifyAuthenticatedUser, submitRequest);
router.get('/my/:userId',    verifyAuthenticatedUser, getMyRequests);
router.get('/', verifyAdmin, getAllRequests);
router.patch('/:id/status', verifyAdmin, updateStatus);
router.patch('/:id/archive', verifyAdmin, archiveRecord(DocumentRequest, ['Completed', 'Rejected']));

export default router;
