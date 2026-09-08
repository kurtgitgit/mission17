export const LEGAL_POLICY_VERSION = '2026-09-08-capstone-v1';

export const hasCurrentLegalConsent = (payload = {}) => (
  payload.privacyAccepted === 'true' &&
  payload.termsAccepted === 'true' &&
  payload.policyVersion === LEGAL_POLICY_VERSION
);

export const createLegalConsentRecord = (acceptedAt = new Date()) => ({
  privacyVersion: LEGAL_POLICY_VERSION,
  termsVersion: LEGAL_POLICY_VERSION,
  acceptedAt
});
