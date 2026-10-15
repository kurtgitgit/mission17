import MfaVerifiedSession from '../models/MfaVerifiedSession.js';

export const MFA_VERIFIED_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const isValidAuthTime = (authTime) => Number.isSafeInteger(authTime) && authTime > 0;

export const hasMfaVerifiedSession = async (firebaseUid, firebaseAuthTime, now = new Date()) => {
  if (typeof firebaseUid !== 'string' || !firebaseUid || !isValidAuthTime(firebaseAuthTime)) return false;

  return Boolean(await MfaVerifiedSession.exists({
    firebaseUid,
    firebaseAuthTime,
    expiresAt: { $gt: now },
  }));
};

export const recordMfaVerifiedSession = async (firebaseUid, firebaseAuthTime, now = new Date()) => {
  if (typeof firebaseUid !== 'string' || !firebaseUid || !isValidAuthTime(firebaseAuthTime)) {
    throw new Error('A verified Firebase authentication time is required for MFA.');
  }

  await MfaVerifiedSession.updateOne(
    { firebaseUid, firebaseAuthTime },
    { $set: { expiresAt: new Date(now.getTime() + MFA_VERIFIED_SESSION_TTL_MS) } },
    { upsert: true }
  );
};
