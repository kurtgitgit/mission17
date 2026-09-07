import { describe, expect, it } from '@jest/globals';
import { detectLanguage, getControlledFaq, getMockReply, guardModelReply, isInScope, outOfScopeReply } from './chatbot.js';

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

  it('replaces unverified model timelines and download claims with a safe referral', () => {
    const reply = 'Processing takes 1–3 days and you can download a PDF with a QR code.';
    expect(guardModelReply('Paano ako hihingi ng barangay clearance?', reply)).toContain('opisyal na barangay office');
  });
});
