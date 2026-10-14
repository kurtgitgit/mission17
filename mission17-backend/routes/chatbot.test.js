import { describe, expect, it, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import chatbotRouter, {
  detectLanguage,
  getChatbotAiUrl,
  getControlledFaq,
  getMockReply,
  getSafeFallbackReply,
  guardModelReply,
  isInScope,
  outOfScopeReply,
  requestChatbotAi,
} from './chatbot.js';
import { getLiveChatReply } from './chatbotLiveData.js';
import Official from '../models/Official.js';
import Announcement from '../models/Announcement.js';

describe('chatbot multilingual routing and fallback', () => {
  it('returns a controlled Pangasinan reply for language-capability questions', () => {
    const message = 'Makakatalos ka ba ng Pangasinan na salita?';
    expect(detectLanguage(message)).toBe('pangasinan');
    expect(isInScope(message)).toBe(true);
    expect(getControlledFaq(message)).toContain('makatalos');
    expect(outOfScopeReply(message)).toContain('makatalos');
  });

  it('answers a simple greeting locally without waiting for the AI service', () => {
    const reply = getControlledFaq('Hi');
    expect(reply).toContain('Hello!');
    expect(reply).toContain('document requests');
  });

  it('returns a controlled Ilocano clearance answer instead of calling the model', () => {
    const message = 'Mabalin ba nga agkiddaw iti barangay clearance?';
    expect(detectLanguage(message)).toBe('ilocano');
    expect(isInScope(message)).toBe(true);
    expect(getControlledFaq(message)).toContain("'Document Requests'");
    expect(getControlledFaq(message)).toContain('opisial a barangay office');
  });

  it('returns a controlled Tagalog blotter answer', () => {
    const message = 'Paano ako magrereklamo sa barangay?';
    expect(detectLanguage(message)).toBe('tagalog');
    expect(getControlledFaq(message)).toContain("'Blotter Reports'");
    expect(getMockReply(message)).toContain("'File New Report'");
  });

  it('prioritizes emergency guidance over a normal blotter workflow', () => {
    const reply = getControlledFaq('May sunog at kailangan ko mag-file ng blotter!');
    expect(reply).toContain('911');
    expect(reply).toContain('Hindi emergency-response service ang BrgyLink');
  });

  it('recognizes breathing emergencies before the AI or out-of-scope fallback', () => {
    const englishCases = [
      'Someone is having trouble breathing right now.',
      'A person has shortness of breath.',
    ];
    for (const message of englishCases) {
      const reply = getControlledFaq(message);
      expect(reply).toContain('call 911 now');
      expect(reply).toContain('not an emergency-response service');
    }

    const tagalogMessage = 'Hindi siya makahinga!';
    expect(detectLanguage(tagalogMessage)).toBe('tagalog');
    expect(getControlledFaq(tagalogMessage)).toContain('tumawag agad sa 911');
  });

  it('returns an honest verified-information fallback for unanswered in-scope questions', () => {
    const reply = getSafeFallbackReply('Ano ang eksaktong bayad para sa bagong serbisyo?');
    expect(reply).toContain('verified na sagot');
    expect(reply).toContain('opisyal na barangay office');
  });

  it('keeps unrelated questions in the out-of-scope fallback', () => {
    const reply = getSafeFallbackReply('What is the weather tomorrow?');
    expect(reply).toContain('Barangay Bagong Pag-asa services');
    expect(reply).toContain('How do I request a clearance?');
  });

  it('returns the verified barangay contact details without model invention', () => {
    const reply = getControlledFaq('What is the Barangay Hall contact number and office hours?');
    expect(reply).toContain('0991-698-2914');
    expect(reply).toContain('Monday-Saturday');
    expect(reply).toContain('Bhea Monique San Miguel');
  });

  it('routes official-directory questions to Barangay E-Services without disclosing individual contact details', () => {
    const reply = getControlledFaq("What is the Punong Barangay's phone number?");
    expect(reply).toContain('Barangay E-Services');
    expect(reply).toContain("'Barangay Council'");
    expect(reply).not.toContain('0991-698-2914');
  });

  it('replaces unverified model timelines and download claims with a safe referral', () => {
    const reply = 'Processing takes 1–3 days and you can download a PDF with a QR code.';
    expect(guardModelReply('Paano ako hihingi ng barangay clearance?', reply)).toContain('opisyal na barangay office');
  });

  it('derives the chatbot route from the protected image-verification service URL', () => {
    expect(getChatbotAiUrl('', 'https://kurtgitgit-mission17-ai.hf.space/predict')).toBe('https://kurtgitgit-mission17-ai.hf.space/chat');
    expect(getChatbotAiUrl('', 'https://kurtgitgit-mission17-ai.hf.space/predict\n\n')).toBe('https://kurtgitgit-mission17-ai.hf.space/chat');
    expect(getChatbotAiUrl('', 'https://kurtgitgit-mission17-ai.hf.space/')).toBe('https://kurtgitgit-mission17-ai.hf.space/chat');
    expect(getChatbotAiUrl('https://chat.example.test/chat', 'https://unused.example/predict')).toBe('https://chat.example.test/chat');
  });

  it('forwards only a message and the server service token to the AI gateway', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'Safe chatbot response.' }),
    });
    const payload = await requestChatbotAi('hello', {
      fetchImpl,
      url: 'https://ai.example.test/chat',
      serviceToken: 'test-service-token',
      timeoutMs: 1000,
    });
    expect(payload.response).toBe('Safe chatbot response.');
    expect(fetchImpl).toHaveBeenCalledWith('https://ai.example.test/chat', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer test-service-token' }),
      body: JSON.stringify({ message: 'hello' }),
    }));
  });

  it('returns a public, active official roster from live BrgyLink data', async () => {
    const findOfficials = jest.fn().mockResolvedValue([
      { name: 'Ana Resident', position: 'Punong Barangay' },
      { name: 'Ben Councilor', position: 'Kagawad' },
    ]);
    const reply = await getLiveChatReply('Sino ang kapitan ng barangay?', {
      findOfficials,
      findAnnouncements: jest.fn(),
      findMissions: jest.fn(),
      findEvents: jest.fn(),
    });
    expect(reply).toContain('Ana Resident');
    expect(reply).toContain('Punong Barangay');
    expect(findOfficials).toHaveBeenCalledTimes(1);
  });

  it('returns active announcements without sending them to the AI service', async () => {
    const dependencies = {
      findOfficials: jest.fn(),
      findAnnouncements: jest.fn().mockResolvedValue([{ title: 'Clean-up Drive', category: 'environment', isUrgent: false }]),
      findMissions: jest.fn().mockResolvedValue([{ title: 'Care for a Plant', sdgNumber: 15 }]),
      findEvents: jest.fn(),
    };
    await expect(getLiveChatReply('May latest announcement ba?', dependencies)).resolves.toContain('Clean-up Drive');
    await expect(getLiveChatReply('Ano ang retired feature?', dependencies)).resolves.toBeNull();
  });

  it('does not let live-data answers override an emergency request', async () => {
    const findOfficials = jest.fn();
    await expect(getLiveChatReply('Kapitan, may sunog at kailangan ng ambulance!', {
      findOfficials,
      findAnnouncements: jest.fn(),
      findMissions: jest.fn(),
      findEvents: jest.fn(),
    })).resolves.toBeNull();
    expect(findOfficials).not.toHaveBeenCalled();
  });
});
describe('POST /api/chatbot end-to-end integration tests', () => {
  let mongoServer;
  let app;
  let originalAiServiceToken;

  beforeAll(async () => {
    originalAiServiceToken = process.env.AI_SERVICE_TOKEN;
    delete process.env.AI_SERVICE_TOKEN;
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/chatbot', chatbotRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    if (originalAiServiceToken === undefined) delete process.env.AI_SERVICE_TOKEN;
    else process.env.AI_SERVICE_TOKEN = originalAiServiceToken;
  });

  beforeEach(async () => {
    await Official.deleteMany({});
    await Announcement.deleteMany({});
  });

  it('Case 1: returns an immediate BrgyLink greeting for "Hi" with controlled-faq source', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'Hi' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('controlled-faq');
    expect(res.body.reply).toContain('Hello!');
    expect(res.body.reply).toContain('document requests');
  });

  it('Case 2: politely suggests supported questions for "Test" or unrelated question', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'Test' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('safe-local-fallback');
    expect(res.body.reply).not.toMatch(/i don'?t know/i);
    expect(res.body.reply).toContain('Barangay Bagong Pag-asa services');
    expect(res.body.reply).toContain('How do I request a clearance?');
  });

  it('Case 3: returns controlled in-app workflow for Barangay Clearance without inventing fees, timelines, PDFs, or QR codes', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'How do I request a Barangay Clearance?' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('controlled-faq');
    expect(res.body.reply).toContain("'Document Requests'");
    expect(res.body.reply).toContain("'Barangay Clearance'");
    expect(res.body.reply).not.toMatch(/[₱]|php\s*\d|\b\d+\s*(?:days?|araw|oras|hours?)\b|\bpdf\b|\bqr\s*code\b/i);
  });

  it('Case 4: returns controlled in-app workflow for blotter request', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'How do I file a blotter report?' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('controlled-faq');
    expect(res.body.reply).toContain("'Blotter Reports'");
    expect(res.body.reply).toContain("'File New Report'");
    expect(res.body.reply).toContain('911');
  });

  describe('Case 5: Latest announcements and barangay officials', () => {
    it('routes an official roster request to the resident directory, even when records are available', async () => {
      await Official.create([
        { name: 'Hon. Reynaldo Cruz', position: 'Punong Barangay', order: 1, isArchived: false },
        { name: 'Hon. Elena Ramos', position: 'Barangay Kagawad', order: 2, isArchived: false },
      ]);

      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Who are the current barangay officials?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('controlled-faq');
      expect(res.body.reply).toContain('Barangay E-Services');
      expect(res.body.reply).toContain("'Barangay Council'");
      expect(res.body.reply).not.toContain('Hon. Reynaldo Cruz');
    });

    it('routes an official roster request to the resident directory when no roster is available', async () => {
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Who are the current barangay officials?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('controlled-faq');
      expect(res.body.reply).toContain('Barangay E-Services');
    });

    it('returns published active announcements when available in live data', async () => {
      await Announcement.create({
        title: 'Community General Assembly',
        body: 'Annual meeting for all residents at the barangay hall.',
        category: 'general',
        postedBy: 'admin',
        isUrgent: true,
        isActive: true,
      });

      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Where can I find barangay announcements?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('live-brgylink-data');
      expect(res.body.reply).toContain('Community General Assembly');
      expect(res.body.reply).toContain('URGENT');
    });

    it('returns honest message when no active announcements are published yet', async () => {
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Where can I find barangay announcements?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('live-brgylink-data');
      expect(res.body.reply).toContain('There are no active announcements published in BrgyLink yet');
    });
  });

  it('Case 6: states no verified information available and directs to Announcements or barangay office for unknown in-scope question', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'Ano ang eksaktong bayad para sa bagong serbisyo?' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('safe-local-fallback');
    expect(res.body.reply).toContain('verified na sagot');
    expect(res.body.reply).toContain('opisyal na barangay office');
  });

  it('Case 7: prioritizes emergency guidance and 911 over blotter flow for emergency wording', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'May sunog at kailangan ko mag-file ng blotter' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('controlled-faq');
    expect(res.body.reply).toContain('911');
    expect(res.body.reply).toContain('Hindi emergency-response service ang BrgyLink');
    expect(res.body.reply).not.toContain("'File New Report'");
  });

  describe('Case 8: Failure recovery and safe fallback', () => {
    it('returns safe fallback when AI service is unavailable', async () => {
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Ano ang permit para sa bagong proyekto ng barangay?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('safe-local-fallback');
      expect(res.body.reply).toContain('verified na sagot');
    });

    it('returns safe fallback when live data lookup throws an error', async () => {
      const findSpy = jest.spyOn(Official, 'find').mockImplementationOnce(() => {
        throw new Error('Database connection failed during live query');
      });

      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Sino ang mga opisyal ng barangay?' });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('safe-local-fallback');
      expect(res.body.reply).toBeDefined();

      findSpy.mockRestore();
    });

    it('rejects empty or whitespace-only messages with 400', async () => {
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.reply).toBe('Please provide a message.');
    });

    it('rejects messages exceeding MAX_MESSAGE_LENGTH with 400', async () => {
      const longMessage = 'A'.repeat(1201);
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: longMessage });
      expect(res.status).toBe(400);
      expect(res.body.reply).toContain('Please keep messages under 1200 characters.');
    });
  });
});
