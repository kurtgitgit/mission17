/**
 * Event Routes
 * Location: routes/events.js
 * Prefix:   /api/auth  (mounted in index.js — no URL changes for existing clients)
 *
 * Routes:
 *  GET    /events     — Public: list all events sorted by date
 *  POST   /events     — Admin: create an event
 *  PUT    /events/:id — Admin: update an event
 *  DELETE /events/:id — Admin: delete an event
 */

import express from 'express';
import Event from '../models/Event.js';
import { verifyAdmin } from '../utils/authMiddleware.js';

const router = express.Router();

const normalizeEventText = (value = '') => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const hasMeaningfulText = (value) => {
  const compact = typeof value === 'string' ? value.replace(/\s/g, '') : '';
  return /[A-Za-z]/.test(value) && !/^(.)\1+$/.test(compact);
};

const validateEvent = ({ title, date, time, endTime, location }, { requireEndTime = false } = {}) => {
  if (typeof title !== 'string' || typeof location !== 'string' || typeof date !== 'string' || typeof time !== 'string' || (endTime !== undefined && typeof endTime !== 'string')) {
    return 'Title, date, start time, end time, and location must be text values.';
  }
  if (!title.trim() || !location.trim() || !date || !time || (requireEndTime && !endTime)) return 'Title, date, start time, end time, and location are required.';
  if (title.length > 120 || location.length > 250) return 'Title cannot exceed 120 characters and location cannot exceed 250 characters.';
  if (!hasMeaningfulText(title) || !hasMeaningfulText(location)) return 'Event title and location must contain meaningful text.';
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return 'Please provide a valid event date.';
  if (!TIME_PATTERN.test(time)) return 'Please provide a valid event time.';
  if (endTime && !TIME_PATTERN.test(endTime)) return 'Please provide a valid event end time.';
  if (endTime && endTime <= time) return 'Event end time must be later than the start time.';
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return 'Event date cannot be in the past.';
  return null;
};

const getEventData = (body = {}) => {
  const allowedFields = ['title', 'date', 'time', 'endTime', 'location', 'color', 'description', 'image'];
  return Object.fromEntries(allowedFields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));
};

// 1. GET ALL EVENTS (Public) - With Pagination & Search
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.json({
      data: events,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// 2. CREATE EVENT
router.post('/events', verifyAdmin, async (req, res) => {
  try {
    const eventData = getEventData(req.body);
    eventData.title = normalizeEventText(eventData.title);
    eventData.location = normalizeEventText(eventData.location);
    const validationError = validateEvent(eventData, { requireEndTime: true });
    if (validationError) return res.status(400).json({ message: validationError });
    const existing = await Event.findOne({ title: eventData.title, date: eventData.date, time: eventData.time, location: eventData.location });
    if (existing) return res.status(409).json({ message: 'An identical event already exists.' });
    const newEvent = new Event(eventData);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An identical event already exists.' });
    res.status(500).json({ message: 'Error creating event' });
  }
});

// 3. UPDATE EVENT
router.put('/events/:id', verifyAdmin, async (req, res) => {
  try {
    const current = await Event.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Event not found.' });
    const eventData = { ...current.toObject(), ...getEventData(req.body) };
    eventData.title = normalizeEventText(eventData.title);
    eventData.location = normalizeEventText(eventData.location);
    const validationError = validateEvent(eventData);
    if (validationError) return res.status(400).json({ message: validationError });
    const duplicate = await Event.findOne({ title: eventData.title, date: eventData.date, time: eventData.time, location: eventData.location, _id: { $ne: current._id } });
    if (duplicate) return res.status(409).json({ message: 'An identical event already exists.' });
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, getEventData(eventData), { new: true, runValidators: true });
    res.json(updatedEvent);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An identical event already exists.' });
    res.status(500).json({ message: 'Error updating event' });
  }
});

// 4. DELETE EVENT
router.delete('/events/:id', verifyAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

export default router;
