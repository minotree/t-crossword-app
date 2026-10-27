import { expect, it } from 'vitest';
import { defaultVocabList } from '@t-crossword/core';
import manifest from '../src/data/word-audio.json';
import type { AudioEntry } from '../src/adapters/wordAudio.js';

it('matches all 3839 word/example entries with distinct byte-hashed MP3 filenames', () => {
  const entries: Record<string, AudioEntry> = manifest;
  expect(Object.keys(entries).sort()).toEqual(defaultVocabList.map(word => word.id).sort());
  const files = new Set<string>();
  for (const word of defaultVocabList) {
    expect(entries[word.id].word).toBe(word.word);
    expect(entries[word.id].example).toBe(word.example);
    expect(entries[word.id].file).toMatch(new RegExp(`^${word.id}-[a-f0-9]{16}\\.mp3$`));
    files.add(entries[word.id].file);
  }
  expect(files.size).toBe(defaultVocabList.length);
});
