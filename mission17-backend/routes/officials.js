// routes/officials.js
// Prefix: /api/officials

import express from 'express';
import Official from '../models/Official.js';
import OfficialDirectoryRevision from '../models/OfficialDirectoryRevision.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { compareOfficials, publicOfficial, canReorderOfficials } from '../utils/officialOrdering.js';

const router = express.Router();

const activeFilter = { isArchived: { $ne: true } };
const directory = async (filter = activeFilter, session = null) => (await Official.find(filter).session(session).lean()).sort(compareOfficials);
const conflict = message => Object.assign(new Error(message), { status: 409 });

const mutateRoster = async operation => {
  if (!await canReorderOfficials(Official.db.db)) throw Object.assign(new Error('Directory changes are unavailable because atomic saves cannot be confirmed. Please try again later.'), { status: 503 });
  try {
    await OfficialDirectoryRevision.updateOne({ _id: 'active' }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  } catch (error) { if (error.code !== 11000) throw error; }
  const session = await Official.startSession();
  try {
    return await session.withTransaction(async () => {
      // Acquired before reading the roster; retries see concurrent adds/archives.
      await OfficialDirectoryRevision.updateOne({ _id: 'active' }, { $inc: { revision: 1 } }, { session });
      return operation(session);
    });
  } finally { await session.endSession(); }
};

// All callers hold the shared roster guard, including legacy-weight compaction.
const saveAtGroupEnd = async (data, current, session) => {
  const siblings = await directory({ ...activeFilter, position: data.position, ...(current ? { _id: { $ne: current._id } } : {}) }, session);
  if (siblings.length >= 99) throw conflict('This position group has reached its display-order limit.');
  const lastOrder = Math.max(0, ...siblings.map(row => row.order ?? 99));
  const save = async order => current
    ? Official.findByIdAndUpdate(current._id, { ...data, order }, { new: true, runValidators: true, session })
    : (await Official.create([{ ...data, order }], { session }))[0];
  if (lastOrder < 99) return save(lastOrder + 1);
  if (siblings.length) await Official.bulkWrite(siblings.map((row, index) => ({ updateOne: { filter: { _id: row._id }, update: { $set: { order: index + 1 } } } })), { session });
  return save(siblings.length + 1);
};

const normalizeText = (value = '') => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
const normalizeContact = (value = '') => typeof value === 'string' ? value.replace(/\D/g, '') : '';
const TERM_PATTERN = /^\d{4}\s*[-–]\s*\d{4}$/;
const TERM_NUMBERS = new Set(['1st', '2nd', 'Last']);

const hasMeaningfulText = (value) => {
  const compact = typeof value === 'string' ? value.replace(/\s/g, '') : '';
  return /[A-Za-z]/.test(value) && !/^(.)\1+$/.test(compact);
};

const validateOfficial = ({ name, position, contact, email, term, termNumber, committee, order }) => {
  if (typeof name !== 'string' || typeof position !== 'string' || !name.trim() || !position.trim()) return 'Name and position are required.';
  if (name.trim().length > 120 || position.trim().length > 120) return 'Name and position cannot exceed 120 characters.';
  if (!hasMeaningfulText(name) || !hasMeaningfulText(position)) return 'Name and position must contain meaningful text.';
  if (contact !== undefined && contact !== null && typeof contact !== 'string') return 'Contact must be text.';
  if (email !== undefined && email !== null && typeof email !== 'string') return 'Email must be text.';
  if (term !== undefined && term !== null && typeof term !== 'string') return 'Term must be text.';
  if (termNumber !== undefined && termNumber !== null && typeof termNumber !== 'string') return 'Term number must be text.';
  if (committee !== undefined && committee !== null && typeof committee !== 'string') return 'Committee must be text.';
  if (contact && !/^09\d{9}$/.test(normalizeContact(contact))) return 'Contact must be an 11-digit Philippine mobile number.';
  if (email && email.trim().length > 254) return 'Email cannot exceed 254 characters.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
  if (committee && committee.trim().length > 120) return 'Committee cannot exceed 120 characters.';
  if (termNumber && !TERM_NUMBERS.has(termNumber.trim())) return 'Term number must be 1st, 2nd, or Last.';
  if (order !== undefined && order !== null && (!Number.isInteger(Number(order)) || Number(order) < 1 || Number(order) > 99)) {
    return 'Sort order must be a whole number from 1 to 99.';
  }
  if (term) {
    if (!TERM_PATTERN.test(term.trim())) return 'Term must use the format YYYY - YYYY.';
    const [start, end] = term.match(/\d{4}/g).map(Number);
    if (end <= start) return 'Term end year must be later than the start year.';
  }
  return null;
};

const officialData = (body = {}) => {
  const { name, position, photo, contact, email, term, termNumber, committee, order } = body;
  const clean = {
    name: name?.trim(), position: position?.trim(), photo, contact: contact ? normalizeContact(contact) : null,
    email: email?.trim() || null, term: term?.trim() || null, termNumber: termNumber?.trim() || null,
    committee: committee?.trim() || null, order
  };
  clean.identityKey = `${normalizeText(clean.name)}|${normalizeText(clean.position)}|${normalizeText(clean.term || '')}`;
  return clean;
};

// Active officials are public directory information. Archived and unfiltered
// records can contain staff-only archive notes, so those views require admin.
export const requireAdminForNonPublicOfficialList = (req, res, next) => {
  if (req.query.status === 'archived' || req.query.status === 'all') {
    res.set('Cache-Control', 'private, no-store, max-age=0');
    return verifyAdmin(req, res, next);
  }
  return next();
};

// GET / — Public active directory; archived/all views are admin-only.
router.get('/', requireAdminForNonPublicOfficialList, asyncHandler(async (req, res) => {
  const { status } = req.query;
  let filter = { isArchived: { $ne: true } };

  if (status === 'archived') {
    filter = { isArchived: true };
  } else if (status === 'all') {
    filter = {};
  }

  const officials = await directory(filter);
  res.set('Cache-Control', 'no-store');
  res.json(status === 'archived' || status === 'all' ? officials : officials.map(publicOfficial));
}));

router.get('/reorder-capabilities', verifyAdmin, asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json({ available: await canReorderOfficials(Official.db.db) });
}));

router.patch('/reorder', verifyAdmin, asyncHandler(async (req, res) => {
  const { orderedIds, expectedIds } = req.body;
  const validIds = list => Array.isArray(list) && list.length > 0 && list.length <= 99
    && list.every(id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    && new Set(list).size === list.length;
  if (!validIds(orderedIds) || !validIds(expectedIds) || orderedIds.length !== expectedIds.length
    || orderedIds.some(id => !expectedIds.includes(id))) {
    return res.status(400).json({ message: 'Provide each active official exactly once in the current and new order.' });
  }
  let officials;
  try {
    await mutateRoster(async session => {
      const current = await directory(activeFilter, session);
      if (current.length !== expectedIds.length || current.some((row, index) => String(row._id) !== expectedIds[index])) {
        throw conflict('The officials list changed. Reload the directory before arranging it again.');
      }
      const byId = new Map(current.map(row => [String(row._id), row]));
      if (orderedIds.some((id, index) => byId.get(id).position !== current[index].position)) {
        throw Object.assign(new Error('Move officials only within the same position group.'), { status: 400 });
      }
      await Official.bulkWrite(orderedIds.map((id, index) => ({ updateOne: { filter: { _id: id, ...activeFilter }, update: { $set: { order: index + 1 } } } })), { session });
      officials = (await directory(activeFilter, session)).map(publicOfficial);
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    throw error;
  }
  logAudit(req.user.id, req.user.username, 'OFFICIAL_REORDER', `Arranged ${officials.length} active officials`, req);
  res.json({ message: 'Display order saved.', officials });
}));

// POST / — Admin: create official
router.post('/', verifyAdmin, asyncHandler(async (req, res) => {
  const validationError = validateOfficial(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const data = officialData(req.body);
  const official = await mutateRoster(async session => {
    const existing = await Official.findOne({ identityKey: data.identityKey }).session(session);
    if (existing) throw conflict('An official with the same name, position, and term already exists.');
    return saveAtGroupEnd(data, null, session);
  });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_CREATE', `Added: ${data.name} — ${data.position}`, req);
  res.status(201).json({ message: 'Official added successfully.', official });
}));

// PUT /:id — Admin: update official details
router.put('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await mutateRoster(async session => {
    const current = await Official.findById(req.params.id).session(session);
    if (!current) throw Object.assign(new Error('Official not found.'), { status: 404 });
    const candidate = { ...current.toObject(), ...req.body };
    const validationError = validateOfficial(candidate);
    if (validationError) throw Object.assign(new Error(validationError), { status: 400 });
    const { order: _order, ...data } = officialData(candidate);
    const duplicate = await Official.findOne({ identityKey: data.identityKey, _id: { $ne: current._id } }).session(session);
    if (duplicate) throw conflict('An official with the same name, position, and term already exists.');
    return !current.isArchived && current.position !== data.position
      ? saveAtGroupEnd(data, current, session)
      : Official.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true, session });
  });
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
  const official = await mutateRoster(session => Official.findByIdAndUpdate(
    req.params.id,
    { 
      isArchived: true, 
      archivedAt: new Date(),
      archiveReason: cleanReason
    },
    { new: true, session }
  ));
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_ARCHIVE', `Archived: ${official.name} (${cleanReason})`, req);
  res.json({ message: `Official "${official.name}" archived successfully.`, official });
}));

// PATCH /:id/restore — Admin: restore archived official
router.patch('/:id/restore', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await mutateRoster(async session => {
    const current = await Official.findById(req.params.id).session(session);
    if (!current) throw Object.assign(new Error('Official not found.'), { status: 404 });
    return current.isArchived ? saveAtGroupEnd({ ...current.toObject(), isArchived: false, archivedAt: null, archiveReason: null }, current, session) : current;
  });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_RESTORE', `Restored: ${official.name}`, req);
  res.json({ message: `Official "${official.name}" restored to active directory.`, official });
}));

// DELETE /:id — Admin: permanent delete official
router.delete('/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const official = await Official.findOneAndDelete({ _id: req.params.id, isArchived: true });
  if (!official) {
    const exists = await Official.exists({ _id: req.params.id });
    if (exists) return res.status(409).json({ message: 'Archive the official before permanently deleting the record.' });
  }
  if (!official) return res.status(404).json({ message: 'Official not found.' });
  logAudit(req.user.id, req.user.username, 'OFFICIAL_DELETE', `Permanently removed: ${official.name}`, req);
  res.json({ message: 'Official permanently deleted.' });
}));

export default router;
