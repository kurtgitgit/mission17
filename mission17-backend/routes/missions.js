/**
 * Mission Routes
 * Location: routes/missions.js
 * Prefix:   /api/auth  (mounted in index.js — no URL changes for existing clients)
 *
 * Routes:
 *  GET    /all-missions       — Public: fetch all missions
 *  POST   /add-mission        — Admin: create a mission
 *  PUT    /update-mission/:id — Admin: update a mission
 *  DELETE /delete-mission/:id — Admin: delete a mission
 */

import express from 'express';
import Mission from '../models/Mission.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';

const router = express.Router();

// 1. GET ALL MISSIONS (Public)
router.get('/all-missions', async (req, res) => {
  try {
    const missions = await Mission.find().sort({ sdgNumber: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions' });
  }
});

// 2. CREATE MISSION
router.post('/add-mission', verifyAdmin, async (req, res) => {
  try {
    const newMission = new Mission(req.body);
    await newMission.save();
    logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_CREATE', `Created new mission: ${req.body.title}`, req);
    res.status(201).json({ message: 'Mission created!' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating mission' });
  }
});

// 3. UPDATE MISSION
router.put('/update-mission/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedMission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_UPDATE', `Updated mission ID: ${req.params.id}`, req);
    res.json(updatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// 4. DELETE MISSION
router.delete('/delete-mission/:id', verifyAdmin, async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_DELETE', `Deleted mission ID: ${req.params.id}`, req);
    res.json({ message: 'Mission deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
