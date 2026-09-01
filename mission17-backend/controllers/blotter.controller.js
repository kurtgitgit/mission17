// controllers/blotter.controller.js
// Business logic for blotter reports — separated from routing.

import BlotterReport from '../models/BlotterReport.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/authMiddleware.js';
import { awardSdgPoints } from '../utils/blockchain.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
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
  const { fullName, contactNumber, incidentType, description, location, dateOfIncident, evidenceUrl } = req.body;
  const userId = req.user._id;
  const username = req.user.username;

  if (!incidentType || !description || !location || !dateOfIncident) {
    return res.status(400).json({ message: 'Missing required fields: incidentType, description, location, dateOfIncident.' });
  }

  let finalEvidenceUrl = evidenceUrl;
  if (evidenceUrl && evidenceUrl.startsWith('data:image')) {
    const base64Data = evidenceUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save as highly compressed webp to save server storage
    const filename = `blotter_${Date.now()}_${userId}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    await sharp(buffer)
      .resize({ width: 1000, withoutEnlargement: true }) // Prevent massive 4k uploads
      .webp({ quality: 80 })
      .toFile(filepath);
      
    finalEvidenceUrl = `/uploads/${filename}`;
  }

  const report = await BlotterReport.create({
    userId, username, fullName, contactNumber, incidentType, description, location,
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
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden: you can only view your own reports.' });
  }

  const reports = await BlotterReport.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(reports);
});

// GET /:id/evidence — Report owner or administrator: view private evidence.
// Local evidence files are never exposed from a public static directory.
export const getEvidence = asyncHandler(async (req, res) => {
  const report = await BlotterReport.findById(req.params.id).select('userId evidenceUrl');
  if (!report || !report.evidenceUrl) {
    return res.status(404).json({ message: 'Evidence not found.' });
  }

  const isOwner = report.userId?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: you cannot view this evidence.' });
  }

  if (!report.evidenceUrl.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'Private local evidence not found.' });
  }

  const filename = path.basename(report.evidenceUrl);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Evidence file not found.' });
  }

  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
});

// GET / — Admin: Get all reports (with optional status filter and pagination)
export const getAllReports = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  
  // Anti-Crash Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const reports = await BlotterReport.find(filter)
    .populate('userId', 'firstName lastName middleName username completeAddress mobileNumber purok')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  res.json(reports);
});

// PATCH /:id/status — Admin: Update report status & schedule Lupon hearings
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks, respondentName, hearingDate, hearingStage, luponOfficerInCharge } = req.body;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const report = await BlotterReport.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });

  if (status) report.status = status;
  if (adminRemarks !== undefined) report.adminRemarks = adminRemarks;
  if (respondentName !== undefined) report.respondentName = respondentName;
  if (hearingDate !== undefined) report.hearingDate = hearingDate ? new Date(hearingDate) : null;
  if (hearingStage !== undefined) report.hearingStage = hearingStage;
  if (luponOfficerInCharge !== undefined) report.luponOfficerInCharge = luponOfficerInCharge;

  // ⛓️ Record on blockchain when a blotter is Resolved
  if (status === 'Resolved' && !report.blockchainTxHash) {
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
  const hearingStr = report.hearingDate 
    ? ` Schedule: ${new Date(report.hearingDate).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (${report.hearingStage || 'Lupon Hearing'}).`
    : '';

  const notificationTitle = report.hearingDate ? '⚖️ Lupon Hearing Scheduled' : 'Blotter Report Update';
  const notificationMessage = `Your report (Ref: ${report.referenceNumber}) status is now "${report.status}".${hearingStr}`;

  await Notification.create({
    userId:  report.userId,
    title:   notificationTitle,
    message: notificationMessage,
    type:    report.status === 'Resolved' ? 'success' : 'info',
  });

  const resident = await User.findById(report.userId);
  if (resident && resident.expoPushToken) {
    await sendPushNotification(resident.expoPushToken, notificationTitle, notificationMessage, { screen: 'BlotterHistory' });
  }

  logAudit(req.user.id, req.user.username, 'BLOTTER_UPDATE',
    `Updated blotter ${report.referenceNumber} → ${report.status}${report.hearingStage ? ` (${report.hearingStage})` : ''}`, req);

  res.json({ message: `Report updated successfully.`, report });
});


// GET /public/:referenceNumber — Public: Verify a report's blockchain status
export const getPublicReport = asyncHandler(async (req, res) => {
  const { referenceNumber } = req.params;
  const report = await BlotterReport.findOne({ referenceNumber });
  
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  // Return only safe, public verification data
  res.json({
    referenceNumber: report.referenceNumber,
    status: report.status,
    blockchainTxHash: report.blockchainTxHash,
    incidentType: report.incidentType,
    dateOfIncident: report.dateOfIncident,
    // explicitly NOT returning description, location, or user details for privacy
  });
});
