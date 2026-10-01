import { describe, expect, it, jest } from '@jest/globals';
import { detectLanguage, getChatbotAiUrl, getControlledFaq, getMockReply, guardModelReply, isInScope, outOfScopeReply, requestChatbotAi } from './chatbot.js';
import { getLiveChatReply } from './chatbotLiveData.js';

describe('chatbot multilingual routing and fallback', () => {
  it('returns a controlled Pangasinan reply for language-capability questions', () => {
    const message = 'Makakatalos ka ba ng Pangasinan na salita?';
    expect(detectLanguage(message)).toBe('pangasinan');
    expect(isInScope(message)).toBe(true);
    expect(getControlledFaq(message)).toContain('makatalos');
    expect(outOfScopeReply(message)).toContain('makatalos');
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

  it('returns the verified barangay contact details without model invention', () => {
    const reply = getControlledFaq('What is the Barangay Hall contact number and office hours?');
    expect(reply).toContain('0991-698-2914');
    expect(reply).toContain('Monday-Saturday');
    expect(reply).toContain('Bhea Monique San Miguel');
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

  it('returns active announcements and civic tasks without sending them to the AI service', async () => {
    const dependencies = {
      findOfficials: jest.fn(),
      findAnnouncements: jest.fn().mockResolvedValue([{ title: 'Clean-up Drive', category: 'environment', isUrgent: false }]),
      findMissions: jest.fn().mockResolvedValue([{ title: 'Care for a Plant', sdgNumber: 15 }]),
      findEvents: jest.fn(),
    };
    await expect(getLiveChatReply('May latest announcement ba?', dependencies)).resolves.toContain('Clean-up Drive');
    await expect(getLiveChatReply('Ano ang civic tasks?', dependencies)).resolves.toContain('Care for a Plant');
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
