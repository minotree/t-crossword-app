import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigateBack } from '../src/adapters/backNavigation.ts';

function setup(reading = false) {
  const calls = [];
  return { calls, actions: {
    closeAnswer: () => calls.push('answer'),
    closeBook: () => { calls.push('book'); return reading; },
    goHome: () => calls.push('home'),
    exit: async () => { calls.push('exit'); },
  } };
}
test('pending hint/answer consumes back without closing, navigating, or exiting', async () => {
  for (const page of ['home', 'quiz', 'books']) {
    const { calls, actions } = setup(true);
    await navigateBack({ pending: true, answerOpen: true, page }, actions);
    assert.deepEqual(calls, []);
  }
});
test('answer closes before any navigation or exit', async () => {
  const { calls, actions } = setup(true);
  await navigateBack({ pending: false, answerOpen: true, page: 'books' }, actions);
  assert.deepEqual(calls, ['answer']);
});
test('book reader returns to list and list returns home on the next back', async () => {
  const reader = setup(true);
  await navigateBack({ pending: false, answerOpen: false, page: 'books' }, reader.actions);
  assert.deepEqual(reader.calls, ['book']);
  const list = setup(false);
  await navigateBack({ pending: false, answerOpen: false, page: 'books' }, list.actions);
  assert.deepEqual(list.calls, ['book', 'home']);
});
test('other tabs return home, ignoring a reader preserved in a hidden tab', async () => {
  for (const page of ['quiz', 'words', 'settings']) {
    const { calls, actions } = setup(true);
    await navigateBack({ pending: false, answerOpen: false, page }, actions);
    assert.deepEqual(calls, ['home']);
  }
});
test('only home exits and native failure is propagated for UI handling', async () => {
  const { calls, actions } = setup(true);
  await navigateBack({ pending: false, answerOpen: false, page: 'home' }, actions);
  assert.deepEqual(calls, ['exit']);
  actions.exit = async () => { throw new Error('native failure'); };
  await assert.rejects(navigateBack({ pending: false, answerOpen: false, page: 'home' }, actions), /native failure/);
});
