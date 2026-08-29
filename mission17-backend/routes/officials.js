// routes/officials.js
// Prefix: /api/officials

import express from 'express';
import Official from '../models/Official.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET / — Public / Admin: officials queryable by status (default: active only)
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let filter = { isArchived: { $ne: true } };

  if (status === 'archived') {
    filter = { isArchived: true };
  } else if (status === 'all') {
    filter = {};
  }

  const officials = await Official.find(filter).sort({ order: 1, position: 1, createdAt: -1 });
  res.json(officials);
}));

// POST / — Admin: create official
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const { name, position, photo, contact, email, term, committee, order } = req.body;
  if (!name || !position) return res.status(400).json({ message: 'Name and position are required.' });

  const official = await Official.create({ name, position, photo, contact, email, term, committee, order });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_CREATE', `Added: ${name} — ${position}`, req);
  res.status(201).json({ message: 'Official added successfully.', official });
}));

// PUT /:id — Admin: update official details
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_UPDATE', `Updated: ${official.name}`, req);
  res.json({ message: 'Official updated successfully.', official });
}));

// PATCH /:id/archive — Admin: soft delete / archive official
router.patch('/:id/archive', verifyAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const official = await Official.findByIdAndUpdate(
    req.params.id,
    { 
      isArchived: true, 
      archivedAt: new Date(),
      archiveReason: reason || 'Term completed / Archived by Admin'
    },
    { new: true }
  );
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_ARCHIVE', `Archived: ${official.name} (${reason || 'No reason'})`, req);
  res.json({ message: `Official "${official.name}" archived successfully.`, official });
}));

// PATCH /:id/restore — Admin: restore archived official
router.patch('/:id/restore', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findByIdAndUpdate(
    req.params.id,
    { 
      isArchived: false, 
      archivedAt: null,
      archiveReason: null
    },
    { new: true }
  );
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_RESTORE', `Restored: ${official.name}`, req);
  res.json({ message: `Official "${official.name}" restored to active directory.`, official });
}));

// DELETE /:id — Admin: permanent delete official
router.delete('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findByIdAndDelete(req.params.id);
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_DELETE', `Permanently removed: ${official.name}`, req);
  res.json({ message: 'Official permanently deleted.' });
}));

export default router;

