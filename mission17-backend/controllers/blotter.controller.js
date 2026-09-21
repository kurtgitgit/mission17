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
const ALLOWED_HEARING_STAGES = ['None', 'Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'];
const MAX_REMOTE_EVIDENCE_BYTES = 8 * 1024 * 1024;
const MAX_INLINE_EVIDENCE_LENGTH = Math.ceil(MAX_REMOTE_EVIDENCE_BYTES * 4 / 3) + 256;

const isApprovedCloudinaryEvidenceUrl = (value) => {
  try {
    const url = new URL(value);
    const configuredCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const [cloudName, resourceType, deliveryType] = url.pathname.split('/').filter(Boolean);
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && Boolean(configuredCloudName)
      && cloudName === configuredCloudName
      && resourceType === 'image'
      && deliveryType === 'upload';
  } catch {
    return false;
  }
};

// POST / — Resident: Submit a new blotter report
export const submitReport = asyncHandler(async (req, res) => {
  const { fullName, contactNumber, incidentType, description, location, dateOfIncident, evidenceUrl } = req.body;
  const userId = req.user._id;
  const username = req.user.username;

  const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
  const cleanContact = typeof contactNumber === 'string' ? contactNumber.replace(/\s/g, '') : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const cleanLocation = typeof location === 'string' ? location.trim() : '';
  const parsedIncidentDate = new Date(dateOfIncident);

  if (!incidentType || !cleanDescription || !cleanLocation || !dateOfIncident) {
    return res.status(400).json({ message: 'Missing required fields: incidentType, description, location, dateOfIncident.' });
  }
  if (cleanName.length < 3 || cleanName.length > 120) return res.status(400).json({ message: 'Please enter a valid complete name.' });
  if (!/^09\d{9}$/.test(cleanContact) || /^(.)\1+$/.test(cleanContact)) return res.status(400).json({ message: 'Enter a valid 11-digit Philippine mobile number.' });
  if (cleanDescription.length < 10 || cleanDescription.length > 2000) return res.status(400).json({ message: 'Incident description must be between 10 and 2,000 characters.' });
  if (cleanLocation.length < 3 || cleanLocation.length > 250) return res.status(400).json({ message: 'Please enter a valid incident location.' });
  if (Number.isNaN(parsedIncidentDate.getTime()) || parsedIncidentDate.getTime() > Date.now() + 5 * 60_000) return res.status(400).json({ message: 'Please provide a valid incident date.' });
  if (evidenceUrl && (typeof evidenceUrl !== 'string' || evidenceUrl.length > MAX_INLINE_EVIDENCE_LENGTH)) return res.status(413).json({ message: 'Evidence image is too large.' });

  const recentDuplicate = await BlotterReport.findOne({
    userId, incidentType, description: cleanDescription, location: cleanLocation,
    createdAt: { $gte: new Date(Date.now() - 2 * 60_000) }
  });
  if (recentDuplicate) return res.status(409).json({ message: 'This incident report was already submitted. Check your blotter history.' });

  let finalEvidenceUrl = evidenceUrl;
  if (evidenceUrl && evidenceUrl.startsWith('data:image')) {
    if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(evidenceUrl)) return res.status(400).json({ message: 'Unsupported evidence image format.' });
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
    userId, username, fullName: cleanName, contactNumber: cleanContact, incidentType, description: cleanDescription, location: cleanLocation,
    dateOfIncident: parsedIncidentDate,
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
  if (!isOwner && !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: you cannot view this evidence.' });
  }

  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');

  if (report.evidenceUrl.startsWith('/uploads/')) {
    const filename = path.basename(report.evidenceUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Evidence file not found on this server.' });
    }
    return res.sendFile(filePath);
  }

  // Legacy records may reference this project's Cloudinary account. Proxy the
  // image through the authenticated endpoint so the admin UI never bypasses
  // the owner/admin authorization above. The strict allowlist prevents SSRF.
  if (isApprovedCloudinaryEvidenceUrl(report.evidenceUrl)) {
    let upstream;
    try {
      upstream = await fetch(report.evidenceUrl, {
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return res.status(502).json({ message: 'Evidence storage could not be reached.' });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const declaredSize = Number(upstream.headers.get('content-length') || 0);
    if (!upstream.ok || !contentType.toLowerCase().startsWith('image/')) {
      return res.status(404).json({ message: 'Evidence image was not found in protected storage.' });
    }
    if (declaredSize > MAX_REMOTE_EVIDENCE_BYTES) {
      return res.status(413).json({ message: 'Evidence image is too large to display.' });
    }

    const evidenceBuffer = Buffer.from(await upstream.arrayBuffer());
    if (evidenceBuffer.length > MAX_REMOTE_EVIDENCE_BYTES) {
      return res.status(413).json({ message: 'Evidence image is too large to display.' });
    }

    res.type(contentType);
    return res.send(evidenceBuffer);
  }

  return res.status(404).json({ message: 'Evidence storage location is unsupported or no longer available.' });
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
  if (adminRemarks !== undefined && (typeof adminRemarks !== 'string' || adminRemarks.length > 2000)) {
    return res.status(400).json({ message: 'Admin remarks must be text with no more than 2,000 characters.' });
  }
  if (respondentName !== undefined && (typeof respondentName !== 'string' || respondentName.length > 120)) {
    return res.status(400).json({ message: 'Respondent name must be text with no more than 120 characters.' });
  }
  if (hearingStage !== undefined && !ALLOWED_HEARING_STAGES.includes(hearingStage)) {
    return res.status(400).json({ message: 'Please select a valid Lupon hearing stage.' });
  }
  if (luponOfficerInCharge !== undefined && (typeof luponOfficerInCharge !== 'string' || luponOfficerInCharge.length > 160)) {
    return res.status(400).json({ message: 'Lupon officer name must be text with no more than 160 characters.' });
  }
  let parsedHearingDate;
  if (hearingDate) {
    parsedHearingDate = new Date(hearingDate);
    if (Number.isNaN(parsedHearingDate.getTime())) return res.status(400).json({ message: 'Please provide a valid hearing date and time.' });
  }

  const report = await BlotterReport.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });

  const isStatusTransition = Boolean(status && status !== report.status);
  if (isStatusTransition && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only the Barangay Captain can change a blotter case status.' });
  }

  if (status) report.status = status;
  if (adminRemarks !== undefined) report.adminRemarks = adminRemarks.trim();
  if (respondentName !== undefined) report.respondentName = respondentName.trim();
  if (hearingDate !== undefined) report.hearingDate = hearingDate ? parsedHearingDate : null;
  if (hearingStage !== undefined) report.hearingStage = hearingStage;
  if (luponOfficerInCharge !== undefined) report.luponOfficerInCharge = luponOfficerInCharge.trim();

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

  await logAudit(req.user.id, req.user.username, isStatusTransition ? 'BLOTTER_FINAL_DECISION' : 'BLOTTER_UPDATE',
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
