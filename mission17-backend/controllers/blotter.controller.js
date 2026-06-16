// controllers/blotter.controller.js
// Business logic for blotter reports — separated from routing.

import BlotterReport from '../models/BlotterReport.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Dismissed'];

// POST / — Resident: Submit a new blotter report
export const submitReport = asyncHandler(async (req, res) => {
  const { userId, username, incidentType, description, location, dateOfIncident, evidenceUrl } = req.body;

  if (!userId || !incidentType || !description || !location || !dateOfIncident) {
    return res.status(400).json({ message: 'Missing required fields: userId, incidentType, description, location, dateOfIncident.' });
  }

  const report = await BlotterReport.create({
    userId, username, incidentType, description, location,
    dateOfIncident: new Date(dateOfIncident),
    evidenceUrl,
  });

  res.status(201).json({
    message: 'Blotter report submitted successfully!',
    referenceNumber: report.referenceNumber,
    report,
  });
});

// GET /my/:userId — Resident: Get own reports
export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await BlotterReport.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(reports);
});

// GET / — Admin: Get all reports (with optional status filter)
export const getAllReports = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const reports = await BlotterReport.find(filter).sort({ createdAt: -1 });
  res.json(reports);
});

// PATCH /:id/status — Admin: Update report status
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const report = await BlotterReport.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });

  report.status = status;
  if (adminRemarks) report.adminRemarks = adminRemarks;
  await report.save();

  // Notify the resident
  await Notification.create({
    userId:  report.userId,
    title:   'Blotter Report Update',
    message: `Your report (Ref: ${report.referenceNumber}) status is now "${status}".`,
    type:    status === 'Resolved' ? 'success' : 'info',
  });

  logAudit(req.user.id, req.user.username, 'BLOTTER_UPDATE',
    `Updated blotter ${report.referenceNumber} → ${status}`, req);

  res.json({ message: `Report updated to "${status}".`, report });
});
