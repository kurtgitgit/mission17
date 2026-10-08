import { describe, expect, it } from '@jest/globals';
import { ethers } from 'ethers';
import {
  buildResolvedBlotterLedgerPayload,
  isResolutionLedgerConfigured,
} from './blockchain.js';

describe('resolution ledger payloads', () => {
  const safeReport = {
    referenceNumber: 'BLOTTER-2026-12345',
    incidentType: 'Disturbance',
    dateOfIncident: '2026-10-07T00:00:00.000Z',
  };

  it('builds a deterministic case key and integrity digest from safe metadata', () => {
    const first = buildResolvedBlotterLedgerPayload(safeReport);
    const second = buildResolvedBlotterLedgerPayload({ ...safeReport });

    expect(first).toEqual(second);
    expect(first.caseKey).toBe(ethers.keccak256(ethers.toUtf8Bytes('brgylink:blotter:BLOTTER-2026-12345')));
    expect(first.integrityHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('does not hash resident or incident-detail fields', () => {
    const original = buildResolvedBlotterLedgerPayload(safeReport);
    const withPrivateFields = buildResolvedBlotterLedgerPayload({
      ...safeReport,
      fullName: 'Resident Name',
      username: 'resident-user',
      contactNumber: '09171234567',
      description: 'Private incident narrative',
      location: 'Private residence',
      evidenceUrl: 'https://example.invalid/private-evidence.jpg',
    });

    expect(withPrivateFields).toEqual(original);
  });

  it('requires a reference number', () => {
    expect(() => buildResolvedBlotterLedgerPayload({ incidentType: 'Theft' }))
      .toThrow('reference number');
  });

  it('requires every deployment setting before enabling the ledger', () => {
    const original = {
      SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
      ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
      BRGYLINK_RESOLUTION_LEDGER_ADDRESS: process.env.BRGYLINK_RESOLUTION_LEDGER_ADDRESS,
    };

    try {
      delete process.env.SEPOLIA_RPC_URL;
      delete process.env.ADMIN_PRIVATE_KEY;
      delete process.env.BRGYLINK_RESOLUTION_LEDGER_ADDRESS;
      expect(isResolutionLedgerConfigured()).toBe(false);

      process.env.SEPOLIA_RPC_URL = 'https://example.invalid';
      process.env.ADMIN_PRIVATE_KEY = '0xabc';
      process.env.BRGYLINK_RESOLUTION_LEDGER_ADDRESS = '0x0000000000000000000000000000000000000001';
      expect(isResolutionLedgerConfigured()).toBe(true);
    } finally {
      for (const [name, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
