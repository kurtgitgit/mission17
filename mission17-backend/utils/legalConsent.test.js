import {
  LEGAL_POLICY_VERSION,
  createLegalConsentRecord,
  hasCurrentLegalConsent
} from './legalConsent.js';

describe('legal consent', () => {
  test('accepts the exact current multipart signup consent', () => {
    expect(hasCurrentLegalConsent({
      privacyAccepted: 'true',
      termsAccepted: 'true',
      policyVersion: LEGAL_POLICY_VERSION
    })).toBe(true);
  });

  test.each([
    {},
    { privacyAccepted: 'false', termsAccepted: 'true', policyVersion: LEGAL_POLICY_VERSION },
    { privacyAccepted: 'true', termsAccepted: 'false', policyVersion: LEGAL_POLICY_VERSION },
    { privacyAccepted: 'true', termsAccepted: 'true', policyVersion: 'outdated-version' },
    { privacyAccepted: true, termsAccepted: true, policyVersion: LEGAL_POLICY_VERSION }
  ])('rejects missing, invalid, outdated, or non-multipart consent: %p', (payload) => {
    expect(hasCurrentLegalConsent(payload)).toBe(false);
  });

  test('creates a versioned record using the server-provided date', () => {
    const acceptedAt = new Date('2026-09-08T00:00:00.000Z');
    expect(createLegalConsentRecord(acceptedAt)).toEqual({
      privacyVersion: LEGAL_POLICY_VERSION,
      termsVersion: LEGAL_POLICY_VERSION,
      acceptedAt
    });
  });
});
