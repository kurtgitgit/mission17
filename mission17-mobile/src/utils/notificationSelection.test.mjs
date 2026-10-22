import test from 'node:test';
import assert from 'node:assert/strict';

let toggleAllNotificationIds;
try {
  ({ toggleAllNotificationIds } = await import('./notificationSelection.ts'));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('select all adds every notification id without duplicates', () => {
  const selected = typeof toggleAllNotificationIds === 'function'
    ? toggleAllNotificationIds(['notice-1'], ['notice-1', 'notice-2', 'notice-3'])
    : undefined;

  assert.deepEqual(selected, ['notice-1', 'notice-2', 'notice-3']);
});

test('select all toggles off when every notification is already selected', () => {
  const selected = typeof toggleAllNotificationIds === 'function'
    ? toggleAllNotificationIds(['notice-1', 'notice-2'], ['notice-1', 'notice-2'])
    : undefined;

  assert.deepEqual(selected, []);
});

test('select all preserves unrelated selected ids and removes duplicates', () => {
  const selected = typeof toggleAllNotificationIds === 'function'
    ? toggleAllNotificationIds(['notice-1', 'older-selection', 'notice-1'], ['notice-1', 'notice-2', 'notice-2'])
    : undefined;

  assert.deepEqual(selected, ['notice-1', 'older-selection', 'notice-2']);
});

test('deselect all removes only ids in the current notification list', () => {
  const selected = typeof toggleAllNotificationIds === 'function'
    ? toggleAllNotificationIds(['notice-1', 'notice-2', 'not-visible'], ['notice-1', 'notice-2'])
    : undefined;

  assert.deepEqual(selected, ['not-visible']);
});

test('an empty notification list leaves the current selection unchanged', () => {
  const currentSelection = ['notice-1'];
  const selected = typeof toggleAllNotificationIds === 'function'
    ? toggleAllNotificationIds(currentSelection, [])
    : undefined;

  assert.deepEqual(selected, ['notice-1']);
});
