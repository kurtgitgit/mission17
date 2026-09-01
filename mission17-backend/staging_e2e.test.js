import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// 1. Mock Firebase Admin BEFORE importing routes
const mockVerifyIdToken = jest.fn();
jest.unstable_mockModule('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

// 2. Mock AI Verification
jest.unstable_mockModule('./utils/aiVerification.js', () => ({
  isValidImageUri: jest.fn().mockReturnValue(true),
  callAIServer: jest.fn().mockResolvedValue({
    verdict: 'VALID',
    prediction: 'Tree planting',
    is_verified: true,
    sdg: 'SDG 15',
    message: 'Valid image.'
  }),
  saveAnalysisReport: jest.fn().mockResolvedValue({
    verdict: 'VALID',
    prediction: 'Tree planting',
    isVerified: true,
    sdg: 'SDG 15'
  })
}));

// 3. Mock Cloudinary Upload
jest.unstable_mockModule('./utils/cloudinary.js', () => ({
  cloudinary: {
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/fake-image.jpg' })
    }
  },
  uploadCloudinary: {
    single: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next()
  }
}));

// 4. Import the real app components
const { default: authRoutes } = await import('./routes/auth.js');
const { default: submissionsRoutes } = await import('./routes/submissions.js');
const { default: User } = await import('./models/User.js');
const { default: Submission } = await import('./models/Submission.js');
const { default: Mission } = await import('./models/Mission.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/auth', submissionsRoutes);

describe('E2E Staging Verification - Resident and Admin Flows', () => {
  let adminToken = 'fake-admin-token';
  let residentToken = 'fake-resident-token';
  let adminId, residentId, missionId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    await User.deleteMany({});
    await Submission.deleteMany({});
    await Mission.deleteMany({});

    // Create Admin User
    const adminUser = await User.create({
      firebaseUid: 'adminUid',
      username: 'admin1',
      email: 'admin@mission17.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'One',
      accountStatus: 'approved'
    });
    adminId = adminUser._id;

    // Create Resident User
    const residentUser = await User.create({
      firebaseUid: 'residentUid',
      username: 'resident1',
      email: 'resident@mission17.com',
      role: 'resident',
      firstName: 'Resident',
      lastName: 'One',
      accountStatus: 'approved'
    });
    residentId = residentUser._id;

    // Create a Mission
    const mission = await Mission.create({
      title: 'Plant a tree',
      description: 'Help the environment',
      points: 50,
      sdgNumber: 15
    });
    missionId = mission._id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  it('Resident should be able to submit a mission', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'residentUid', email: 'resident@mission17.com' });

    const res = await request(app)
      .post('/api/auth/submit-mission')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        missionId: missionId.toString(),
        image: 'data:image/jpeg;base64,fakebase64data',
        type: 'Mission'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Mission submitted for review!');
    expect(res.body.submission.status).toBe('Pending');
  });

  it('Resident token should be rejected when accessing admin endpoints', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'residentUid', email: 'resident@mission17.com' });

    const res = await request(app)
      .get('/api/auth/dashboard-summary')
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: administrators only.');
  });

  it('Admin should be able to view analytics and pending submissions', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'adminUid', email: 'admin@mission17.com' });

    const summaryRes = await request(app)
      .get('/api/auth/dashboard-summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.stats.pending).toBe(1);

    const pendingRes = await request(app)
      .get('/api/auth/pending-submissions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.submissions.length).toBe(1);
    expect(pendingRes.body.submissions[0].username).toBe('resident1');
  });

  it('Admin should be able to approve the resident submission', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'adminUid', email: 'admin@mission17.com' });

    const pendingRes = await request(app)
      .get('/api/auth/pending-submissions')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const submissionId = pendingRes.body.submissions[0]._id;

    const approveRes = await request(app)
      .post('/api/auth/approve-mission')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ submissionId });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.message).toBe('Approved!');

    const updatedSub = await Submission.findById(submissionId);
    expect(updatedSub.status).toBe('Approved');
  });
});
