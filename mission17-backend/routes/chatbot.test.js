import { describe, expect, it } from '@jest/globals';
import { detectLanguage, getMockReply, isInScope, outOfScopeReply } from './chatbot.js';

describe('chatbot multilingual routing and fallback', () => {
  it('recognizes a Pangasinan language-capability question and keeps the reply in Pangasinan', () => {
    const message = 'Makakatalos ka ba ng Pangasinan na salita?';
    expect(detectLanguage(message)).toBe('pangasinan');
    expect(isInScope(message)).toBe(true);
    expect(outOfScopeReply(message)).toContain('makatalos');
  });

  it('recognizes Ilocano service questions and produces an Ilocano fallback', () => {
    const message = 'Mabalin ba nga agkiddaw iti barangay clearance?';
    expect(detectLanguage(message)).toBe('ilocano');
    expect(isInScope(message)).toBe(true);
    expect(getMockReply(message)).toContain('Makatulongak');
  });

  it('keeps Tagalog service fallbacks in Tagalog', () => {
    const message = 'Paano ako magrereklamo sa barangay?';
    expect(detectLanguage(message)).toBe('tagalog');
    expect(getMockReply(message)).toContain('pumunta');
  });
});
