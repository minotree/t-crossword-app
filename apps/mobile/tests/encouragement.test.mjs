import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const manifest = JSON.parse(await read('../src/data/encouragement-audio.json'));
const encouragements = JSON.parse(await read('../src/data/encouragements.json'));
let sequence = 0;
// Exercise the components with the same lightweight hook fixture as mobile's audio tests.
async function setup(t, name) {
  let cursor = 0;
  const slots = [], effects = [], cleanups = [], elements = [], scrolls = [];
  let leave, timeout;
  const fixture = {
    element: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
    fragment: 'fragment',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useCallback(callback) { return slots[cursor++] ??= callback; },
    useAudioOutsideClick: () => 'audio-fixture',
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) effects.push(effect);
      slots[index] = deps;
    },
    subscribeWordAudioLifecycle(stop) { leave = stop; return stop; },
    Audio: function () {
      const audio = { src: '', paused: false, play: () => Promise.resolve(), pause() { this.paused = true; },
        removeAttribute() { this.src = ''; }, load() {} };
      elements.push(audio); return audio;
    },
    setTimeout(callback) { timeout = callback; return 1; }, clearTimeout() { timeout = undefined; },
    window: { matchMedia: () => ({ matches: true }) },
    manifest, encouragements,
  };
  const key = `__encouragementFixture${++sequence}`;
  globalThis[key] = fixture;
  t.after(() => { cleanups.forEach(cleanup => cleanup?.()); delete globalThis[key]; });
  const source = await read(`../src/components/${name}.tsx`);
  const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ''), {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'fixture.element', jsxFragmentFactory: 'fixture.fragment', target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const bindings = `const fixture = globalThis.${key};
    const { useState, useRef, useEffect, useCallback, useAudioOutsideClick, subscribeWordAudioLifecycle, Audio, setTimeout, clearTimeout, window, manifest, encouragements } = fixture;
    const IonButton = 'button';\n${name === 'QuizEncouragement' ? "const EncouragementAudio = 'audio';" : ''}\n`;
  const module = await import(`data:text/javascript,${encodeURIComponent(bindings + compiled)}`);
  const render = (props = { english: manifest[0].english }) => {
    cursor = 0;
    const root = module[name](props);
    if (root.props.ref) root.props.ref.current = { closest: () => ({ scrollHeight: 999, scrollTo: value => scrolls.push(value) }) };
    effects.splice(0).forEach(effect => cleanups.push(effect()));
    const all = [];
    const visit = node => { if (!node || typeof node !== 'object') return; all.push(node); node.children.forEach(visit); };
    visit(root); return all;
  };
  return { render, elements, scrolls, leave: () => leave(), expire: () => timeout(), cleanup: () => cleanups.forEach(fn => fn?.()) };
}

test('mobile keeps all 50 Toss phrases and hashed audio entries unchanged', async () => {
  assert.equal(encouragements.length, 50);
  assert.deepEqual(encouragements, JSON.parse(await read('../../toss/src/data/encouragements.json')));
  assert.deepEqual(manifest, JSON.parse(await read('../../toss/src/data/encouragement-audio.json')));
  for (const phrase of encouragements) {
    assert.match(manifest.find(entry => entry.english === phrase.english).file, /^encouragement-\d{2}-[a-f0-9]{16}\.mp3$/);
  }
});

test('translation toggles, scrolls after expansion/collapse and resets for a new puzzle', async t => {
  const h = await setup(t, 'QuizEncouragement');
  let nodes = h.render({ puzzleVersion: 1 });
  assert.equal(nodes.find(n => n.props.lang === 'en').children[0], encouragements[0].english);
  assert.equal(nodes.find(n => n.props.lang === 'ko').props.hidden, true);
  nodes.find(n => n.type === 'button').props.onClick();
  nodes = h.render({ puzzleVersion: 1 });
  assert.equal(nodes.find(n => n.props.lang === 'ko').props.hidden, false);
  assert.deepEqual(h.scrolls.at(-1), { top: 999, behavior: 'auto' });
  nodes.find(n => n.type === 'button').props.onClick(); h.render({ puzzleVersion: 1 });
  assert.equal(h.scrolls.at(-1).top, 0);
  const fresh = await setup(t, 'QuizEncouragement');
  nodes = fresh.render({ puzzleVersion: 52 });
  assert.equal(nodes.find(n => n.props.lang === 'en').children[0], encouragements[1].english);
  assert.equal(nodes.find(n => n.props.lang === 'ko').props.hidden, true);
  assert.ok(['#1b64da', '#8b95a1'].includes(nodes[0].props.style.color));
});

test('audio loads on tap, stops, times out, retries and releases on lifecycle/unmount', async t => {
  const h = await setup(t, 'EncouragementAudio');
  const button = () => h.render().find(n => n.type === 'button');
  assert.equal(h.elements.length, 0);
  button().props.onClick();
  assert.equal(h.elements[0].src, `https://crossword-content-audio.minotree0902.workers.dev/encouragement-audio/${manifest[0].file}`);
  assert.match(button().children[0], /불러오는 중/);
  h.elements[0].onplaying(); assert.equal(button().props['aria-pressed'], true);
  h.elements[0].onwaiting(); h.expire();
  assert.ok(h.render().find(n => n.props.role === 'alert'));
  button().props.onClick(); h.leave();
  assert.equal(h.elements[1].src, ''); assert.equal(button().props['aria-pressed'], false);
  button().props.onClick(); button().props.onClick(); assert.equal(h.elements[2].paused, true);
  button().props.onClick(); h.cleanup(); assert.equal(h.elements[3].src, '');
});

test('a stale audio failure cannot change the replacement audio state', async t => {
  const h = await setup(t, 'EncouragementAudio');
  const button = () => h.render().find(n => n.type === 'button');
  button().props.onClick();
  const oldFailure = h.elements[0].onerror;
  button().props.onClick(); button().props.onClick(); oldFailure();
  assert.equal(button().props['aria-pressed'], true);
  assert.equal(h.render().find(n => n.props.role === 'alert'), undefined);
});
