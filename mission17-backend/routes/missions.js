// routes/missions.js
// Prefix: /api/auth (mounted in index.js — keeps existing client URLs intact)

import express from 'express';
import Mission from '../models/Mission.js';
import { verifyAdmin, logAudit } from '../utils/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

const getMissionData = (body = {}) => {
  const allowedFields = ['title', 'sdgNumber', 'description', 'color', 'image', 'isActive'];
  return Object.fromEntries(allowedFields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));
};

const normalizeMissionData = (body = {}) => {
  const data = getMissionData(body);
  if (typeof data.title === 'string') data.title = data.title.trim().replace(/\s+/g, ' ');
  if (typeof data.description === 'string') data.description = data.description.trim();
  if (data.sdgNumber !== undefined) data.sdgNumber = Number(data.sdgNumber);
  return data;
};

const validateMission = ({ title, sdgNumber, description, color }) => {
  if (typeof title !== 'string' || title.length < 3 || title.length > 120) return 'Mission title must be between 3 and 120 characters.';
  if (!Number.isInteger(sdgNumber) || sdgNumber < 1 || sdgNumber > 17) return 'SDG number must be a whole number from 1 to 17.';
  if (description !== undefined && typeof description !== 'string') return 'Description must be text.';
  if (typeof description === 'string' && description.length > 1000) return 'Description cannot exceed 1,000 characters.';
  if (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) return 'Please select a valid theme color.';
  return null;
};

// POST /upload — Admin: Upload a mission/event image to Cloudinary
// Called by admin when user picks an image file in the Missions or Events form
router.post('/upload', verifyAdmin, uploadCloudinary.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }
  // Cloudinary storage automatically uploads and provides the URL on req.file
  res.json({ url: req.file.path });
}));

// GET /all-missions — Public - With Pagination & Search
router.get('/all-missions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const query = { isActive: { $ne: false } };
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
  const missionData = normalizeMissionData(req.body);
  const validationError = validateMission(missionData);
  if (validationError) return res.status(400).json({ message: validationError });
  const duplicate = await Mission.findOne({ title: missionData.title, sdgNumber: missionData.sdgNumber, isActive: { $ne: false } });
  if (duplicate) return res.status(409).json({ message: 'An active mission with the same title and SDG already exists.' });
  const mission = await Mission.create(missionData);
  logAudit(req.user.id, req.user.username, 'ADMIN_MISSION_CREATE', `Created mission: ${mission.title}`, req);
  res.status(201).json({ message: 'Mission created!', mission });
}));

// PUT /update-mission/:id — Admin
router.put('/update-mission/:id', verifyAdmin, asyncHandler(async (req, res) => {
  const current = await Mission.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Mission not found.' });
  const missionData = normalizeMissionData({ ...current.toObject(), ...req.body });
  const validationError = validateMission(missionData);
  if (validationError) return res.status(400).json({ message: validationError });
  const duplicate = await Mission.findOne({ title: missionData.title, sdgNumber: missionData.sdgNumber, isActive: { $ne: false }, _id: { $ne: current._id } });
  if (duplicate) return res.status(409).json({ message: 'An active mission with the same title and SDG already exists.' });
  const mission = await Mission.findByIdAndUpdate(req.params.id, missionData, { new: true, runValidators: true });
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
