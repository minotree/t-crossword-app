import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Reuse the workspace's installed jsdom; no new mobile/runtime dependency.
const workspaceTestRequire = createRequire(new URL('../../toss/package.json', import.meta.url));
const { JSDOM } = workspaceTestRequire('jsdom');
const h = React.createElement;

test('HomePage replaces puzzle and encouragement DOM after consecutive new puzzles', async t => {
  let root;
  t.after(async () => { if (root) await React.act(async () => root.unmount()); });
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>');
  const globals = {
    window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    // Layout/native behavior is outside this DOM reconciliation regression.
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    ResizeObserver: class { observe() {} disconnect() {} },
  };
  for (const [name, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const workers = [];
  const originalWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  globalThis.Worker = class {
    constructor() { workers.push(this); }
    postMessage() {}
    terminate() {}
  };
  t.after(() => {
    if (originalWorker) Object.defineProperty(globalThis, 'Worker', originalWorker);
    else Reflect.deleteProperty(globalThis, 'Worker');
    dom.window.close();
  });
  const Box = ({ children }) => h('div', null, children);
  const Empty = () => null;
  const IonContent = React.forwardRef(function Content({ children }, ref) {
    const element = React.useRef(null);
    React.useImperativeHandle(ref, () => ({ getScrollElement: async () => element.current }));
    return h('div', { ref: element }, children);
  });
  const snapshot = { privacyRequired: false, busy: false, message: '' };
  const unsubscribe = () => () => {};
  const wordAudio = { subscribe: unsubscribe, getSnapshot: () => snapshot, stop() {} };
  const stubs = {
    '@ionic/react': {
      IonPage: Box, IonContent, IonHeader: Box, IonFooter: Box, IonTitle: Box, IonToolbar: Box,
      IonIcon: Empty,
      IonButton: ({ children, onClick, disabled, type, size, fill, expand, ...props }) =>
        h('button', { ...props, type: type ?? 'button', onClick, disabled }, children),
    },
    '@capacitor/app': { App: {} },
    '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
    'ionicons/icons': {},
    '@t-crossword/core': {
      defaultVocabList: [], wordnetLicense: '', parseCrosswordPuzzle: value => value,
      levelLearningProgress: () => ({ completed: 0, total: 0 }),
    },
    'progress.js': { readProgress: () => ({ completed: [], bookmarks: [], hintedWords: [] }) },
    'androidInterstitial.js': { androidInterstitial: {
      subscribe: unsubscribe, getSnapshot: () => snapshot, start() {}, recordSuccess: () => false,
    } },
    'wordAudio.js': { createMobileWordAudio: () => wordAudio, DEFAULT_WORD_AUDIO_BASE_URL: '' },
    'wordAudioLifecycle.js': { subscribeWordAudioLifecycle: unsubscribe },
    'androidBack.js': { subscribeAndroidBack: unsubscribe },
    'PictureBooks.js': { PictureBooks: Empty }, 'AnswerEntry.js': { AnswerEntry: Empty },
    'Modal.js': { Modal: Empty }, 'CompletionConfetti.js': { CompletionConfetti: Empty },
    'WordAudioButtons.js': { WordAudioButtons: Empty }, 'EncouragementAudio.js': { EncouragementAudio: Empty },
    'answerViewport.js': {}, 'backNavigation.js': {},
  };
  const cache = new Map();
  const requireInstalled = createRequire(new URL('../package.json', import.meta.url));
  // Compile the real HomePage and quiz components in memory. Only external/native
  // effects are replaced; React hooks, JSX keys and DOM reconciliation stay real.
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const source = readFileSync(url, 'utf8');
    if (url.pathname.endsWith('.json')) return JSON.parse(source);
    const compiled = ts.transpileModule(source.replaceAll('import.meta.env', '({})')
      .replaceAll('import.meta.url', JSON.stringify(url.href)), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    cache.set(url.href, module.exports);
    const require = specifier => {
      if (specifier.endsWith('.css')) return {};
      const stub = stubs[specifier] ?? stubs[specifier.split('/').at(-1)];
      if (stub) return stub;
      if (specifier.startsWith('.')) return load(new URL(specifier.replace(/\.js$/, '.tsx'), url));
      return requireInstalled(specifier);
    };
    // puzzlePresentation is a plain TypeScript module, rather than TSX.
    const localRequire = specifier => specifier.endsWith('/puzzlePresentation.js')
      ? load(new URL(specifier.replace(/\.js$/, '.ts'), url)) : require(specifier);
    new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
    return module.exports;
  }
  const { HomePage } = load(new URL('../src/pages/HomePage.tsx', import.meta.url));
  const host = document.getElementById('root');
  root = createRoot(host);
  const click = async text => {
    const button = Array.from(host.querySelectorAll('button')).find(node => node.textContent === text);
    assert.ok(button, `Missing button: ${text}`);
    await React.act(async () => button.click());
  };
  await React.act(async () => root.render(h(HomePage)));
  await click('퀴즈 시작');
  const phrases = JSON.parse(readFileSync(new URL('../src/data/encouragements.json', import.meta.url), 'utf8'));
  let previousBoard, previousEncouragement;
  for (let version = 1; version <= 4; version++) {
    if (version > 1) await click('새 퍼즐');
    assert.equal(workers.length, version);
    // Distinct fixture layouts make stale boards observable without testing generation.
    const row = version - 1;
    const grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let col = 0; col < 3; col++) grid[row][col] = { letter: 'CAT'[col], ...(col === 0 ? { acrossNumber: 1 } : {}) };
    const puzzle = { level: 'beginner', size: 8, grid, words: [{ id: `cat-${version}`, word: 'CAT',
      meaning: '고양이', orientation: 'across', startRow: row, startCol: 0, number: 1 }] };
    await React.act(async () => workers.at(-1).onmessage({ data: { puzzle } }));
    assert.equal(host.querySelectorAll('.mobile-puzzle-layout').length, 1);
    assert.equal(host.querySelectorAll('.mobile-board').length, 1);
    assert.equal(host.querySelectorAll('.mobile-quiz-encouragement').length, 1);
    assert.equal(host.querySelectorAll('.mobile-all-hints-button').length, 1);
    if (previousBoard) assert.equal(previousBoard.isConnected, false);
    if (previousEncouragement) assert.equal(previousEncouragement.isConnected, false);
    const board = host.querySelector('.mobile-board');
    assert.equal(board.children[row * 8].classList.contains('blocked'), false);
    const encouragement = host.querySelector('.mobile-quiz-encouragement');
    assert.equal(encouragement.querySelector('[lang="en"]').textContent, phrases[version - 1].english);
    assert.equal(encouragement.querySelector('[lang="ko"]').hidden, true);
    previousBoard = board; previousEncouragement = encouragement;
  }
});
