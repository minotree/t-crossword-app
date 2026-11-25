import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, h, audioDomFixture } from './audioDomFixture.mjs';

const listen = '[aria-label="그림책 영어 듣기"] > button';
const enc = '.mobile-encouragement-actions > button:nth-child(2)';
const playing = fixture => fixture.media.filter(audio => !audio.paused);

test('encouragement preserves toggle, stops outside and switches players before the new click', async t => {
  const f = await audioDomFixture(t);
  const { EncouragementAudio } = f.module('components/EncouragementAudio.tsx');
  const phrases = f.module('data/encouragements.json');
  await f.render(h('div', null, ...phrases.slice(0, 2).map(item => h(EncouragementAudio, { key: item.english, english: item.english }))));
  const buttons = f.host.querySelectorAll('button');
  await f.tap(buttons[0]); assert.equal(playing(f).length, 1);
  await f.tap(buttons[0]); assert.equal(playing(f).length, 0);
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
  await f.tap(buttons[0]); await f.tap(buttons[1]);
  assert.equal(f.media.at(-2).paused, true); assert.equal(playing(f).length, 1);
  await f.outside(); assert.equal(playing(f).length, 0);
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'false');
});

test('outside click supports shadow paths, preserves propagation and removes its listener on unmount', async t => {
  const f = await audioDomFixture(t);
  let stops = 0, clicks = 0;
  const { useAudioOutsideClick } = f.module('adapters/useAudioOutsideClick.ts');
  function Control() {
    const owner = useAudioOutsideClick(true, () => stops++);
    return h('div', { 'data-mobile-audio-control': owner, ref: node => {
      if (node && !node.shadowRoot) node.attachShadow({ mode: 'open' }).append(document.createElement('button'));
    } });
  }
  await f.render(h(Control));
  await f.render(h(Control)); await f.render(h(Control));
  const bubble = () => clicks++;
  const doc = document;
  doc.addEventListener('click', bubble); t.after(() => doc.removeEventListener('click', bubble));
  const inner = f.host.firstChild.shadowRoot.firstChild;
  await act(async () => inner.dispatchEvent(new f.dom.window.MouseEvent('click', { bubbles: true, composed: true })));
  assert.equal(stops, 0); assert.equal(clicks, 1);
  await f.outside(); assert.equal(stops, 1); assert.equal(clicks, 2);
  await f.render(null); await f.outside(); assert.equal(stops, 1);
});

test('word audio preserves stop/speed/word switching and stops on outside clicks', async t => {
  const f = await audioDomFixture(t); await f.app(); await f.menu('words');
  const controls = f.host.querySelectorAll('.mobile-word-audio-actions button');
  await f.tap(controls[0]); await f.tap(controls[0]); assert.equal(playing(f).length, 0);
  await f.tap(controls[0]); await f.tap(controls[1]);
  assert.equal(playing(f).length, 1); assert.equal(f.media.at(-1).playbackRate, 0.7);
  await f.tap(controls[2]); assert.equal(playing(f).length, 1); assert.equal(f.media.at(-2).paused, true);
  await f.outside(); assert.equal(playing(f).length, 0);
  assert.equal(controls[2].getAttribute('aria-pressed'), 'false');
});

test('book menu exit stops narration/chant, preserves book/page and never resumes on return', async t => {
  const f = await audioDomFixture(t); await f.app(); await f.openBook();
  await f.tap(listen); await f.tap(listen); assert.equal(playing(f).length, 0);
  await f.tap(listen); await f.outside(); assert.equal(playing(f).length, 0);
  await f.tap(listen); await f.tap('[aria-label="그림책 영어 듣기"] > button:nth-child(3)');
  assert.equal(playing(f).length, 1); assert.ok(f.media.at(-1).src.includes('/beginner-chants/'));
  await f.menu('home'); assert.equal(playing(f).length, 0);
  const created = f.media.length; await f.menu('books'); assert.equal(f.media.length, created);
  await f.tap('.mobile-reading-scroll > .mobile-reading-actions:not([role]) button:nth-child(2)');
  await f.tap('.mobile-reading-levels button:nth-child(2)');
  const multiplePages = f.books.find(book => book.level === 'intermediate' && book.pages.length > 1);
  await f.tap(Array.from(f.host.querySelectorAll('.mobile-book-list button')).find(node => node.textContent === multiplePages.title));
  const title = f.host.querySelector('.mobile-books h2').textContent;
  const next = f.host.querySelector('[aria-label="다음 페이지"]');
  assert.ok(next, 'Use a multiple-page book to verify page preservation');
  await f.tap(next);
  const page = f.host.querySelector('.mobile-reading-scroll > p').textContent;
  await f.tap(listen); await f.menu('words'); assert.equal(playing(f).length, 0);
  await f.tap('.mobile-word-audio-actions button'); assert.equal(playing(f).length, 1);
  await f.menu('books'); assert.equal(playing(f).length, 0);
  assert.equal(f.host.querySelector('.mobile-books h2').textContent, title);
  assert.equal(f.host.querySelector('.mobile-reading-scroll > p').textContent, page);
  assert.ok(f.host.querySelector(listen).textContent.includes('듣기'));
});

test('hidden book cannot overlap encouragement and new puzzle replaces only one of each DOM', async t => {
  const f = await audioDomFixture(t); await f.app(); await f.openBook(); await f.tap(listen);
  await f.menu('quiz'); assert.equal(playing(f).length, 0);
  const puzzle = { level: 'beginner', size: 8, grid: Array.from({ length: 8 }, () => Array(8).fill(null)),
    words: [{ id: 'CAT', word: 'CAT', orientation: 'across', startRow: 0, startCol: 0, number: 1 }] };
  for (let version = 0; version < 4; version++) {
    if (version) await f.tap('.mobile-quiz-summary-actions button');
    await act(async () => f.workers.at(-1).onmessage({ data: { puzzle } }));
    assert.equal(f.host.querySelectorAll('.mobile-board').length, 1);
    assert.equal(f.host.querySelectorAll('.mobile-quiz-encouragement').length, 1);
    assert.equal(playing(f).length, 0);
    await f.tap(enc); assert.equal(playing(f).length, 1);
  }
  await f.menu('books'); assert.equal(playing(f).length, 0);
});

test('retained PictureBooks stops on active prop change without a click and retains its page', async t => {
  const f = await audioDomFixture(t);
  const { PictureBooks } = f.module('components/PictureBooks.tsx');
  await f.render(h(PictureBooks, { active: true }));
  await f.tap('.mobile-reading-levels button:nth-child(2)');
  const book = f.books.find(item => item.level === 'intermediate' && item.pages.length > 1);
  await f.tap(Array.from(f.host.querySelectorAll('.mobile-book-list button')).find(node => node.textContent === book.title));
  await f.tap('[aria-label="다음 페이지"]'); await f.tap(listen);
  assert.equal(playing(f).length, 1);
  const page = f.host.querySelector('.mobile-reading-scroll > p').textContent;
  await f.render(h(PictureBooks, { active: false })); assert.equal(playing(f).length, 0);
  const created = f.media.length;
  await f.render(h(PictureBooks, { active: true }));
  assert.equal(f.host.querySelector('.mobile-books h2').textContent, book.title);
  assert.equal(f.host.querySelector('.mobile-reading-scroll > p').textContent, page);
  assert.equal(f.media.length, created); assert.equal(playing(f).length, 0);
});

for (const cancellation of ['outside', 'menu']) test(`book ${cancellation} cancellation aborts loading and ignores a valid late response`, async t => {
  let finish;
  const f = await audioDomFixture(t, { fetch: () => new Promise(resolve => { finish = resolve; }) });
  await f.app(); await f.openBook(); await f.tap(listen);
  assert.ok(f.host.querySelector(listen).textContent.includes('중지'));
  if (cancellation === 'menu') { await f.menu('home'); await f.menu('books'); }
  else await f.outside();
  assert.equal(f.fetches[0].signal.aborted, true);
  const book = f.books[0];
  await act(async () => finish({ ok: true, json: async () => [{ id: `${book.id}-01`, text: book.pages[0].text,
    sha256: 'a'.repeat(64), file: `${book.id}-01-${'a'.repeat(16)}.mp3` }] }));
  assert.equal(f.media.length, 0);
  assert.equal(f.host.querySelector(listen).textContent, '듣기');
});

test('word loading cancellation ignores a valid late manifest', async t => {
  let finish;
  const f = await audioDomFixture(t, { wordManifest: () => new Promise(resolve => { finish = resolve; }) });
  await f.app(); await f.menu('words'); await f.tap('.mobile-word-audio-actions button');
  await f.outside();
  await act(async () => finish({ CAT: { word: 'CAT', example: 'A cat sits.', file: `word-1-${'a'.repeat(16)}.mp3` } }));
  assert.equal(f.media.length, 0);
  assert.equal(f.host.querySelector('.mobile-word-audio-actions button').getAttribute('aria-pressed'), 'false');
});

test('encouragement loading cancellation ignores late media events and rejection', async t => {
  let reject;
  const f = await audioDomFixture(t, { mediaPlay: () => new Promise((_resolve, fail) => { reject = fail; }) });
  const { EncouragementAudio } = f.module('components/EncouragementAudio.tsx');
  await f.render(h(EncouragementAudio, { english: f.module('data/encouragements.json')[0].english }));
  await f.tap('button');
  const media = f.media[0], latePlaying = media.onplaying;
  await f.outside();
  await act(async () => { latePlaying(); reject(new Error('cancelled')); });
  assert.equal(media.paused, true); assert.equal(media.src, '');
  assert.equal(f.host.querySelector('button').getAttribute('aria-pressed'), 'false');
  assert.equal(f.host.querySelector('[role="alert"]'), null);
});

test('repeat gap cancellation removes timer and prevents automatic replay', async t => {
  const f = await audioDomFixture(t); await f.app(); await f.openBook();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  await f.tap('[aria-label="그림책 영어 듣기"] > button:nth-child(2)');
  await f.tap(Array.from(f.host.querySelectorAll('[role="dialog"] button')).find(node => node.textContent === '5회 듣기'));
  assert.equal(playing(f).length, 1);
  const media = f.media.at(-1);
  await act(async () => { media.paused = true; media.onended(); });
  await f.outside();
  await act(async () => t.mock.timers.tick(2000));
  assert.equal(media.plays, 1); assert.equal(playing(f).length, 0);
  assert.equal(f.host.querySelector(listen).textContent, '듣기');
});

for (const cancellation of ['menu', 'outside']) test(`ad completion cannot replay after ${cancellation} cancellation, including return`, async t => {
  let finishAd, adCalls = 0;
  const f = await audioDomFixture(t, { showAd: () => { adCalls++; return new Promise(resolve => { finishAd = resolve; }); } });
  await f.app(); await f.openBook();
  await f.tap('[aria-label="그림책 영어 듣기"] > button:nth-child(2)');
  await f.tap(Array.from(f.host.querySelectorAll('[role="dialog"] button')).find(node => node.textContent === '5회 듣기'));
  assert.equal(adCalls, 1); assert.equal(f.media.length, 0);
  if (cancellation === 'menu') { await f.menu('home'); await f.menu('books'); }
  else await f.outside();
  await act(async () => finishAd('dismissed'));
  assert.equal(f.media.length, 0);
  assert.equal(f.host.querySelector(listen).disabled, false);
  assert.equal(f.host.querySelector(listen).textContent, '듣기');
});

test('ad cancellation generation survives a programmatic menu exit and return', async t => {
  let finishAd;
  const f = await audioDomFixture(t, { showAd: () => new Promise(resolve => { finishAd = resolve; }) });
  const { PictureBookAudio } = f.module('components/PictureBookAudio.tsx');
  const props = { id: `${f.books[0].id}-01`, text: f.books[0].pages[0].text };
  await f.render(h(PictureBookAudio, { ...props, menuActive: true }));
  await f.tap('[aria-label="그림책 영어 듣기"] > button:nth-child(2)');
  await f.tap(Array.from(f.host.querySelectorAll('[role="dialog"] button')).find(node => node.textContent === '5회 듣기'));
  assert.equal(typeof finishAd, 'function');
  await f.render(h(PictureBookAudio, { ...props, menuActive: false }));
  await f.render(h(PictureBookAudio, { ...props, menuActive: true }));
  await act(async () => finishAd('dismissed'));
  assert.equal(f.media.length, 0); assert.equal(f.host.querySelector(listen).textContent, '듣기');
});
