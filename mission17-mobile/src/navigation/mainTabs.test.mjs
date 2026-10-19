import test from 'node:test';
import assert from 'node:assert/strict';
import { getMainTabOrder } from './mainTabs.ts';

test('resident navigation keeps Assistant centered between News and About', () => {
  assert.deepEqual(getMainTabOrder('resident'), [
    'HomeTab',
    'AnnouncementsTab',
    'AssistantTab',
    'LearnTab',
    'ProfileTab',
  ]);
});

test('captain navigation keeps Assistant centered between News and Control', () => {
  assert.deepEqual(getMainTabOrder('super_admin'), [
    'HomeTab',
    'AnnouncementsTab',
    'AssistantTab',
    'CaptainControlTab',
    'ProfileTab',
  ]);
});
