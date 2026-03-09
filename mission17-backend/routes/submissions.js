/**
 * Submission Routes
 * Location: routes/submissions.js
 * Prefix:   /api/auth  (mounted in index.js — no URL changes for existing clients)
 *
 * Routes:
 *  POST /submit-mission           — Student submits a mission
 *  GET  /pending-submissions      — Admin: get pending + auto-run AI on unanalyzed ones
 *  GET  /submissions?status=      — Admin: get Approved | Rejected submissions (no imageUri)
 *  POST /approve-mission          — Admin: approve a submission + award blockchain points
 *  POST /reject-mission           — Admin: reject a submission
 *  POST /analyze-proof            — Admin: manually (re-)analyze a submission with AI
 *  GET  /user-submissions/:userId — Student: get own submission history (no imageUri)
 */

import express from 'express';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Mission from '../models/Mission.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import { spotCheckMiddleware } from '../utils/spotCheck.js';
import { awardSdgPoints } from '../utils/blockchain.js';

const router = express.Router();

// ==========================================
// 🤖 INTERNAL AI HELPER
// ==========================================

/**
 * Returns true only if imageUri is a real base64 data URL or a remote http(s) URL.
 * Rejects sentinel values like "base64placeholder" that the mobile app stored.
 */
function isValidImageUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('data:image') || uri.startsWith('http://') || uri.startsWith('https://');
}

/**
 * Converts an imageUri (base64 data URL or remote URL) into a FormData
 * object ready to POST to the Python AI server.
 * Fixes the original fetch(base64) bug in analyze-proof.
 */
async function buildAIFormData(imageUri) {
  if (!isValidImageUri(imageUri)) {
    throw new Error(`Invalid imageUri — not a data URL or http(s) URL: "${imageUri?.slice(0, 40)}"`);
  }
  let imageBuffer;

  if (imageUri.startsWith('data:image')) {
    // 🛡️ Base64 path — no network fetch needed
    const base64Data = imageUri.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // Remote URL path
    const imgRes = await fetch(imageUri);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.statusText}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  }

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'proof.jpg');
  return formData;
}

/**
 * Calls the Python AI server and returns the raw aiData object.
 * Throws on failure so callers can decide how to handle it.
 */
async function callAIServer(imageUri) {
  const formData = await buildAIFormData(imageUri);

  const aiResponse = await fetch(process.env.AI_SERVER_URL, {
    method: 'POST',
    body: formData,
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(`AI Server Error (${aiResponse.status}): ${errText}`);
  }

  return aiResponse.json();
}

/**
 * Saves or overwrites an AnalysisReport for a given submission.
 */
async function saveAnalysisReport(submissionId, userId, aiData) {
  return AnalysisReport.findOneAndUpdate(
    { submissionId },
    {
      submissionId,
      userId,
      prediction:  aiData.prediction,
      confidence:  aiData.confidence, // stored server-side; NEVER sent to client raw
      verdict:     aiData.verdict,
      message:     aiData.message,
      isVerified:  aiData.is_verified,
      sdg:         aiData.sdg,
      sourceCheck: aiData.source_check,
      analyzedAt:  new Date(),
    },
    { upsert: true, new: true }
  );
}

// ==========================================
// 🌍 STUDENT ROUTES
// ==========================================

// 1. SUBMIT MISSION
// 🛡️ SECURE CODE: HITL Middleware applied here.
// Randomly flags high-confidence AI results for manual review to catch adversarial attacks.
router.post('/submit-mission', spotCheckMiddleware, async (req, res) => {
  const { userId, missionId, missionTitle, image } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Reject placeholder images from test scripts
    const validatedImage = isValidImageUri(image) ? image : null;

    const newSubmission = new Submission({
      userId: user._id,
      username: user.username,
      missionId,
      missionTitle,
      imageUri: validatedImage,
      status: req.missionStatus || 'Pending',
    });

    await newSubmission.save();
    logAudit(userId, user.username, 'MISSION_SUBMISSION', `Submitted mission: ${missionTitle}`, req);

    res.json({
      message: 'Mission submitted for review!',
      status: newSubmission.status,
      submission: newSubmission,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. GET USER SUBMISSION HISTORY
// imageUri excluded — saves bandwidth on list views
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    // ⚡ .select('-imageUri') — omit heavy base64 from list response
    const submissions = await Submission.find({ userId })
      .select('-imageUri')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// ==========================================
// 🔐 ADMIN ROUTES
// ==========================================

// 3. GET PENDING SUBMISSIONS (+ auto-run AI for unanalyzed ones)
router.get('/pending-submissions', verifyAdmin, async (req, res) => {
  try {
    // Step 1: Fetch ALL fields for pending submissions (including imageUri needed for AI + View Proof)
    // We do NOT strip imageUri here — the admin Verify panel needs it for image display
    // and the auto-AI batch reuses it without a second DB round-trip.
    const submissions = await Submission.find({
      status: { $in: ['Pending', 'Pending Admin Review'] },
    }).sort({ createdAt: -1 });

    if (submissions.length === 0) return res.json([]);

    // Step 2: Find which ones already have an analysis report
    const submissionIds = submissions.map(s => s._id);
    const existingReports = await AnalysisReport.find({
      submissionId: { $in: submissionIds },
    });

    const reportMap = {};
    existingReports.forEach(r => {
      reportMap[r.submissionId.toString()] = r;
    });

    // Step 3: Identify submissions that are missing a report AND have a real image
    const missingAnalysis = submissions.filter(
      s => !reportMap[s._id.toString()] && isValidImageUri(s.imageUri)
    );

    // Step 4: For missing ones, run AI in parallel (imageUri already in memory)
    if (missingAnalysis.length > 0) {
      await Promise.all(
        missingAnalysis.map(async sub => {
          try {
            const aiData = await callAIServer(sub.imageUri);
            const report = await saveAnalysisReport(sub._id, sub.userId, aiData);
            reportMap[sub._id.toString()] = report;
            console.log(`✅ Auto-analyzed submission ${sub._id}: ${aiData.verdict}`);
          } catch (e) {
            // Don't crash the whole response if one AI call fails
            console.warn(`⚠️ Auto-AI skipped for submission ${sub._id}: ${e.message}`);
          }
        })
      );
    }

    // Step 5: Build response — strip imageUri from list items (bandwidth fix) but
    // keep a hasImage flag so the client knows whether "View Proof" should be enabled.
    // The actual image is served on-demand via GET /submission-image/:id.
    // 🛡️ SECURE CODE: Output Sanitization — confidence is stored but NOT forwarded to client.
    const result = submissions.map(s => {
      const { imageUri, ...rest } = s.toObject();
      return {
        ...rest,
        hasImage: isValidImageUri(imageUri),
        analysisReport: reportMap[s._id.toString()]
          ? {
              verdict:    reportMap[s._id.toString()].verdict,
              prediction: reportMap[s._id.toString()].prediction,
              isVerified: reportMap[s._id.toString()].isVerified,
              sdg:        reportMap[s._id.toString()].sdg,
              message:    reportMap[s._id.toString()].message,
              analyzedAt: reportMap[s._id.toString()].analyzedAt,
            }
          : null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 3b. GET SINGLE SUBMISSION IMAGE (Lazy-load on demand for Verify panel)
// imageUri is only fetched when the admin explicitly clicks "View Proof"
router.get('/submission-image/:id', verifyAdmin, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).select('imageUri');
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    if (!isValidImageUri(sub.imageUri)) return res.status(404).json({ message: 'No valid image for this submission' });
    res.json({ imageUri: sub.imageUri });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 4. GET APPROVED OR REJECTED SUBMISSIONS
// ?status=Approved | ?status=Rejected — required, anything else is rejected
// imageUri excluded — saves bandwidth on list views
router.get('/submissions', verifyAdmin, async (req, res) => {
  const { status } = req.query;
  const ALLOWED = ['Approved', 'Rejected'];

  if (!status || !ALLOWED.includes(status)) {
    return res.status(400).json({
      message: `Query param 'status' is required and must be one of: ${ALLOWED.join(', ')}`,
    });
  }

  try {
    const submissions = await Submission.find({ status })
      .select('-imageUri') // ⚡ Bandwidth fix
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 5. APPROVE MISSION
router.post('/approve-mission', verifyAdmin, async (req, res) => {
  const { submissionId } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    const user = await User.findById(sub.userId);
    if (!user) return res.status(404).json({ message: 'User associated with submission not found.' });

    const pointsToAward = 100;
    let txHash = null;

    // ⛓️ Step 1: Award points on the blockchain (if wallet is linked)
    if (!user.walletAddress) {
      console.warn(`🟡 User ${user.username} has no wallet address. Skipping POINTS transaction.`);
    }

    try {
      if (user.walletAddress) {
        // 🛡️ SECURE CODE: Blockchain Integration with dynamic gas fees.
        txHash = await awardSdgPoints(user.walletAddress, pointsToAward);
      }
    } catch (blockchainError) {
      return res.status(500).json({
        message: 'Blockchain transaction failed. Mission not approved.',
        error: blockchainError.message,
      });
    }

    // ✅ Step 2: Update DB only after blockchain success (or skip)
    sub.status = 'Approved';
    sub.blockchainTxHash = txHash || 'SKIPPED_NO_ADDRESS';
    user.points = (user.points || 0) + pointsToAward;

    await Promise.all([sub.save(), user.save()]);

    logAudit(
      req.user.id, req.user.username,
      'ADMIN_APPROVE',
      `Approved mission ${submissionId}. TX: ${txHash || 'Skipped'}`,
      req
    );

    res.json({ message: 'Approved!', txHash });
  } catch (error) {
    console.error('Approval Error:', error);
    res.status(500).json({ message: 'Approval Error', error: error.message });
  }
});

// 6. REJECT MISSION
router.post('/reject-mission', verifyAdmin, async (req, res) => {
  const { submissionId, reason } = req.body;
  try {
    const sub = await Submission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    sub.status = 'Rejected';
    sub.rejectionReason = reason || 'No reason provided';
    await sub.save();

    logAudit(
      req.user.id, req.user.username,
      'ADMIN_REJECT',
      `Rejected mission submission ${submissionId}. Reason: ${reason}`,
      req
    );

    res.json({ message: 'Mission rejected.' });
  } catch (error) {
    res.status(500).json({ message: 'Rejection Error' });
  }
});

// 7. ANALYZE PROOF (Manual admin re-analysis)
// =================================================================
// 🛡️ SECURE AI PROXY — Prevents Model Inversion/Extraction Attacks
// The frontend calls this; this endpoint calls the Python server.
// Only a sanitized result (no raw confidence) is returned to client.
// =================================================================
router.post('/analyze-proof', verifyAdmin, async (req, res) => {
  const { submissionId } = req.body;
  console.log(`🤖 Analyze Proof Requested for ID: ${submissionId}`);

  try {
    // 1. Fetch the submission to get the image URI
    const submission = await Submission.findById(submissionId);
    if (!submission || !isValidImageUri(submission.imageUri)) {
      return res.status(404).json({
        message: !submission
          ? 'Submission not found.'
          : 'This submission has no valid proof image (stored as placeholder).',
      });
    }

    // 2. Call AI server (handles base64 and URL correctly)
    let aiData;
    try {
      aiData = await callAIServer(submission.imageUri);
      console.log('✅ AI Response received');
    } catch (aiError) {
      console.error('❌ Error communicating with AI Server:', aiError.message);
      if (aiError.cause?.code === 'ECONNREFUSED') {
        throw new Error('AI Server is offline. Is app.py running?');
      }
      throw aiError;
    }

    // 3. Persist the result to AnalysisReport (upsert — overwrites previous report)
    await saveAnalysisReport(submission._id, submission.userId, aiData);

    // 4. SANITIZE THE RESPONSE (Core Security Mitigation)
    // 🛡️ SECURE CODE: Output Sanitization.
    // Prevents Model Extraction by hiding raw confidence scores from the client.
    const sanitizedResponse = {
      verdict:    aiData.verdict,
      prediction: aiData.prediction,
      isVerified: aiData.is_verified,
      sdg:        aiData.sdg,
      message:    aiData.message,
    };

    res.json(sanitizedResponse);
  } catch (error) {
    console.error('❌ Error in /analyze-proof:', error.message);
    res.status(500).json({ message: 'Error during AI analysis.', error: error.message });
  }
});

// DASHBOARD SUMMARY — single endpoint for the admin dashboard
// Runs all queries in parallel, returns only the fields the UI actually needs.
router.get('/dashboard-summary', verifyAdmin, async (req, res) => {
  try {
    const PENDING_STATUSES = ['Pending', 'Pending Admin Review'];

    const [
      volunteerCount,
      missionCount,
      pendingCount,
      completedCount,
      topAgents,
      recentPending,
    ] = await Promise.all([
      // Stats — countDocuments is O(1) with indexes, no docs loaded into memory
      User.countDocuments(),
      Mission.countDocuments(),
      Submission.countDocuments({ status: { $in: PENDING_STATUSES } }),
      Submission.countDocuments({ status: 'Approved' }),

      // Top 5 by points — only username + points fetched
      User.find()
        .select('username points')
        .sort({ points: -1 })
        .limit(5)
        .lean(),

      // Last 5 pending submissions — only display fields, no imageUri
      Submission.find({ status: { $in: PENDING_STATUSES } })
        .select('username missionTitle createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      stats: {
        volunteers:     volunteerCount,
        activeMissions: missionCount,
        pending:        pendingCount,
        completed:      completedCount,
      },
      topAgents,
      recentPending,
    });
  } catch (error) {
    console.error('❌ Error in /dashboard-summary:', error.message);
    res.status(500).json({ message: 'Failed to load dashboard summary.' });
  }
});

export default router;
