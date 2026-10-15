import test from 'node:test';
import assert from 'node:assert/strict';
import { sameAuditLogSnapshot } from './auditLogSnapshot.mjs';

const sample = () => ({
  _id: 'audit-1',
  timestamp: '2026-10-15T09:00:00.000Z',
  username: 'staff',
  action: 'LOGIN_SUCCESS',
  details: 'Signed in',
  ipAddress: '127.0.0.1',
});

test('matches equivalent snapshots even when the API creates new objects', () => {
  assert.equal(sameAuditLogSnapshot([sample()], [sample()]), true);
});

test('detects a new, removed, reordered, or visibly changed audit row', () => {
  const previous = [sample(), { ...sample(), _id: 'audit-2' }];
  assert.equal(sameAuditLogSnapshot(previous, [previous[0], { ...sample(), _id: 'audit-3' }]), false);
  assert.equal(sameAuditLogSnapshot(previous, [previous[0]]), false);
  assert.equal(sameAuditLogSnapshot(previous, [...previous].reverse()), false);
  assert.equal(sameAuditLogSnapshot(previous, [{ ...previous[0], details: 'Updated' }, previous[1]]), false);
});

test('handles empty arrays and rejects malformed values', () => {
  assert.equal(sameAuditLogSnapshot([], []), true);
  assert.equal(sameAuditLogSnapshot([], null), false);
  assert.equal(sameAuditLogSnapshot(null, []), false);
});
