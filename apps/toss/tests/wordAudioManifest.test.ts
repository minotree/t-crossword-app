import { expect, it } from 'vitest';
import { defaultVocabList } from '@t-crossword/core';
import manifest from '../src/data/word-audio.json';
import type { AudioEntry } from '../src/adapters/wordAudio.js';

it('provides a unique matching audio file for every vocabulary word and example', () => {
  const entries: Record<string, AudioEntry> = manifest;
  expect(Object.keys(entries).sort()).toEqual(defaultVocabList.map(word => word.id).sort());
  const files = new Set<string>();
  for (const word of defaultVocabList) {
    const entry = entries[word.id];
    expect(entry.word).toBe(word.word);
    expect(entry.example).toBe(word.example);
    expect(entry.file).toMatch(new RegExp(`^${word.id}-[a-f0-9]{16}\\.mp3$`));
    files.add(entry.file);
  }
  expect(files.size).toBe(defaultVocabList.length);
});
