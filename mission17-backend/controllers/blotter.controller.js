// controllers/blotter.controller.js
// Business logic for blotter reports — separated from routing.

import BlotterReport from '../models/BlotterReport.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/authMiddleware.js';
import { isResolutionLedgerConfigured, recordResolvedBlotterLedgerEntry } from '../utils/blockchain.js';
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
const ALLOWED_HEARING_STAGES = ['None', 'Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)'];
const ALLOWED_CASE_OUTCOMES = ['Open', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'];
const ALLOWED_CFA_FORM_BASES = ['repudiated-settlement', 'pangkat-failed-conciliation', 'respondent-failed-to-appear'];
const LEGACY_OUTCOMES_BY_HEARING_STAGE = {
  'Amicable Settlement': 'Amicable Settlement',
  'Issued Certificate to File Action (CFA)': 'Issued Certificate to File Action (CFA)',
};
const ALLOWED_TRIAGE_OUTCOMES = ['Pending Review', 'Follow-up Needed', 'Potential Lupon Referral', 'Referred Outside Lupon'];
const TERMINAL_STATUSES = ['Resolved', 'Dismissed'];
const SCHEDULED_HEARING_STAGES = ['Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)'];
const getCurrentHearingStage = (report) => SCHEDULED_HEARING_STAGES.includes(report.hearingStage) ? report.hearingStage : 'None';
const getCurrentCaseOutcome = (report) => {
  if (report.caseOutcome && report.caseOutcome !== 'Open') return report.caseOutcome;
  return LEGACY_OUTCOMES_BY_HEARING_STAGE[report.hearingStage] || report.caseOutcome || 'Open';
};
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
  const { fullName, contactNumber, incidentType, description, location, dateOfIncident, evidenceUrl, reportedRespondentName } = req.body;
  const userId = req.user._id;
  const username = req.user.username;

  const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
  const cleanContact = typeof contactNumber === 'string' ? contactNumber.replace(/\s/g, '') : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const cleanLocation = typeof location === 'string' ? location.trim() : '';
  const cleanReportedRespondentName = typeof reportedRespondentName === 'string' ? reportedRespondentName.trim() : '';
  const parsedIncidentDate = new Date(dateOfIncident);

  if (!incidentType || !cleanDescription || !cleanLocation || !dateOfIncident) {
    return res.status(400).json({ message: 'Missing required fields: incidentType, description, location, dateOfIncident.' });
  }
  if (cleanName.length < 3 || cleanName.length > 120) return res.status(400).json({ message: 'Please enter a valid complete name.' });
  if (!/^09\d{9}$/.test(cleanContact) || /^(.)\1+$/.test(cleanContact)) return res.status(400).json({ message: 'Enter a valid 11-digit Philippine mobile number.' });
  if (reportedRespondentName !== undefined && (typeof reportedRespondentName !== 'string' || cleanReportedRespondentName.length > 120)) return res.status(400).json({ message: 'Person involved must be text with no more than 120 characters.' });
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
    reportedRespondentName: cleanReportedRespondentName,
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
  res.set('Cache-Control', 'private, no-store, max-age=0');
  // The hearing timeline contains staff-only notes and must remain admin-only.
  const residentReports = reports.map((report) => {
    const safeReport = typeof report.toObject === 'function' ? report.toObject() : { ...report };
    delete safeReport.hearingHistory;
    return safeReport;
  });
  res.json(residentReports);
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
  const {
    status, adminRemarks, respondentName, reportedRespondentName, triageOutcome,
    hearingDate, hearingStage, luponOfficerInCharge, caseOutcome, cfaFormBasis,
    stageAdvanceReason, hearingNotes,
  } = req.body;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }
  if (adminRemarks !== undefined && (typeof adminRemarks !== 'string' || adminRemarks.length > 2000)) {
    return res.status(400).json({ message: 'Admin remarks must be text with no more than 2,000 characters.' });
  }
  if (respondentName !== undefined && (typeof respondentName !== 'string' || respondentName.length > 120)) {
    return res.status(400).json({ message: 'Respondent name must be text with no more than 120 characters.' });
  }
  if (reportedRespondentName !== undefined) {
    return res.status(400).json({ message: 'The resident-reported person name cannot be edited by staff. Enter a confirmed respondent in the staff case record.' });
  }
  if (triageOutcome !== undefined && !ALLOWED_TRIAGE_OUTCOMES.includes(triageOutcome)) {
    return res.status(400).json({ message: 'Please select a valid staff review outcome.' });
  }
  const legacyOutcomeFromRequest = LEGACY_OUTCOMES_BY_HEARING_STAGE[hearingStage];
  if (hearingStage !== undefined && !ALLOWED_HEARING_STAGES.includes(hearingStage) && !legacyOutcomeFromRequest) {
    return res.status(400).json({ message: 'Please select a valid Lupon hearing stage.' });
  }
  if (caseOutcome !== undefined && !ALLOWED_CASE_OUTCOMES.includes(caseOutcome)) {
    return res.status(400).json({ message: 'Please select a valid case outcome.' });
  }
  if (cfaFormBasis !== undefined && cfaFormBasis !== null && cfaFormBasis !== '' && !ALLOWED_CFA_FORM_BASES.includes(cfaFormBasis)) {
    return res.status(400).json({ message: 'Please select a valid CFA form basis.' });
  }
  if (stageAdvanceReason !== undefined && (typeof stageAdvanceReason !== 'string' || stageAdvanceReason.length > 1000)) {
    return res.status(400).json({ message: 'The prior-process note must be text with no more than 1,000 characters.' });
  }
  if (hearingNotes !== undefined && (typeof hearingNotes !== 'string' || hearingNotes.length > 2000)) {
    return res.status(400).json({ message: 'Hearing notes must be text with no more than 2,000 characters.' });
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
  if (isStatusTransition) {
    const currentRank = ALLOWED_STATUSES.indexOf(report.status);
    const nextRank = ALLOWED_STATUSES.indexOf(status);
    if (TERMINAL_STATUSES.includes(report.status) || nextRank <= currentRank) {
      return res.status(409).json({ message: `Case status cannot move backward from "${report.status}" to "${status}".` });
    }
  }

  const currentHearingStage = getCurrentHearingStage(report);
  const requestedHearingStage = legacyOutcomeFromRequest
    ? currentHearingStage
    : (hearingStage === undefined ? currentHearingStage : hearingStage);
  const isHearingTransition = requestedHearingStage !== currentHearingStage;
  const currentCaseOutcome = getCurrentCaseOutcome(report);
  const nextCaseOutcome = caseOutcome === undefined
    ? (legacyOutcomeFromRequest || currentCaseOutcome)
    : caseOutcome;
  const outcomeChanged = nextCaseOutcome !== currentCaseOutcome;
  const currentCfaFormBasis = report.cfaFormBasis || null;
  const nextCfaFormBasis = cfaFormBasis === undefined ? (report.cfaFormBasis || null) : (cfaFormBasis || null);
  const cfaBasisChanged = nextCfaFormBasis !== currentCfaFormBasis;
  const currentHearingDateTime = report.hearingDate ? new Date(report.hearingDate).getTime() : null;
  const currentPresidingOfficer = report.luponOfficerInCharge || '';
  const nextHearingDate = hearingDate === undefined ? report.hearingDate : (hearingDate ? parsedHearingDate : null);
  const nextHearingDateTime = nextHearingDate ? new Date(nextHearingDate).getTime() : null;
  const nextPresidingOfficer = luponOfficerInCharge === undefined
    ? currentPresidingOfficer
    : luponOfficerInCharge.trim();
  const hasScheduledHearing = SCHEDULED_HEARING_STAGES.includes(requestedHearingStage);
  const hearingScheduleChanged = hasScheduledHearing && (
    requestedHearingStage !== currentHearingStage
    || nextHearingDateTime !== currentHearingDateTime
    || nextPresidingOfficer !== currentPresidingOfficer
  );

  if (isHearingTransition) {
    if (currentCaseOutcome !== 'Open') {
      return res.status(409).json({ message: `Lupon hearing progress cannot advance after the case outcome is recorded as "${currentCaseOutcome}".` });
    }
    const currentRank = ALLOWED_HEARING_STAGES.indexOf(currentHearingStage);
    const nextRank = ALLOWED_HEARING_STAGES.indexOf(requestedHearingStage);
    if (nextRank <= currentRank) {
      return res.status(409).json({ message: `Lupon hearing stage cannot move backward from "${currentHearingStage}" to "${requestedHearingStage}".` });
    }
    const skippedStage = nextRank > currentRank + 1;
    const cleanAdvanceReason = typeof stageAdvanceReason === 'string' ? stageAdvanceReason.trim() : '';
    if (skippedStage && cleanAdvanceReason.length < 10) {
      return res.status(400).json({ message: 'Add a short staff note explaining which earlier process steps were completed before BrgyLink.' });
    }
    if (!skippedStage && cleanAdvanceReason) {
      return res.status(400).json({ message: 'A prior-process note is only needed when recording a case that skipped an earlier BrgyLink stage.' });
    }
    if (currentHearingStage !== 'None' && nextHearingDateTime === currentHearingDateTime) {
      return res.status(400).json({ message: 'Choose a new date and time for this hearing stage. The earlier schedule will remain in the history.' });
    }
  }

  if (hearingNotes?.trim() && !hearingScheduleChanged) {
    return res.status(400).json({ message: 'Staff hearing notes must be saved with a new or changed hearing schedule.' });
  }

  if (outcomeChanged && currentCaseOutcome === 'Issued Certificate to File Action (CFA)') {
    return res.status(409).json({ message: 'A recorded CFA outcome cannot be changed to another outcome.' });
  }
  if (outcomeChanged && currentCaseOutcome === 'Amicable Settlement'
    && !(nextCaseOutcome === 'Issued Certificate to File Action (CFA)' && nextCfaFormBasis === 'repudiated-settlement')) {
    return res.status(409).json({ message: 'A settlement can proceed to CFA only when the Lupon Secretary confirms a repudiated-settlement basis.' });
  }
  if (outcomeChanged && nextCaseOutcome === 'Amicable Settlement') {
    if (requestedHearingStage === 'None' || (triageOutcome ?? report.triageOutcome) !== 'Potential Lupon Referral') {
      return res.status(400).json({ message: 'Record a Lupon hearing and Potential Lupon Referral before saving a settlement outcome.' });
    }
    const effectiveRespondentName = respondentName === undefined ? report.respondentName : respondentName.trim();
    if (!effectiveRespondentName) {
      return res.status(400).json({ message: 'Confirm and record the respondent before saving a settlement outcome.' });
    }
  }
  if (nextCaseOutcome === 'Issued Certificate to File Action (CFA)') {
    if (!nextCfaFormBasis && currentCaseOutcome !== 'Issued Certificate to File Action (CFA)') {
      return res.status(400).json({ message: 'Choose and save the CFA basis that matches the official case record.' });
    }
    if (currentCaseOutcome === 'Amicable Settlement' && nextCfaFormBasis !== 'repudiated-settlement') {
      return res.status(400).json({ message: 'A case recorded as settled may proceed to CFA only with the repudiated-settlement basis.' });
    }
    if (outcomeChanged && currentCaseOutcome === 'Open') {
      if (nextCfaFormBasis === 'repudiated-settlement') {
        return res.status(400).json({ message: 'Record the amicable settlement first, then select CFA if the settlement is repudiated.' });
      }
      if (requestedHearingStage === 'None') {
        return res.status(400).json({ message: 'Record the applicable Lupon hearing stage before saving a CFA outcome.' });
      }
      if ((triageOutcome ?? report.triageOutcome) !== 'Potential Lupon Referral') {
        return res.status(400).json({ message: 'Complete staff review and select Potential Lupon Referral before saving a CFA outcome.' });
      }
      const effectiveRespondentName = respondentName === undefined ? report.respondentName : respondentName.trim();
      if (!effectiveRespondentName) {
        return res.status(400).json({ message: 'Confirm and record the respondent before saving a CFA outcome.' });
      }
    }
  } else if (nextCfaFormBasis) {
    return res.status(400).json({ message: 'A CFA basis can only be saved with a CFA case outcome.' });
  }

  // A scheduled Lupon hearing is not meaningful to the resident without its
  // appointment details. Enforce this server-side so direct API calls cannot
  // create a hearing stage with no date, time, or presiding officer.
  const effectiveHearingStage = requestedHearingStage;
  if (SCHEDULED_HEARING_STAGES.includes(effectiveHearingStage)) {
    const effectiveHearingDate = hearingDate === undefined ? report.hearingDate : hearingDate;
    const effectiveOfficer = luponOfficerInCharge === undefined
      ? report.luponOfficerInCharge
      : luponOfficerInCharge.trim();
    const effectiveDate = effectiveHearingDate ? new Date(effectiveHearingDate) : null;

    if (!effectiveDate || Number.isNaN(effectiveDate.getTime())) {
      return res.status(400).json({ message: 'A Lupon hearing stage requires a valid hearing date and time.' });
    }
    if (!effectiveOfficer) {
      return res.status(400).json({ message: 'A Lupon hearing stage requires a presiding officer.' });
    }
  }

  if (isHearingTransition && requestedHearingStage !== 'None') {
    const effectiveTriageOutcome = triageOutcome === undefined ? (report.triageOutcome || 'Pending Review') : triageOutcome;
    const effectiveRespondentName = respondentName === undefined ? report.respondentName : respondentName.trim();
    if (effectiveTriageOutcome !== 'Potential Lupon Referral') {
      return res.status(400).json({ message: 'Complete staff review and select Potential Lupon Referral before scheduling a hearing.' });
    }
    if (!effectiveRespondentName) {
      return res.status(400).json({ message: 'Confirm and enter the respondent before scheduling a Lupon hearing.' });
    }
  }

  if (hearingScheduleChanged) {
    if (!Array.isArray(report.hearingHistory)) report.hearingHistory = [];

    // Older cases only kept the latest schedule. Preserve that known detail as
    // a clearly-labelled snapshot before appending the first new timeline event.
    if (
      report.hearingHistory.length === 0
      && currentHearingStage !== 'None'
      && report.hearingDate
    ) {
      report.hearingHistory.push({
        hearingStage: currentHearingStage,
        hearingDate: report.hearingDate,
        presidingOfficer: currentPresidingOfficer,
        eventType: 'previously-recorded',
        staffNotes: '',
        recordedBy: null,
        recordedByName: '',
        recordedAt: report.updatedAt || report.createdAt || report.hearingDate,
      });
    }

    const eventType = requestedHearingStage !== currentHearingStage
      ? (currentHearingStage === 'None' ? 'scheduled' : 'stage-advanced')
      : (nextHearingDateTime !== currentHearingDateTime ? 'rescheduled' : 'presiding-officer-updated');
    const eventNotes = [
      stageAdvanceReason?.trim() ? `Earlier process completed before BrgyLink: ${stageAdvanceReason.trim()}` : '',
      hearingNotes?.trim() || '',
    ].filter(Boolean).join('\n');

    report.hearingHistory.push({
      hearingStage: requestedHearingStage,
      hearingDate: nextHearingDate,
      presidingOfficer: nextPresidingOfficer,
      eventType,
      staffNotes: eventNotes,
      recordedBy: req.user._id,
      recordedByName: req.user.username || '',
      recordedAt: new Date(),
    });
  }

  if (status) report.status = status;
  if (adminRemarks !== undefined) report.adminRemarks = adminRemarks.trim();
  if (respondentName !== undefined) report.respondentName = respondentName.trim();
  if (triageOutcome !== undefined) report.triageOutcome = triageOutcome;
  if (hearingDate !== undefined) report.hearingDate = hearingDate ? parsedHearingDate : null;
  if (hearingStage !== undefined) report.hearingStage = requestedHearingStage;
  if (caseOutcome !== undefined || legacyOutcomeFromRequest) report.caseOutcome = nextCaseOutcome;
  if (cfaFormBasis !== undefined || outcomeChanged || legacyOutcomeFromRequest) report.cfaFormBasis = nextCfaFormBasis;
  if (luponOfficerInCharge !== undefined) report.luponOfficerInCharge = luponOfficerInCharge.trim();

  // Anchor only a privacy-safe resolution digest. The removed points contract
  // must never be used as evidence that a case was recorded.
  if (status === 'Resolved' && report.blockchainRecordStatus !== 'Recorded') {
    if (!isResolutionLedgerConfigured()) {
      report.blockchainRecordStatus = 'Not Configured';
    } else {
      try {
        const ledgerRecord = await recordResolvedBlotterLedgerEntry(report);
        report.blockchainTxHash = ledgerRecord.txHash;
        report.blockchainRecordHash = ledgerRecord.integrityHash;
        report.blockchainRecordedAt = new Date();
        report.blockchainRecordStatus = 'Recorded';
        console.log(`Resolution ledger entry recorded for ${ledgerRecord.referenceNumber}: ${ledgerRecord.txHash}`);
      } catch (blockchainError) {
        // Non-blocking: the Captain's resolution is still saved, but the UI will
        // accurately report that an integrity entry was not created.
        console.error('Resolution ledger record failed for blotter:', blockchainError.message);
        report.blockchainTxHash = null;
        report.blockchainRecordHash = null;
        report.blockchainRecordedAt = null;
        report.blockchainRecordStatus = 'Failed';
      }
    }
  }

  await report.save();

  // Notify the resident
  const savedHearingDateTime = report.hearingDate ? new Date(report.hearingDate).getTime() : null;
  const shouldNotifyHearing = hasScheduledHearing && hearingScheduleChanged && Boolean(savedHearingDateTime);
  const hearingStr = shouldNotifyHearing
    ? ` Schedule: ${new Date(report.hearingDate).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (${report.hearingStage || 'Lupon Hearing'}). Presiding official: ${report.luponOfficerInCharge || 'To be confirmed'}.`
    : '';

  const notificationTitle = shouldNotifyHearing ? '⚖️ Lupon Hearing Scheduled' : 'Blotter Report Update';
  const outcomeStr = outcomeChanged ? ` Case outcome: ${report.caseOutcome}.` : '';
  const notificationMessage = `Your report (Ref: ${report.referenceNumber}) status is now "${report.status}".${hearingStr}${outcomeStr}`;

  try {
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
  } catch (notificationError) {
    console.error('Blotter status saved, but resident notification failed:', notificationError.message);
  }

  const auditDetails = [
    `Updated blotter ${report.referenceNumber} → ${report.status}`,
    report.hearingStage && report.hearingStage !== 'None' ? `Hearing: ${report.hearingStage}` : '',
    hearingScheduleChanged ? `Hearing schedule history: ${report.hearingHistory.length} event(s) recorded` : '',
    outcomeChanged ? `Outcome: ${currentCaseOutcome} → ${report.caseOutcome}` : '',
    cfaBasisChanged ? `CFA basis: ${currentCfaFormBasis || 'not recorded'} → ${report.cfaFormBasis || 'not recorded'}` : '',
    isHearingTransition && ALLOWED_HEARING_STAGES.indexOf(requestedHearingStage) > ALLOWED_HEARING_STAGES.indexOf(currentHearingStage) + 1
      ? `Prior-process note: ${stageAdvanceReason.trim()}`
      : '',
  ].filter(Boolean).join('. ');
  await logAudit(req.user.id, req.user.username, isStatusTransition ? 'BLOTTER_FINAL_DECISION' : 'BLOTTER_UPDATE', auditDetails, req);

  res.json({ message: `Report updated successfully.`, report });
});


// GET /public/:referenceNumber — Public: verify a report's resolution-ledger status
export const getPublicReport = asyncHandler(async (req, res) => {
  const { referenceNumber } = req.params;
  const report = await BlotterReport.findOne({ referenceNumber });
  
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const hasVerifiedLedgerRecord = report.blockchainRecordStatus === 'Recorded'
    && Boolean(report.blockchainTxHash)
    && Boolean(report.blockchainRecordHash);

  // Return only safe, public verification data
  res.json({
    referenceNumber: report.referenceNumber,
    status: report.status,
    // Old points-contract transaction hashes do not qualify as a case record.
    blockchainTxHash: hasVerifiedLedgerRecord ? report.blockchainTxHash : null,
    blockchainRecordHash: hasVerifiedLedgerRecord ? report.blockchainRecordHash : null,
    blockchainRecordedAt: hasVerifiedLedgerRecord ? report.blockchainRecordedAt : null,
    blockchainRecordStatus: hasVerifiedLedgerRecord ? 'Recorded' : (report.blockchainRecordStatus || 'Not Configured'),
    incidentType: report.incidentType,
    dateOfIncident: report.dateOfIncident,
    // explicitly NOT returning description, location, or user details for privacy
  });
});
