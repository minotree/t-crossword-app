import phrases from './encouragements.json' with { type: 'json' };
import audioManifest from './encouragement-audio.json' with { type: 'json' };

export const learningEncouragements: readonly Readonly<{ english: string; korean: string }>[] = phrases;
export const encouragementAudioManifest: readonly Readonly<{ english: string; file: string }>[] = audioManifest;
export const ENCOURAGEMENT_AUDIO_BASE_URL = 'https://crossword-content-audio.minotree0902.workers.dev/encouragement-audio/';

/** One-based successful puzzle number; failed attempts do not advance it. */
export function selectLearningEncouragement(puzzleVersion: number) {
  const version = Number.isFinite(puzzleVersion) ? Math.max(1, Math.floor(puzzleVersion)) : 1;
  const phrase = learningEncouragements[(version - 1) % learningEncouragements.length];
  if (!phrase) return undefined;
  const audio = encouragementAudioManifest.find(entry => entry.english === phrase.english);
  return {
    ...phrase,
    audioUrl: audio && /^encouragement-\d{2}-[a-f0-9]{16}\.mp3$/.test(audio.file)
      ? ENCOURAGEMENT_AUDIO_BASE_URL + audio.file : undefined,
  };
}
