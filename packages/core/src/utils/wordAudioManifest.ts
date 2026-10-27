export interface WordAudioEntry { word: string; example: string; file: string }

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Validate the public boundary before an app constructs media URLs. */
export function parseWordAudioManifest(value: unknown): Record<string, WordAudioEntry> {
  if (!record(value) || value.schemaVersion !== 1 || value.pauseMs !== 500 ||
      value.audioPath !== 'word-audio/' || typeof value.sourceCsvSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.sourceCsvSha256) || !record(value.entries)) {
    throw new Error('음성 목록 형식이 올바르지 않습니다.');
  }
  const entries: Record<string, WordAudioEntry> = Object.create(null);
  for (const [key, entry] of Object.entries(value.entries)) {
    if (!record(entry) || typeof entry.word !== 'string' || key !== entry.word.toUpperCase() ||
        typeof entry.example !== 'string' || typeof entry.id !== 'string' ||
        typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        typeof entry.file !== 'string' || !/^word-\d+-[a-f0-9]{16}\.mp3$/.test(entry.file) ||
        !entry.file.endsWith(`-${entry.sha256.slice(0, 16)}.mp3`) ||
        typeof entry.seconds !== 'number' || !Number.isFinite(entry.seconds) || entry.seconds <= 0) {
      throw new Error('음성 목록 항목이 올바르지 않습니다.');
    }
    entries[key] = { word: entry.word, example: entry.example, file: entry.file };
  }
  return entries;
}

/** The transport is supplied by each platform; failed loads can be retried. */
export function createWordAudioManifestLoader(load: () => Promise<unknown>) {
  let pending: Promise<Record<string, WordAudioEntry>> | undefined;
  return () => pending ??= load().then(parseWordAudioManifest).catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
}
