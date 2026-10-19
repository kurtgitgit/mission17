import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const owner = new mongoose.Types.ObjectId();
const other = new mongoose.Types.ObjectId();
jest.unstable_mockModule('../utils/authMiddleware.js', () => ({
  verifyAuthenticatedUser: (req, _res, next) => { req.user = { _id: owner, id: String(owner), username: 'staff', role: req.headers['test-role'] || 'admin' }; next(); },
  verifyAdmin: (req, res, next) => { req.user = { _id: owner, id: String(owner), username: 'staff', role: req.headers['test-role'] || 'admin' }; return req.user.role === 'resident' ? res.sendStatus(403) : next(); },
  logAudit: jest.fn(),
}));
jest.unstable_mockModule('../utils/pushNotifier.js', () => ({ sendPushNotification: jest.fn(), sendPushNotifications: jest.fn(async () => ({ acceptedCount: 0 })) }));
jest.unstable_mockModule('../utils/blockchain.js', () => ({ isResolutionLedgerConfigured: () => false, recordResolvedBlotterLedgerEntry: jest.fn() }));
const Document = (await import('../models/DocumentRequest.js')).default;
const Blotter = (await import('../models/BlotterReport.js')).default;
const Feedback = (await import('../models/Suggestion.js')).default;
const Announcement = (await import('../models/Announcement.js')).default;
const Notification = (await import('../models/Notification.js')).default;
const { parsePickupDate } = await import('../utils/serviceValidation.js');
const app = express();
app.use(express.json());
for (const [path, file] of [['document-requests','document-requests'],['blotter-reports','blotter-reports'],['suggestions','suggestions'],['announcements','announcements'],['auth','notifications']]) {
  app.use(`/api/${path}`, (await import(`./${file}.js`)).default);
}
app.use('/api/analytics', (await import('./analytics.js')).default);
app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
const documentData = { userId: owner, username: 'resident', fullName: 'Ana Reyes', address: 'Purok 1 Bagong Pag-asa', contactNumber: '09123456789', documentType: 'Barangay Clearance', purpose: 'For school enrollment' };
const blotterData = { userId: owner, username: 'resident', fullName: 'Ana Reyes', contactNumber: '09123456789', incidentType: 'Other', description: 'Requesting staff assistance with an incident.', location: 'Purok 1', dateOfIncident: new Date('2026-01-01') };
let mongo;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo?.stop(); });
beforeEach(async () => { await Promise.all([Document, Blotter, Feedback, Announcement, Notification].map(Model => Model.deleteMany({}))); });

describe('reversible service archives', () => {
  it.each([
    ['document-requests', Document, documentData, 'Completed'],
    ['blotter-reports', Blotter, blotterData, 'Resolved'],
    ['suggestions', Feedback, { userId: owner, title: 'Street light concern', description: 'Please inspect the street light near our house.' }, 'Resolved'],
  ])('archives/restores %s without losing resident history or changing status', async (path, Model, data, status) => {
    const record = await Model.create({ ...data, status });
    expect((await request(app).patch(`/api/${path}/${record.id}/archive`).send({ archived: true })).status).toBe(200);
    expect((await request(app).get(`/api/${path}`)).body).toHaveLength(0);
    expect((await request(app).get(`/api/${path}?archive=archived`)).body).toHaveLength(1);
    expect((await request(app).get(`/api/${path}/my/${owner}`)).body).toHaveLength(1);
    const saved = await Model.findById(record.id);
    expect(saved.status).toBe(status);
    expect(String(saved.archivedBy)).toBe(String(owner));
    await request(app).patch(`/api/${path}/${record.id}/archive`).send({ archived: true });
    expect((await Model.findById(record.id)).archivedAt.toISOString()).toBe(saved.archivedAt.toISOString());
    expect((await request(app).patch(`/api/${path}/${record.id}/archive`).send({ archived: false })).status).toBe(200);
    expect((await request(app).get(`/api/${path}`)).body).toHaveLength(1);
  });
  it('refuses active records, non-boolean flags, invalid IDs and resident access', async () => {
    const record = await Document.create(documentData);
    const endpoint = `/api/document-requests/${record.id}/archive`;
    expect((await request(app).patch(endpoint).send({ archived: true })).status).toBe(409);
    expect((await request(app).patch(endpoint).send({ archived: 'true' })).status).toBe(400);
    expect((await request(app).patch('/api/document-requests/not-an-id/archive').send({ archived: true })).status).toBe(400);
    expect((await request(app).patch(endpoint).set('test-role', 'resident').send({ archived: true })).status).toBe(403);
  });
  it('shows legacy records without archive fields and sorts new requests first', async () => {
    const old = await Document.create({ ...documentData, createdAt: new Date('2026-01-01') });
    await Document.collection.updateOne({ _id: old._id }, { $unset: { isArchived: '' } });
    const recent = await Document.create({ ...documentData, createdAt: new Date('2026-02-01') });
    expect((await request(app).get('/api/document-requests')).body.map(r => r._id)).toEqual([recent.id,old.id]);
  });
});
describe('pickup dates and request boundaries', () => {
  it('uses Philippine midnight rather than the UTC server day', () => {
    expect(parsePickupDate('2026-10-19',new Date('2026-10-19T15:59:59Z'))).not.toBeNull();
    expect(parsePickupDate('2026-10-19',new Date('2026-10-19T16:00:00Z'))).toBeNull();
    expect(parsePickupDate('2026-10-20',new Date('2026-10-19T16:00:00Z'))).not.toBeNull();
  });
  it('rejects past and impossible pickup dates but accepts today in Philippine time', async () => {
    const record = await Document.create(documentData);
    const endpoint = `/api/document-requests/${record.id}/status`;
    for (const date of ['2000-01-01','2026-02-30',42]) expect((await request(app).patch(endpoint).send({ status: 'Ready for Pickup', pickupDate: date })).status).toBe(400);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Manila', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
    expect((await request(app).patch(endpoint).send({ status:'Ready for Pickup',pickupDate:today })).status).toBe(200);
    expect((await request(app).patch(endpoint).send({ status:'Completed' })).status).toBe(200);
  });
  it('rejects invalid feedback category and non-boolean anonymity', async () => {
    const data = {title:'Street light concern',description:'Please inspect the street light near our house.'};
    expect((await request(app).post('/api/suggestions').send({...data,category:'made up'})).status).toBe(400);
    expect((await request(app).post('/api/suggestions').send({...data,isAnonymous:'false'})).status).toBe(400);
  });
  it('rejects numeric-only blotter narratives, invalid types and untrusted evidence URLs', async () => {
    for(const fields of [{description:'123456789012'},{incidentType:'unknown'},{evidenceUrl:'https://untrusted.test/photo.jpg'},{dateOfIncident:'2026-02-30T12:00:00Z'}]) {
      expect((await request(app).post('/api/blotter-reports').send({...blotterData,...fields})).status).toBe(400);
    }
  });
  it('returns a readable client error for invalid image contents', async () => {
    const response=await request(app).post('/api/blotter-reports').send({...blotterData,dateOfIncident:'2026-01-01T12:00:00.000Z',evidenceUrl:'data:image/png;base64,bm90YW5pbWFnZQ=='});
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/image/i);
  });
});

describe('final-review regressions', () => {
  it('counts the entire active workload and fetches open blotters before applying a preview limit', async () => {
    const open=await Blotter.create({...blotterData,createdAt:new Date('2026-01-01')});
    await Blotter.collection.insertMany(Array.from({length:105},(_,i)=>({...blotterData,referenceNumber:`review-${i}`,status:'Resolved',createdAt:new Date('2026-10-01')})));
    await Announcement.collection.insertMany(Array.from({length:55},(_,i)=>({title:`Notice ${i}`,body:'A synthetic announcement for a count boundary.',isActive:true,isUrgent:i<2,createdAt:new Date()})));
    const counts=await request(app).get('/api/analytics/operations');
    expect(counts.status).toBe(200);
    expect(counts.body).toEqual({documents:0,blotters:1,feedback:0,posts:55,alerts:2});
    expect((await request(app).get('/api/blotter-reports?open=true&limit=5')).body.map(r=>r._id)).toEqual([open.id]);
  });
  it.each([
    ['document-requests',Document,documentData,'Completed',{status:'Processing'}],
    ['blotter-reports',Blotter,blotterData,'Resolved',{adminRemarks:'Concurrent staff edit'}],
  ])('prevents a concurrent %s edit after archive wins', async (path,Model,data,status,payload)=>{
    const record=await Model.create({...data,status});
    const original=Model.prototype.save;
    const save=jest.spyOn(Model.prototype,'save').mockImplementationOnce(async function(options){
      await Model.collection.updateOne({_id:this._id},{$set:{isArchived:true}});
      return original.call(this,options);
    });
    try {
      const response=await request(app).patch(`/api/${path}/${record.id}/status`).send(payload);
      expect(response.status).toBe(409);
      const saved=await Model.findById(record.id);
      expect(saved.status).toBe(status);
      if(path==='blotter-reports')expect(saved.adminRemarks).not.toBe(payload.adminRemarks);
    } finally { save.mockRestore(); }
  });
});
describe('selected notification deletion', () => {
  it('deletes selected owned messages and keeps unselected messages', async () => {
    const messages = await Notification.create([{userId:owner,title:'First',message:'First notification'}, {userId:owner,title:'Second',message:'Second notification'}]);
    const res = await request(app).post('/api/auth/notifications/delete-selected').send({notificationIds:[messages[0].id]});
    expect(res.status).toBe(200);
    expect(res.body.deletedIds).toEqual([messages[0].id]);
    expect(await Notification.findById(messages[1].id)).not.toBeNull();
  });
  it('refuses mixed-owner or invalid selections before deleting any records', async () => {
    const messages = await Notification.create([{userId:owner,title:'Owned',message:'Owned notification'}, {userId:other,title:'Other',message:'Other notification'}]);
    expect((await request(app).post('/api/auth/notifications/delete-selected').send({notificationIds:messages.map(m=>m.id)})).status).toBe(403);
    expect(await Notification.countDocuments()).toBe(2);
    for(const ids of [[], ['bad'], [messages[0].id,messages[0].id]]) expect((await request(app).post('/api/auth/notifications/delete-selected').send({notificationIds:ids})).status).toBe(400);
  });
});
describe('announcement visibility and lifecycle', () => {
  it('uses an exclusive expiry boundary and preserves undated legacy posts', async () => {
    const now=new Date('2026-10-19T16:00:00.000Z');
    const base={title:'Community notice',body:'An official notice for exact boundary testing.',postedBy:'staff'};
    const boundary=await Announcement.create({...base,expiresAt:now,isUrgent:true,isPinned:true});
    const future=await Announcement.create({...base,expiresAt:new Date(now.getTime()+1)});
    const legacy=await Announcement.create(base);
    await Announcement.collection.updateOne({_id:legacy._id},{$unset:{expiresAt:'',isArchived:''}});
    const {buildVisibleAnnouncementFilter}=await import('../utils/announcementVisibility.js');
    const visible=await Announcement.find(buildVisibleAnnouncementFilter(now));
    expect(visible.map(post=>post.id).sort()).toEqual([future.id,legacy.id].sort());
    expect(visible.some(post=>post.id===boundary.id)).toBe(false);
  });
  it('hides expired and archived posts from lists and direct public links', async () => {
    const base={title:'Community advisory',body:'Please review this official community advisory.',postedBy:'staff'};
    const visible=await Announcement.create(base);
    const expired=await Announcement.create({...base,isUrgent:true,isPinned:true,expiresAt:new Date(Date.now()-1000)});
    const archived=await Announcement.create({...base,isArchived:true});
    expect((await request(app).get('/api/announcements')).body.map(p=>p._id)).toEqual([visible.id]);
    for(const id of [expired.id,archived.id]) expect((await request(app).get(`/api/announcements/${id}`)).status).toBe(404);
    expect((await request(app).get('/api/announcements/manage?view=expired')).body).toHaveLength(1);
    expect((await request(app).get('/api/announcements/manage').set('test-role','resident')).status).toBe(403);
  });
  it('applies default expiry to new posts and requires a future date to restore expired posts', async () => {
    const res=await request(app).post('/api/announcements').send({title:'A current advisory',body:'This is a current announcement with a limited lifespan.'});
    expect(res.status).toBe(201);
    expect(new Date(res.body.announcement.expiresAt).getTime()).toBeGreaterThan(Date.now());
    const post=await Announcement.create({title:'Old advisory',body:'A historical post for archive testing.',postedBy:'staff',isArchived:true,expiresAt:new Date('2000-01-01')});
    expect((await request(app).patch(`/api/announcements/${post.id}/archive`).send({archived:false})).status).toBe(400);
    expect((await request(app).patch(`/api/announcements/${post.id}/archive`).send({archived:false,expiresAt:new Date(Date.now()+86400000).toISOString()})).status).toBe(200);
  });
});
