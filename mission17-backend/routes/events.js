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

const router = express.Router();

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
router.post('/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event' });
  }
});

// 3. UPDATE EVENT
router.put('/events/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event' });
  }
});

// 4. DELETE EVENT
router.delete('/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

export default router;
