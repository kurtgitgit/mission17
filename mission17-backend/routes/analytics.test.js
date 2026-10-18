import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

jest.unstable_mockModule('../config/firebase-admin.js', () => ({}));
jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: async (token) => {
    if (!['admin', 'super_admin', 'resident'].includes(token)) throw new Error('Invalid token');
    return { uid: `analytics-${token}`, auth_time: 1 };
  } }),
}));
jest.unstable_mockModule('../utils/mfaSession.js', () => ({ hasMfaVerifiedSession: async () => true }));

const router = (await import('./analytics.js')).default;
const DocumentRequest = (await import('../models/DocumentRequest.js')).default;
const BlotterReport = (await import('../models/BlotterReport.js')).default;
const Suggestion = (await import('../models/Suggestion.js')).default;
const User = (await import('../models/User.js')).default;
const app = express();
app.use('/api/analytics', router);
let database;
const report = (query = '', role = 'admin') => request(app).get(`/api/analytics${query}`).set('auth-token', role);

beforeAll(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), DocumentRequest.init(), BlotterReport.init(), Suggestion.init()]);
  const createdAt = new Date('2026-10-03T00:00:00Z');
  await User.collection.insertMany(Array.from({ length: 107 }, (_, index) => {
    const role = index === 0 ? 'admin' : index === 1 ? 'super_admin' : 'resident';
    return { username: `analytics-user-${index}`, email: `analytics-${index}@example.test`, firebaseUid: index < 3 ? `analytics-${role}` : `analytics-resident-${index}`, role, accountStatus: 'approved', createdAt };
  }));
  const times = ['2026-09-30T15:59:59.999Z', '2026-09-30T16:00:00Z', '2026-10-01T15:59:59.999Z', '2026-10-07T15:59:59.999Z', '2026-10-07T16:00:00Z'];
  await DocumentRequest.collection.insertMany(times.map((time, index) => ({ referenceNumber: `analytics-doc-${index}`, createdAt: new Date(time), status: index === 2 ? 'Processing' : index === 3 ? 'Completed' : 'Pending', documentType: 'Barangay Clearance', fullName: 'Private synthetic name' })));
  await BlotterReport.collection.insertOne({ referenceNumber: 'analytics-blotter', createdAt, status: 'In Progress', incidentType: 'Disturbance', description: 'Private synthetic narrative' });
  await Suggestion.collection.insertMany([
    { createdAt, status: 'New', category: 'Infrastructure', sentiment: 'Negative', description: 'Private feedback' },
    { createdAt, status: 'Resolved', category: 'General', sentiment: 'Positive' },
  ]);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (database) await database.stop();
});

test('protects analytics from unauthenticated clients and residents', async () => {
  expect((await request(app).get('/api/analytics')).status).toBe(401);
  expect((await report('', 'resident')).status).toBe(403);
});

test.each(['admin', 'super_admin'])('returns full aggregate counts for %s without personal records', async (role) => {
  const response = await report('?startDate=2026-10-01&endDate=2026-10-07&trend=true', role);
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.body.residents).toBe(105);
  expect(response.body.documents.total).toBe(3);
  expect(response.body.documents.daily).toEqual([{ date: '2026-10-01', count: 2 }, { date: '2026-10-07', count: 1 }]);
  expect(response.body.documents.status).toEqual(expect.arrayContaining([{ name: 'Pending', count: 1 }, { name: 'Processing', count: 1 }, { name: 'Completed', count: 1 }]));
  expect(response.body.blotters.status).toEqual([{ name: 'In Progress', count: 1 }]);
  expect(response.body.feedback.total).toBe(2);
  expect(response.body.feedback.sentiment).toEqual([{ name: 'Negative', count: 1 }, { name: 'Positive', count: 1 }]);
  expect(JSON.stringify(response.body)).not.toMatch(/Private|firebaseUid|email|description|fullName|referenceNumber/);
});

test('includes the entire end day and returns sensible empty results', async () => {
  const lastDay = await report('?startDate=2026-10-07&endDate=2026-10-07');
  expect(lastDay.body.documents.total).toBe(1);
  const empty = await report('?startDate=2025-01-01&endDate=2025-01-07&trend=true');
  expect(empty.status).toBe(200);
  expect(empty.body.documents).toEqual({ total: 0, status: [], documentType: [], daily: [] });
  expect(empty.body.residents).toBe(0);
});

test('supports unbounded and one-sided printable summary dates', async () => {
  expect((await report()).body.documents.total).toBe(5);
  expect((await report('?endDate=2026-10-07')).body.documents.total).toBe(4);
  expect((await report('?startDate=2026-10-08')).body.documents.total).toBe(1);
});

test.each([
  'startDate=2026-02-30', 'startDate=2026-10-08&endDate=2026-10-01',
  'startDate[$ne]=2026-10-01', 'startDate=not-a-date',
  'startDate=2025-01-01&endDate=2026-10-01&trend=true', 'trend=true',
])('rejects invalid date filters: %s', async (query) => {
  expect((await report(`?${query}`)).status).toBe(400);
});
