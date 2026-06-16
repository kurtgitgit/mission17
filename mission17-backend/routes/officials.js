// routes/officials.js
// Prefix: /api/officials

import express from 'express';
import Official from '../models/Official.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET / — Public: all officials sorted by order
router.get('/', asyncHandler(async (req, res) => {
  const officials = await Official.find().sort({ order: 1, position: 1 });
  res.json(officials);
}));

// POST / — Admin: create official
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const { name, position, photo, contact, email, term, committee, order } = req.body;
  if (!name || !position) return res.status(400).json({ message: 'Name and position are required.' });

  const official = await Official.create({ name, position, photo, contact, email, term, committee, order });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_CREATE', `Added: ${name} — ${position}`, req);
  res.status(201).json({ message: 'Official added.', official });
}));

// PUT /:id — Admin: update official
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_UPDATE', `Updated: ${official.name}`, req);
  res.json({ message: 'Official updated.', official });
}));

// DELETE /:id — Admin: delete official
router.delete('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findByIdAndDelete(req.params.id);
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_DELETE', `Removed: ${official.name}`, req);
  res.json({ message: 'Official removed.' });
}));

export default router;
