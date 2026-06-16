// routes/missions.js
// Prefix: /api/auth (mounted in index.js — keeps existing client URLs intact)

import express from 'express';
import Mission from '../models/Mission.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET /all-missions — Public
router.get('/all-missions', asyncHandler(async (req, res) => {
  const missions = await Mission.find().sort({ sdgNumber: 1 });
  res.json(missions);
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
