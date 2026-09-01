// controllers/document-requests.controller.js
// Business logic for document requests with real-time Phone Push Notifications & In-App Alerts.

import DocumentRequest from '../models/DocumentRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'];

// Builds the resident notification for each status transition
const buildNotification = (docRequest, status, rejectionReason, pickupDate) => {
  const { documentType, referenceNumber } = docRequest;
  const formattedDate = pickupDate 
    ? new Date(pickupDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const map = {
    'Processing': {
      title: '⏳ Request Under Processing',
      type: 'info',
      message: `Your request for "${documentType}" (Ref: ${referenceNumber}) is now being processed by the Barangay Hall.`
    },
    'Ready for Pickup': {
      title: '📄 Document Ready for Pickup!',
      type: 'success',
      message: `Your "${documentType}" (Ref: ${referenceNumber}) is ready for pickup at the Barangay Hall! ${formattedDate ? 'Schedule: ' + formattedDate + '. ' : ''}Please present your reference number and a valid ID.`
    },
    'Completed': {
      title: '✅ Document Claimed / Completed',
      type: 'success',
      message: `Your request for "${documentType}" (Ref: ${referenceNumber}) has been completed and claimed. Thank you!`
    },
    'Rejected': {
      title: '⚠️ Missing Requirements / Request Notice',
      type: 'error',
      message: `Notice regarding "${documentType}" (Ref: ${referenceNumber}): ${rejectionReason ? rejectionReason : 'Incomplete supporting documents. Please contact the Barangay Hall or re-apply.'}`
    },
  };
  return map[status] ?? { title: 'Request Updated', type: 'info', message: `Your document request status is now: ${status}` };
};

// POST / — Resident: Submit a document request
export const submitRequest = asyncHandler(async (req, res) => {
  const { fullName, address, contactNumber, documentType, purpose } = req.body;
  const userId = req.user._id;
  const username = req.user.username;

  if (!fullName || !documentType || !purpose) {
    return res.status(400).json({ message: 'Missing required fields: fullName, documentType, purpose.' });
  }

  const docRequest = await DocumentRequest.create({
    userId, username, fullName, address, contactNumber, documentType, purpose,
  });

  const notifTitle = 'Document Request Submitted';
  const notifMsg   = `Your request for "${documentType}" (Ref: ${docRequest.referenceNumber}) has been received and is pending review.`;

  await Notification.create({
    userId: docRequest.userId,
    title: notifTitle,
    message: notifMsg,
    type: 'info'
  });

  // 🔔 Dispatched to resident phone lock screen
  const resident = await User.findById(docRequest.userId);
  if (resident?.expoPushToken) {
    await sendPushNotification(
      resident.expoPushToken,
      notifTitle,
      notifMsg,
      { screen: 'Notifications', requestId: docRequest._id.toString(), type: 'DOC_SUBMITTED' }
    );
  }

  res.status(201).json({
    message: 'Document request submitted successfully!',
    referenceNumber: docRequest.referenceNumber,
    documentRequest: docRequest,
  });
});

// GET /my/:userId — Resident: Get own requests
export const getMyRequests = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden: you can only view your own requests.' });
  }

  const requests = await DocumentRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(requests);
});

// GET / — Admin: Get all requests (with optional status filter)
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const requests = await DocumentRequest.find(filter)
    .populate('userId', 'purok validIdFrontUrl validIdBackUrl accountStatus isVerified email completeAddress yearsOfResidency voterStatus mobileNumber')
    .sort({ createdAt: -1 });
  res.json(requests);
});


// PATCH /:id/status — Admin: Update request status & trigger real-time phone notification
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, pickupDate } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const docRequest = await DocumentRequest.findById(req.params.id);
  if (!docRequest) return res.status(404).json({ message: 'Request not found.' });

  docRequest.status      = status;
  docRequest.processedBy = req.user.username;
  if (rejectionReason !== undefined) docRequest.rejectionReason = rejectionReason;
  if (pickupDate !== undefined)      docRequest.pickupDate = pickupDate ? new Date(pickupDate) : null;
  await docRequest.save();

  // Create in-app notification in DB
  const notif = buildNotification(docRequest, status, rejectionReason, docRequest.pickupDate);
  await Notification.create({ userId: docRequest.userId, ...notif });

  // 🔔 Dispatch Real-Time Push Notification directly to Resident's Phone
  const resident = await User.findById(docRequest.userId);
  let pushSent = false;
  if (resident?.expoPushToken) {
    try {
      const pushResult = await sendPushNotification(
        resident.expoPushToken,
        notif.title,
        notif.message,
        {
          screen: 'Notifications',
          type: 'DOCUMENT_STATUS_UPDATE',
          documentId: docRequest._id.toString(),
          referenceNumber: docRequest.referenceNumber,
          status: status
        }
      );
      pushSent = pushResult.accepted;
      console.log(`📲 Push notification ${pushSent ? 'accepted by Expo' : 'not accepted'} for document request ${docRequest.referenceNumber}.`);
    } catch (pushErr) {
      console.error('⚠️ Failed to dispatch push notification to resident:', pushErr);
    }
  }

  logAudit(req.user.id, req.user.username, 'DOC_REQUEST_UPDATE',
    `Updated doc request ${req.params.id} (${docRequest.referenceNumber}) → ${status}`, req);

  res.json({
    message: `Request updated to "${status}". ${pushSent ? 'A phone notification was accepted for delivery processing.' : 'Resident in-app notification sent.'}`,
    documentRequest: docRequest,
    pushNotificationSent: pushSent
  });
});
