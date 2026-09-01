// routes/document-requests.js
// Pure routing — all logic lives in document-requests.controller.js

import express from 'express';
import { verifyAdmin, verifyAuthenticatedUser } from '../utils/authMiddleware.js';
import { submitRequest, getMyRequests, getAllRequests, updateStatus } from '../controllers/document-requests.controller.js';

const router = express.Router();

router.post('/',             verifyAuthenticatedUser, submitRequest);
router.get('/my/:userId',    verifyAuthenticatedUser, getMyRequests);
router.get('/', verifyAdmin, getAllRequests);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
