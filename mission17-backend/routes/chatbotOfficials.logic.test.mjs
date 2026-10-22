import { test } from '@jest/globals';
import assert from 'node:assert/strict';
import { getOfficialsReply } from './chatbotOfficials.js';

const officials = [
  {
    name: 'Ana Reyes',
    position: 'Punong Barangay',
    committee: 'Peace and Order',
    term: '2026 - 2029',
    termNumber: '1st',
    contact: '09111111111',
    email: 'ana@example.com',
    isArchived: false,
  },
  {
    name: 'Former Captain',
    position: 'Punong Barangay',
    contact: '09999999999',
    isArchived: true,
  },
];

for (const [question, expectedIntro] of [
  ['Who is the barangay captain?', 'Here is the published information'],
  ['Sino po ang kapitan?', 'Narito ang naka-publish na impormasyon'],
]) {
  test(`answers the question in its detected language with only published active details: ${question}`, () => {
    const reply = getOfficialsReply(question, officials);

    for (const detail of [expectedIntro, 'Ana Reyes', 'Punong Barangay', 'Peace and Order', '2026 - 2029', '1st', '09111111111', 'ana@example.com']) {
      assert.ok(reply.includes(detail), `expected reply to include ${detail}`);
    }
    assert.ok(!reply.includes('Former Captain'));
    assert.ok(!reply.includes('09999999999'));
  });
}

test('politely says when a person is not in the current directory', () => {
  const reply = getOfficialsReply('Who is Aira Unknown?', officials);

  assert.match(reply, /sorry|could not find/i);
  assert.ok(!reply.includes('Ana Reyes'));
});

test('politely handles an unknown official in Tagalog without substituting another person', () => {
  const reply = getOfficialsReply('Sino po si Aira Unknown?', officials);

  assert.match(reply, /pasensya/i);
  assert.ok(!reply.includes('Ana Reyes'));
  assert.ok(!reply.includes('09111111111'));
});

test('does not invent a missing official phone number', () => {
  const reply = getOfficialsReply('What is the phone number of Juan Ramos?', [
    { name: 'Juan Ramos', position: 'Barangay Kagawad' },
  ]);

  assert.match(reply, /contact number is not available/i);
});
