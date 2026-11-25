import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

const installed = createRequire(new URL('../package.json', import.meta.url));
const { JSDOM } = createRequire(new URL('../../toss/package.json', import.meta.url))('jsdom');
export const h = React.createElement;
export const act = React.act;

/** Real app components/hooks and React DOM; only Ionic/native/media/network effects are mocked. */
export async function audioDomFixture(t, options = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { pretendToBeVisual: true });
  let root;
  t.after(async () => { if (root) await act(async () => root.unmount()); });
  const media = [], workers = [], fetches = [];
  const books = JSON.parse(readFileSync(new URL('../src/data/picture-books.json', import.meta.url), 'utf8'));
  const vocabulary = [{ id: 'CAT', word: 'CAT', example: 'A cat sits.', meaning: '고양이', level: 'beginner' },
    { id: 'DOG', word: 'DOG', example: 'A dog runs.', meaning: '개', level: 'beginner' }];
  const globals = {
    window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    ResizeObserver: class { observe() {} disconnect() {} },
    Worker: class { constructor() { workers.push(this); } postMessage() {} terminate() {} },
    Audio: class {
      constructor() { this.src = ''; this.paused = true; this.pauses = 0; this.plays = 0; media.push(this); }
      play() {
        this.paused = false; this.plays++;
        if (options.mediaPlay) return options.mediaPlay(this);
        this.onplaying?.(); return Promise.resolve();
      }
      pause() { this.paused = true; this.pauses++; }
      removeAttribute() { this.src = ''; }
      load() {}
    },
    fetch: async (url, init) => {
      fetches.push({ url: String(url), signal: init?.signal });
      if (options.fetch) return options.fetch(url, init);
      return { ok: true, json: async () => books.flatMap(book => book.pages.map((page, index) => {
        const id = `${book.id}-${String(index + 1).padStart(2, '0')}`;
        return { id, text: page.text, file: `${id}-${'a'.repeat(16)}.mp3`, sha256: 'a'.repeat(64) };
      })) };
    },
  };
  for (const [name, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  t.after(() => dom.window.close());
  dom.window.HTMLElement.prototype.scrollTo = function () {};
  dom.window.matchMedia = () => ({ matches: true });
  const Box = ({ children }) => h('div', null, children);
  const Empty = () => null;
  const IonContent = React.forwardRef(function Content({ children }, ref) {
    const element = React.useRef(null);
    React.useImperativeHandle(ref, () => ({ getScrollElement: async () => element.current }));
    return h('div', { ref: element }, children);
  });
  function IonModal({ children, isOpen, onDidDismiss }) {
    const previous = React.useRef(false);
    React.useEffect(() => {
      const dismissed = previous.current && !isOpen;
      previous.current = isOpen;
      if (dismissed) onDidDismiss();
    }, [isOpen, onDidDismiss]);
    return isOpen ? h('div', { role: 'dialog' }, children) : null;
  }
  const snapshot = { privacyRequired: false, busy: false, message: '' };
  const unsubscribe = () => () => {};
  const stubs = {
    '@ionic/react': {
      IonPage: Box, IonContent, IonHeader: Box, IonFooter: Box, IonTitle: Box, IonToolbar: Box,
      IonIcon: Empty, IonModal,
      IonButton: ({ children, size, fill, expand, slot, ...props }) => h('button', props, children),
    },
    '@capacitor/app': { App: {} }, '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
    'ionicons/icons': {},
    '@t-crossword/core': {
      defaultVocabList: vocabulary, wordnetLicense: '', parseCrosswordPuzzle: value => value,
      levelLearningProgress: () => ({ completed: 0, total: vocabulary.length }),
      createWordAudioManifestLoader: () => async () => options.wordManifest ? options.wordManifest() : Object.fromEntries(vocabulary.map((word, index) =>
        [word.word, { ...word, file: `word-${index + 1}-${'a'.repeat(16)}.mp3` }])),
    },
    'progress.js': { readProgress: () => ({ completed: [], bookmarks: [], hintedWords: [] }) },
    'androidInterstitial.js': { androidInterstitial: {
      subscribe: unsubscribe, getSnapshot: () => snapshot, start() {}, recordSuccess: () => false,
      showForPictureBook: () => options.showAd?.() ?? Promise.resolve('skipped'),
    } },
    'androidBack.js': { subscribeAndroidBack: unsubscribe },
    'AnswerEntry.js': { AnswerEntry: Empty }, 'Modal.js': { Modal: Empty },
    'CompletionConfetti.js': { CompletionConfetti: Empty }, 'answerViewport.js': {}, 'backNavigation.js': {},
  };
  const cache = new Map();
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
      if (!specifier.startsWith('.')) return installed(specifier);
      const tsx = new URL(specifier.replace(/\.js$/, '.tsx'), url);
      return load(existsSync(tsx) ? tsx : new URL(specifier.replace(/\.js$/, '.ts'), url));
    };
    new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
    return module.exports;
  }
  const host = document.getElementById('root');
  root = createRoot(host);
  const render = async node => { await act(async () => root.render(node)); };
  const tap = async selector => {
    const button = typeof selector === 'string' ? host.querySelector(selector) : selector;
    assert.ok(button, `Missing control: ${selector}`);
    await act(async () => button.click());
  };
  const outside = async () => { await act(async () => document.body.click()); };
  const module = name => load(new URL(`../src/${name}`, import.meta.url));
  const app = async () => { await render(h(module('pages/HomePage.tsx').HomePage)); };
  const menu = name => tap(`.mobile-nav button:nth-child(${{ home: 1, quiz: 2, words: 3, books: 4, settings: 5 }[name]})`);
  const openBook = async () => { await menu('books'); await tap('.mobile-book-list button'); };
  return { dom, host, root, render, tap, outside, module, app, menu, openBook, books, vocabulary, media, workers, fetches };
}
