// routes/document-requests.js
// Pure routing — all logic lives in document-requests.controller.js

import express from 'express';
import { verifyAdmin } from '../utils/authMiddleware.js';
import { submitRequest, getMyRequests, getAllRequests, updateStatus } from '../controllers/document-requests.controller.js';

const router = express.Router();

router.post('/',             submitRequest);
router.get('/my/:userId',    getMyRequests);
router.get('/', verifyAdmin, getAllRequests);
router.patch('/:id/status', verifyAdmin, updateStatus);

export default router;
