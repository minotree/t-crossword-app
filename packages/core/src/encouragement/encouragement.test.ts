import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { learningEncouragements, encouragementAudioManifest, selectLearningEncouragement } from './index.js';

it('preserves all 50 phrases and audio entries from both existing apps', () => {
  expect(learningEncouragements).toHaveLength(50);
  expect(encouragementAudioManifest).toHaveLength(50);
  for (const app of ['mobile', 'toss']) {
    const base = new URL(`../../../../apps/${app}/src/data/`, import.meta.url);
    expect(learningEncouragements).toEqual(JSON.parse(readFileSync(new URL('encouragements.json', base), 'utf8')));
    expect(encouragementAudioManifest).toEqual(JSON.parse(readFileSync(new URL('encouragement-audio.json', base), 'utf8')));
  }
  for (let version = 1; version <= 50; version++) {
    expect(selectLearningEncouragement(version)?.english).toBe(learningEncouragements[version - 1].english);
    expect(selectLearningEncouragement(version)?.audioUrl).toMatch(/^https:\/\/crossword-content-audio\.minotree0902\.workers\.dev\/encouragement-audio\/encouragement-\d{2}-[a-f0-9]{16}\.mp3$/);
  }
});

it('cycles after 50 and remains stable for the same successful puzzle version', () => {
  expect(selectLearningEncouragement(51)).toEqual(selectLearningEncouragement(1));
  expect(selectLearningEncouragement(52)).toEqual(selectLearningEncouragement(2));
  expect(selectLearningEncouragement(0)).toEqual(selectLearningEncouragement(1));
  expect(selectLearningEncouragement(Number.NaN)).toEqual(selectLearningEncouragement(1));
});
