import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAdmin: (req, res, next) => {
    if (!req.headers['test-role']) return res.sendStatus(401);
    if (req.headers['test-role'] === 'resident') return res.sendStatus(403);
    req.user = { id: 'staff', username: 'staff' };
    next();
  },
  logAudit: jest.fn(),
}));
const Official = (await import('../models/Official.js')).default;
const router = (await import('./officials.js')).default;
const chatbot = (await import('./chatbot.js')).default;
const app = express();
app.use(express.json());
app.use('/api/officials', router);
app.use('/api/chatbot', chatbot);
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: 'Save failed.' }));
let mongo;
let records;
const patch = (body, role = 'admin') => request(app).patch('/api/officials/reorder').set('test-role', role).send(body);
const ids = () => records.map(row => row.id);
const payload = () => ({ expectedIds: ids(), orderedIds: [records[0].id, records[2].id, records[1].id, records[3].id] });

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Official.init();
}, 60000);
afterAll(async () => { await mongoose.disconnect(); await mongo?.stop(); });
beforeEach(async () => {
  await Official.deleteMany({});
  records = await Official.create([
    { name: 'Captain Sample', position: 'Punong Barangay', order: 1, contact: '09111111111' },
    { name: 'Council Alpha', position: 'Barangay Kagawad', order: 15 },
    { name: 'Council Beta', position: 'Barangay Kagawad', order: 15 },
    { name: 'Secretary Sample', position: 'Barangay Secretary', order: 2 },
  ]);
});

// Opt-in browser pass needs the isolated source fixture running on port 5197.
(process.env.RUN_OFFICIALS_BROWSER === '1' ? it : it.skip)('keeps real admin creation, website contacts and chatbot answers synchronized through archive/restore', async () => {
  const { chromium } = await import('file:///C:/Users/Kurt%20Perez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.route('**/api/officials**', async route => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method().toLowerCase();
      const call = request(app)[method](`${url.pathname}${url.search}`).set('test-role', 'admin');
      if (req.postData()) call.send(req.postDataJSON());
      const res = await call;
      await route.fulfill({ status: res.status, json: res.body });
    });
    await page.goto('http://127.0.0.1:5197/');
    await page.getByRole('button', { name: 'Add Official', exact: true }).click();
    await page.getByPlaceholder('Hon. Juan dela Cruz').fill('Added Web Official');
    await page.getByPlaceholder('09171234567').fill('09777777777');
    await page.locator('.pa-form-card').getByRole('button', { name: 'Add Official', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Added Web Official', exact: true }).waitFor();
    const saved = await Official.findOne({ name: 'Added Web Official' });
    expect(saved.contact).toBe('09777777777');
    await page.goto('http://127.0.0.1:5197/?screen=website#officials');
    await page.getByRole('heading', { name: 'Added Web Official', exact: true }).waitFor();
    expect(await page.locator('#officials a[href="tel:09777777777"]').count()).toBe(1);
    const reply = await request(app).post('/api/chatbot').send({ message: 'What is the phone number of Added Web Official?' });
    expect(reply.body.reply).toContain('09777777777');
    await request(app).patch(`/api/officials/${saved.id}/archive`).set('test-role', 'admin').send({ reason: 'Test transition' });
    await page.getByRole('button', { name: 'Refresh officials' }).click();
    await page.getByRole('heading', { name: 'Added Web Official', exact: true }).waitFor({ state: 'hidden' });
    expect(await page.getByRole('heading', { name: 'Added Web Official', exact: true }).count()).toBe(0);
    const absent = await request(app).post('/api/chatbot').send({ message: 'What is the phone number of Added Web Official?' });
    expect(absent.body.reply).not.toContain('09777777777');
    await request(app).patch(`/api/officials/${saved.id}/restore`).set('test-role', 'admin');
    await page.getByRole('button', { name: 'Refresh officials' }).click();
    await page.getByRole('heading', { name: 'Added Web Official', exact: true }).waitFor();
    const restored = await request(app).post('/api/chatbot').send({ message: 'Ano ang numero ni Added Web Official?' });
    expect(restored.body.reply).toContain('09777777777');
    await page.close();
  } finally { await browser.close(); }
}, 60000);

describe('official ordering and public directory', () => {
  it('groups roles and preserves tied legacy ordering deterministically', async () => {
    const res = await request(app).get('/api/officials');
    expect(res.status).toBe(200);
    expect(res.body.map(row => row.name)).toEqual(['Captain Sample', 'Council Alpha', 'Council Beta', 'Secretary Sample']);
  });
  it('saves a complete reorder atomically and returns the persisted sequence', async () => {
    const res = await patch(payload());
    expect(res.status).toBe(200);
    expect(res.body.officials.map(row => row.name)).toEqual(['Captain Sample', 'Council Beta', 'Council Alpha', 'Secretary Sample']);
    expect((await request(app).get('/api/officials')).body.map(row => row._id)).toEqual(payload().orderedIds);
  });
  it('requires staff authorization', async () => {
    expect((await request(app).patch('/api/officials/reorder').send(payload())).status).toBe(401);
    expect((await patch(payload(), 'resident')).status).toBe(403);
    expect((await Official.findById(records[1].id)).order).toBe(15);
  });
  it.each([
    ['duplicates', p => ({ ...p, orderedIds: [p.orderedIds[0], p.orderedIds[0], ...p.orderedIds.slice(2)] })],
    ['missing record', p => ({ ...p, orderedIds: p.orderedIds.slice(1) })],
    ['non-id', p => ({ ...p, orderedIds: ['bad', ...p.orderedIds.slice(1)] })],
    ['objects', p => ({ ...p, expectedIds: [{ $ne: null }] })],
    ['cross-role move', p => ({ ...p, orderedIds: [...p.orderedIds].reverse() })],
  ])('rejects %s without changing stored weights', async (_label, alter) => {
    const res = await patch(alter(payload()));
    expect(res.status).toBe(400);
    expect((await Official.find().sort({ _id: 1 })).map(row => row.order)).toEqual([1, 15, 15, 2]);
  });
  it('rejects a stale snapshot after another reorder', async () => {
    expect((await patch(payload())).status).toBe(200);
    expect((await patch(payload())).status).toBe(409);
  });
  it.each(['add', 'archive'])('rejects stale snapshot after concurrent %s', async action => {
    if (action === 'add') await Official.create({ name: 'New Council', position: 'Barangay Kagawad' });
    else await Official.updateOne({ _id: records[2]._id }, { isArchived: true });
    expect((await patch(payload())).status).toBe(409);
    expect((await Official.findById(records[1].id)).order).toBe(15);
  });
  it('rolls back the whole save after a database write failure', async () => {
    const bulk = Official.bulkWrite.bind(Official);
    const spy = jest.spyOn(Official, 'bulkWrite').mockImplementationOnce(async (ops, options) => {
      await bulk(ops.slice(0, 2), options);
      throw new Error('simulated database failure');
    });
    try { expect((await patch(payload())).status).toBe(500); }
    finally { spy.mockRestore(); }
    expect((await Official.find().sort({ _id: 1 })).map(row => row.order)).toEqual([1, 15, 15, 2]);
  });
  it('never reorders archived records or exposes their private notes', async () => {
    const archived = await Official.create({ name: 'Former Staff', position: 'Other', order: 7, isArchived: true, archiveReason: 'PRIVATE NOTE' });
    await Official.updateOne({ _id: records[1]._id }, { archiveReason: 'STAFF ONLY' });
    const res = await request(app).get('/api/officials?status=active');
    expect(res.body).toHaveLength(4);
    expect(JSON.stringify(res.body)).not.toMatch(/PRIVATE NOTE|STAFF ONLY|archiveReason|identityKey|createdAt/);
    expect(res.body[0].contact).toBe('09111111111');
    expect((await patch(payload())).status).toBe(200);
    expect((await Official.findById(archived.id)).order).toBe(7);
    const privateRes = await request(app).get('/api/officials?status=all').set('test-role', 'admin');
    expect(JSON.stringify(privateRes.body)).toContain('PRIVATE NOTE');
  });
  it('appends a newly added official within the position group', async () => {
    const res = await request(app).post('/api/officials').set('test-role', 'admin').send({ name: 'New Council', position: 'Barangay Kagawad' });
    expect(res.status).toBe(201);
    expect((await request(app).get('/api/officials')).body.map(row => row.name)).toEqual(['Captain Sample', 'Council Alpha', 'Council Beta', 'New Council', 'Secretary Sample']);
  });
  it('appends position-changed and restored officials even when legacy weights are 99', async () => {
    await Official.updateMany({ position: 'Barangay Kagawad' }, { order: 99 });
    expect((await request(app).put(`/api/officials/${records[0].id}`).set('test-role', 'admin').send({ position: 'Barangay Kagawad' })).status).toBe(200);
    expect((await request(app).get('/api/officials')).body.map(row => row.name)).toEqual(['Council Alpha', 'Council Beta', 'Captain Sample', 'Secretary Sample']);
    await Official.updateOne({ _id: records[1]._id }, { isArchived: true });
    expect((await request(app).patch(`/api/officials/${records[1].id}/restore`).set('test-role', 'admin')).status).toBe(200);
    expect((await request(app).get('/api/officials')).body.map(row => row.name)).toEqual(['Council Beta', 'Captain Sample', 'Council Alpha', 'Secretary Sample']);
  });
  it('reports transaction capability without changing records', async () => {
    const res = await request(app).get('/api/officials/reorder-capabilities').set('test-role', 'admin');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(await Official.countDocuments()).toBe(4);
  });
  it('fails closed on a standalone or unavailable transaction capability', async () => {
    const spy=jest.spyOn(Official.db.db,'admin').mockReturnValue({ command: async()=>({ isWritablePrimary:true }) });
    try {
      expect((await request(app).get('/api/officials/reorder-capabilities').set('test-role','admin')).body.available).toBe(false);
      expect((await patch(payload())).status).toBe(503);
    } finally { spy.mockRestore(); }
    expect((await Official.findById(records[1].id)).order).toBe(15);
  });
  it('does not overwrite a newer display weight when saving details read earlier', async () => {
    let readReady, resumeRead;
    const ready = new Promise(resolve => { readReady = resolve; });
    const release = new Promise(resolve => { resumeRead = resolve; });
    const findById = Official.findById.bind(Official);
    const spy = jest.spyOn(Official, 'findById').mockImplementationOnce((...args) => {
      const query = findById(...args);
      const exec = query.exec.bind(query);
      query.exec = async () => { const doc = await exec(); readReady(); await release; return doc; };
      return query;
    });
    const pending = request(app).put(`/api/officials/${records[1].id}`).set('test-role', 'admin').send({ contact: '09888888888' }).then(res => res);
    try {
      await ready;
      // Simulates a committed ordering write while the edit holds an earlier read.
      await Official.updateOne({ _id: records[1]._id }, { order: 2 });
      resumeRead();
      expect((await pending).status).toBe(200);
    } finally { resumeRead(); spy.mockRestore(); }
    const saved = await Official.findById(records[1].id);
    expect(saved.order).toBe(2);
    expect(saved.contact).toBe('09888888888');
  });
  it('serializes a truly overlapping creation with reorder so new members append after existing members', async () => {
    await Official.updateOne({ _id: records[3]._id }, { order: 1 });
    let paused, releaseReorder, appendSessionStarted;
    const atWrite = new Promise(resolve => { paused = resolve; });
    const released = new Promise(resolve => { releaseReorder = resolve; });
    const appendSession = new Promise(resolve => { appendSessionStarted = resolve; });
    let reorderPaused = false;
    const bulk = Official.bulkWrite.bind(Official);
    const startSession = Official.startSession.bind(Official);
    const bulkSpy = jest.spyOn(Official, 'bulkWrite').mockImplementationOnce(async (...args) => {
      reorderPaused = true; paused(); await released; return bulk(...args);
    });
    const sessionSpy = jest.spyOn(Official, 'startSession').mockImplementation(async (...args) => {
      const session = await startSession(...args);
      if (reorderPaused) appendSessionStarted();
      return session;
    });
    const reorder = patch(payload()).then(res => res);
    try {
      await atWrite;
      const addition = request(app).post('/api/officials').set('test-role', 'admin').send({ name: 'New Secretary', position: 'Barangay Secretary' }).then(res => res);
      // Old nontransactional creation finishes here; the fixed writer instead waits on the shared guard.
      await Promise.race([addition, appendSession]);
      releaseReorder();
      expect((await reorder).status).toBe(200);
      expect((await addition).status).toBe(201);
    } finally { releaseReorder(); bulkSpy.mockRestore(); sessionSpy.mockRestore(); }
    expect((await request(app).get('/api/officials')).body.map(row => row.name)).toEqual(['Captain Sample', 'Council Beta', 'Council Alpha', 'Secretary Sample', 'New Secretary']);
  }, 20000);
});
