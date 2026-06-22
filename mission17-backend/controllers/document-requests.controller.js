// controllers/document-requests.controller.js
// Business logic for document requests — separated from routing.

import DocumentRequest from '../models/DocumentRequest.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'];

// Builds the resident notification for each status transition
const buildNotification = (docRequest, status, rejectionReason) => {
  const { documentType, referenceNumber } = docRequest;
  const map = {
    'Processing':       { title: 'Request Processing',          type: 'info',    message: `Your request for "${documentType}" (Ref: ${referenceNumber}) is now being processed.` },
    'Ready for Pickup': { title: '📄 Document Ready for Pickup!', type: 'success', message: `Your "${documentType}" (Ref: ${referenceNumber}) is ready! Visit the Barangay Hall to pick it up.` },
    'Completed':        { title: 'Request Completed',            type: 'success', message: `Your request for "${documentType}" (Ref: ${referenceNumber}) has been completed. Thank you!` },
    'Rejected':         { title: 'Request Rejected',             type: 'error',   message: `Your request for "${documentType}" (Ref: ${referenceNumber}) was rejected. ${rejectionReason ? 'Reason: ' + rejectionReason : 'Please contact the barangay for details.'}` },
  };
  return map[status] ?? { title: 'Request Updated', type: 'info', message: `Your document request status is now: ${status}` };
};

// POST / — Resident: Submit a document request
export const submitRequest = asyncHandler(async (req, res) => {
  const { userId, username, fullName, address, contactNumber, documentType, purpose } = req.body;

  if (!userId || !fullName || !documentType || !purpose) {
    return res.status(400).json({ message: 'Missing required fields: userId, fullName, documentType, purpose.' });
  }

  const docRequest = await DocumentRequest.create({
    userId, username, fullName, address, contactNumber, documentType, purpose,
  });

  await Notification.create({
    userId: docRequest.userId,
    title: 'Document Request Submitted',
    message: `Your request for "${documentType}" (Ref: ${docRequest.referenceNumber}) has been received and is pending review.`,
    type: 'info'
  });

  res.status(201).json({
    message: 'Document request submitted successfully!',
    referenceNumber: docRequest.referenceNumber,
    documentRequest: docRequest,
  });
});

// GET /my/:userId — Resident: Get own requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await DocumentRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(requests);
});

// GET / — Admin: Get all requests (with optional status filter)
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const requests = await DocumentRequest.find(filter).sort({ createdAt: -1 });
  res.json(requests);
});

// PATCH /:id/status — Admin: Update request status
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, pickupDate } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const docRequest = await DocumentRequest.findById(req.params.id);
  if (!docRequest) return res.status(404).json({ message: 'Request not found.' });

  docRequest.status      = status;
  docRequest.processedBy = req.user.username;
  if (rejectionReason) docRequest.rejectionReason = rejectionReason;
  if (pickupDate)      docRequest.pickupDate = new Date(pickupDate);
  await docRequest.save();

  // Notify resident
  const notif = buildNotification(docRequest, status, rejectionReason);
  await Notification.create({ userId: docRequest.userId, ...notif });

  logAudit(req.user.id, req.user.username, 'DOC_REQUEST_UPDATE',
    `Updated doc request ${req.params.id} → ${status}`, req);

  res.json({ message: `Request updated to "${status}".`, documentRequest: docRequest });
});
