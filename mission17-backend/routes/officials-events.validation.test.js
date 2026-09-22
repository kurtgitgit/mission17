import { jest } from '@jest/globals';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin: (req, _res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011', username: 'tester', role: 'admin' };
    next();
  },
  logAudit: jest.fn(),
}));

const officialsRouter = (await import('./officials.js')).default;
const eventsRouter = (await import('./events.js')).default;
const announcementsRouter = (await import('./announcements.js')).default;
const { default: Official } = await import('../models/Official.js');
const { default: Event } = await import('../models/Event.js');
const { default: Announcement } = await import('../models/Announcement.js');

const app = express();
app.use(express.json());
app.use('/api/officials', officialsRouter);
app.use('/api/auth', eventsRouter);
app.use('/api/announcements', announcementsRouter);

describe('official and event validation', () => {
  let mongoServer;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    await Official.deleteMany({});
    await Event.deleteMany({});
    await Announcement.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('rejects malformed official contact details and duplicate council profiles', async () => {
    const invalid = await request(app).post('/api/officials').send({ name: 'Ana Cruz', position: 'Barangay Kagawad', contact: 'abc' });
    expect(invalid.status).toBe(400);

    const payload = { name: 'Ana Cruz', position: 'Barangay Kagawad', contact: '09171234567', term: '2023 - 2026' };
    expect((await request(app).post('/api/officials').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/officials').send(payload)).status).toBe(409);
    expect((await request(app).post('/api/officials').send({ name: 123, position: 'Kagawad' })).status).toBe(400);
    expect((await request(app).post('/api/officials').send({ ...payload, term: '2026 - 2026' })).status).toBe(400);
    expect((await request(app).post('/api/officials').send({ ...payload, name: '111' })).status).toBe(400);
  });

  it('rejects invalid and duplicate event submissions', async () => {
    const payload = { title: 'Clean-up Drive', date: tomorrow, time: '09:00', endTime: '11:00', location: 'Barangay Hall' };
    expect((await request(app).post('/api/auth/events').send({ ...payload, date: 'not-a-date' })).status).toBe(400);
    expect((await request(app).post('/api/auth/events').send({ ...payload, endTime: '08:59' })).status).toBe(400);
    expect((await request(app).post('/api/auth/events').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/auth/events').send(payload)).status).toBe(409);
    expect((await request(app).post('/api/auth/events').send({ ...payload, title: 123 })).status).toBe(400);
    expect((await request(app).post('/api/auth/events').send({ ...payload, title: '111' })).status).toBe(400);
  });

  it('validates announcements and blocks rapid duplicate broadcasts', async () => {
    expect((await request(app).post('/api/announcements').send({ title: 'Hi', body: 'Too short' })).status).toBe(400);
    const payload = { title: 'Flood preparedness advisory', body: 'Please monitor official updates and prepare emergency supplies.', category: 'safety', isUrgent: true };
    expect((await request(app).post('/api/announcements').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/announcements').send(payload)).status).toBe(409);
  });
});
