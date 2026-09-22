import { jest } from '@jest/globals';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

const residentId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAuthenticatedUser: (req, _res, next) => {
    req.user = { _id: residentId, id: residentId.toString(), username: 'resident', role: 'resident' };
    next();
  },
  verifyAdmin: (req, _res, next) => {
    req.user = { _id: residentId, id: residentId.toString(), username: 'captain', role: 'super_admin' };
    next();
  },
  logAudit: jest.fn(),
}));

jest.unstable_mockModule('../utils/sentimentAnalyzer.js', () => ({
  analyzeSentiment: jest.fn(() => ({ sentiment: 'Neutral', score: 0 }))
}));

jest.unstable_mockModule('../utils/pushNotifier.js', () => ({
  sendPushNotification: jest.fn(async () => ({ accepted: false }))
}));

jest.unstable_mockModule('../utils/blockchain.js', () => ({
  awardSdgPoints: jest.fn(async () => 'test-transaction')
}));

const suggestionsRouter = (await import('./suggestions.js')).default;
const documentsRouter = (await import('./document-requests.js')).default;
const blotterRouter = (await import('./blotter-reports.js')).default;
const { default: Suggestion } = await import('../models/Suggestion.js');
const { default: DocumentRequest } = await import('../models/DocumentRequest.js');
const { default: BlotterReport } = await import('../models/BlotterReport.js');
const { default: Notification } = await import('../models/Notification.js');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/document-requests', documentsRouter);
app.use('/api/blotter-reports', blotterRouter);

describe('resident service validation and duplicate protection', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    await Promise.all([
      Suggestion.deleteMany({}),
      DocumentRequest.deleteMany({}),
      BlotterReport.deleteMany({}),
      Notification.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('validates feedback and rejects a rapid duplicate', async () => {
    expect((await request(app).post('/api/suggestions').send({ title: 'Bad', description: 'Too short' })).status).toBe(400);
    expect((await request(app).post('/api/suggestions').send({ title: '11111', description: '1111111111' })).status).toBe(400);
    const payload = { title: 'Broken street light', description: 'The street light near Purok 2 has been broken for several nights.', category: 'Infrastructure' };
    expect((await request(app).post('/api/suggestions').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/suggestions').send(payload)).status).toBe(409);
  });

  it('validates document requests and rejects a rapid duplicate', async () => {
    const payload = {
      fullName: 'Juan Dela Cruz', address: 'Purok 2, Bagong Pag-asa', contactNumber: '09171234567',
      documentType: 'Barangay Clearance', purpose: 'Employment requirement'
    };
    expect((await request(app).post('/api/document-requests').send({ ...payload, contactNumber: '11111111111' })).status).toBe(400);
    expect((await request(app).post('/api/document-requests').send({ ...payload, fullName: '111' })).status).toBe(400);
    expect((await request(app).post('/api/document-requests').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/document-requests').send(payload)).status).toBe(409);
  });

  it('validates blotter reports and rejects a rapid duplicate', async () => {
    const payload = {
      fullName: 'Juan Dela Cruz', contactNumber: '09171234567', incidentType: 'Disturbance',
      description: 'A loud disturbance continued near the covered court after midnight.',
      location: 'Covered Court', dateOfIncident: new Date().toISOString()
    };
    expect((await request(app).post('/api/blotter-reports').send({ ...payload, dateOfIncident: 'not-a-date' })).status).toBe(400);
    expect((await request(app).post('/api/blotter-reports').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/blotter-reports').send(payload)).status).toBe(409);
  });
});
