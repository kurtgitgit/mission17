// controllers/blotter.controller.js
// Business logic for blotter reports — separated from routing.

import BlotterReport from '../models/BlotterReport.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/authMiddleware.js';
import { awardSdgPoints } from '../utils/blockchain.js';
import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Dismissed'];

// POST / — Resident: Submit a new blotter report
export const submitReport = asyncHandler(async (req, res) => {
  const { userId, username, incidentType, description, location, dateOfIncident, evidenceUrl } = req.body;

  if (!userId || !incidentType || !description || !location || !dateOfIncident) {
    return res.status(400).json({ message: 'Missing required fields: userId, incidentType, description, location, dateOfIncident.' });
  }

  let finalEvidenceUrl = evidenceUrl;
  if (evidenceUrl && evidenceUrl.startsWith('data:image')) {
    const base64Data = evidenceUrl.split(',')[1];
    const filename = `blotter_${Date.now()}_${userId}.jpg`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, base64Data, 'base64');
    finalEvidenceUrl = `/uploads/${filename}`;
  }

  const report = await BlotterReport.create({
    userId, username, incidentType, description, location,
    dateOfIncident: new Date(dateOfIncident),
    evidenceUrl: finalEvidenceUrl,
  });

  await Notification.create({
    userId: report.userId,
    title: 'Blotter Report Submitted',
    message: `Your blotter report (Ref: ${report.referenceNumber}) has been successfully filed and is pending review.`,
    type: 'info'
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

  // ⛓️ Record on blockchain when a blotter is Resolved
  if (status === 'Resolved') {
    try {
      const reporter = await User.findById(report.userId);
      // ALWAYS use the Barangay's official admin wallet for the transaction (lowercase to avoid checksum errors)
      const ADMIN_WALLET = '0x7db79ec78e6e345fe23cf7fb790846365d107ffb';
      
      console.log(`⛓️ Recording blotter resolution on blockchain for ${reporter?.username || 'Unknown'} (Using Admin Wallet)...`);
      const txHash = await awardSdgPoints(ADMIN_WALLET, 1);
      report.blockchainTxHash = txHash;
      console.log(`✅ Blotter blockchain TX: ${txHash}`);
      
    } catch (blockchainError) {
      // Non-blocking: log the error but still resolve the report
      console.error('❌ Blockchain record failed for blotter:', blockchainError.message);
      report.blockchainTxHash = 'TX_FAILED';
    }
  }

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
