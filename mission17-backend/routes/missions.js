// routes/missions.js
// Prefix: /api/auth (mounted in index.js — keeps existing client URLs intact)

import express from 'express';
import Mission from '../models/Mission.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET /all-missions — Public - With Pagination & Search
router.get('/all-missions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } }
    ];
    if (!isNaN(search) && search.trim() !== '') {
      query.$or.push({ sdgNumber: Number(search) });
    }
  }

  const missions = await Mission.find(query)
    .sort({ sdgNumber: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Mission.countDocuments(query);

  res.json({
    data: missions,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}));

// POST /add-mission — Admin
router.post('/add-mission', verifyAdmin, asyncHandler(async (req, res) => {
  if (!req.body.title) return res.status(400).json({ message: 'Mission title is required.' });
  const mission = await Mission.create(req.body);
  logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_CREATE', `Created mission: ${mission.title}`, req);
  res.status(201).json({ message: 'Mission created!', mission });
}));

// PUT /update-mission/:id — Admin
router.put('/update-mission/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!mission) return res.status(404).json({ message: 'Mission not found.' });
  logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_UPDATE', `Updated mission: ${mission.title}`, req);
  res.json(mission);
}));

// DELETE /delete-mission/:id — Admin
router.delete('/delete-mission/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const mission = await Mission.findByIdAndDelete(req.params.id);
  if (!mission) return res.status(404).json({ message: 'Mission not found.' });
  logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_DELETE', `Deleted mission: ${mission.title}`, req);
  res.json({ message: 'Mission deleted.' });
}));

export default router;
