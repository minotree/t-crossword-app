import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/PictureBookAudio.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, '').replaceAll('import.meta.env', '{}'), {
  compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'fixture.element', target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
let sequence = 0;
async function setup(t, result) {
  const playback = []; let finishAd; let shows = 0; let cursor = 0;
  const slots = []; const cleanups = []; const effects = []; const events = new Map();
  const audio = { configured: true, status: 'idle', play: async count => playback.push(count), stopPlayback() {} };
  const fixture = {
    element: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback(callback) { return slots[cursor++] ??= callback; },
    useAudioOutsideClick: () => 'audio-fixture',
    useEffect(effect) { const index = cursor++; if (!(index in slots)) { slots[index] = true; effects.push(effect); } },
    usePictureBookAudio: () => audio,
    androidInterstitial: { showForPictureBook: () => { shows++; return result ? Promise.resolve(result) : new Promise(resolve => { finishAd = resolve; }); } },
  };
  const key = `__pictureBookFixture${++sequence}`; globalThis[key] = fixture;
  t.after(() => { cleanups.forEach(cleanup => cleanup?.()); delete globalThis[key]; });
  for (const [name, value] of Object.entries({ document: { hidden: false }, window: {
    addEventListener: (name, listener) => events.set(name, listener), removeEventListener: name => events.delete(name),
  } })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  const bindings = `const fixture = globalThis.${key};
    const { useState, useRef, useEffect, useCallback, useAudioOutsideClick, usePictureBookAudio, androidInterstitial } = fixture;
    const [IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonContent] = ['button','modal','header','toolbar','title','content'];\n`;
  const { PictureBookAudio } = await import(`data:text/javascript,${encodeURIComponent(bindings + compiled)}`);
  const render = () => {
    cursor = 0;
    const root = PictureBookAudio({ id: 'beginner-01-01', text: 'Example' });
    effects.splice(0).forEach(effect => cleanups.push(effect()));
    const all = [];
    const visit = node => { if (!node || typeof node !== 'object') return; all.push(node); node.children.forEach(visit); };
    visit(root); return all;
  };
  return { render, playback, events, finish: value => finishAd(value), shows: () => shows };
}

for (const count of [5, 10]) for (const result of ['dismissed', 'failed', 'skipped']) {
  test(`${count} repeats begin only after ad result ${result}`, async t => {
    const h = await setup(t, result === 'skipped' ? result : undefined);
    let nodes = h.render();
    nodes.find(node => node.type === 'button' && node.children.includes('연속듣기')).props.onClick();
    nodes = h.render();
    const button = nodes.find(node => node.type === 'button' && node.props.key === count);
    button.props.onClick(); button.props.onClick();
    assert.deepEqual(h.playback, []); assert.equal(h.shows(), 0);
    nodes = h.render(); nodes.find(node => node.type === 'modal').props.onDidDismiss();
    assert.equal(h.shows(), 1);
    if (result !== 'skipped') { assert.deepEqual(h.playback, []); h.finish(result); }
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(h.playback, [count]);
  });
}

test('leaving the page during an ad cancels delayed playback', async t => {
  const h = await setup(t); let nodes = h.render();
  nodes.find(node => node.type === 'button' && node.props.key === 5).props.onClick();
  nodes = h.render(); nodes.find(node => node.type === 'modal').props.onDidDismiss();
  h.events.get('pagehide')(); h.finish('dismissed'); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(h.playback, []);
});
