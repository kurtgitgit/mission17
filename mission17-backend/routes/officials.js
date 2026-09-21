// routes/officials.js
// Prefix: /api/officials

import express from 'express';
import Official from '../models/Official.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

const normalizeText = (value = '') => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
const normalizeContact = (value = '') => typeof value === 'string' ? value.replace(/\D/g, '') : '';
const TERM_PATTERN = /^\d{4}\s*[-–]\s*\d{4}$/;

const validateOfficial = ({ name, position, contact, email, term }) => {
  if (typeof name !== 'string' || typeof position !== 'string' || !name.trim() || !position.trim()) return 'Name and position are required.';
  if (name.trim().length > 120 || position.trim().length > 120) return 'Name and position cannot exceed 120 characters.';
  if (contact !== undefined && contact !== null && typeof contact !== 'string') return 'Contact must be text.';
  if (email !== undefined && email !== null && typeof email !== 'string') return 'Email must be text.';
  if (term !== undefined && term !== null && typeof term !== 'string') return 'Term must be text.';
  if (contact && !/^09\d{9}$/.test(normalizeContact(contact))) return 'Contact must be an 11-digit Philippine mobile number.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
  if (term) {
    if (!TERM_PATTERN.test(term.trim())) return 'Term must use the format YYYY - YYYY.';
    const [start, end] = term.match(/\d{4}/g).map(Number);
    if (end < start) return 'Term end year cannot be earlier than the start year.';
  }
  return null;
};

const officialData = (body = {}) => {
  const { name, position, photo, contact, email, term, committee, order } = body;
  const clean = {
    name: name?.trim(), position: position?.trim(), photo, contact: contact ? normalizeContact(contact) : null,
    email: email?.trim() || null, term: term?.trim() || null, committee: committee?.trim() || null, order
  };
  clean.identityKey = `${normalizeText(clean.name)}|${normalizeText(clean.position)}|${normalizeText(clean.term || '')}`;
  return clean;
};

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
  const validationError = validateOfficial(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const data = officialData(req.body);
  const existing = await Official.findOne({ identityKey: data.identityKey });
  if (existing) return res.status(409).json({ message: 'An official with the same name, position, and term already exists.' });

  const official = await Official.create(data);
  logAudit(req.user.id, req.user.username, 'OFFICIAL_CREATE', `Added: ${data.name} — ${data.position}`, req);
  res.status(201).json({ message: 'Official added successfully.', official });
}));

// PUT /:id — Admin: update official details
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const current = await Official.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Official not found.' });
  const candidate = { ...current.toObject(), ...req.body };
  const validationError = validateOfficial(candidate);
  if (validationError) return res.status(400).json({ message: validationError });
  const data = officialData(candidate);
  const duplicate = await Official.findOne({ identityKey: data.identityKey, _id: { $ne: current._id } });
  if (duplicate) return res.status(409).json({ message: 'An official with the same name, position, and term already exists.' });
  const official = await Official.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_UPDATE', `Updated: ${official.name}`, req);
  res.json({ message: 'Official updated successfully.', official });
}));

// PATCH /:id/archive — Admin: soft delete / archive official
router.patch('/:id/archive', verifyAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (reason !== undefined && (typeof reason !== 'string' || reason.trim().length > 500)) {
    return res.status(400).json({ message: 'Archive reason must be text with no more than 500 characters.' });
  }
  const cleanReason = reason?.trim() || 'Term completed / Archived by Admin';
  const official = await Official.findByIdAndUpdate(
    req.params.id,
    { 
      isArchived: true, 
      archivedAt: new Date(),
      archiveReason: cleanReason
    },
    { new: true }
  );
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_ARCHIVE', `Archived: ${official.name} (${cleanReason})`, req);
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
