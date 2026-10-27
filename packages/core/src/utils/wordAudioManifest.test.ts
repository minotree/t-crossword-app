import { describe, expect, it, vi } from 'vitest';
import { createWordAudioManifestLoader, parseWordAudioManifest } from './wordAudioManifest.js';

const entry = { id: 'other-app-id', word: 'YOU', example: 'You can sit here.',
  file: 'word-2-aaaaaaaaaaaaaaaa.mp3', sha256: 'a'.repeat(64), seconds: 3.4 };
const manifest = { schemaVersion: 1, pauseMs: 500, audioPath: 'word-audio/',
  sourceCsvSha256: 'b'.repeat(64), entries: { YOU: entry } };

describe('public word audio boundary', () => {
  it('accepts word keys independently of source IDs', () => {
    expect(parseWordAudioManifest(manifest).YOU.file).toBe(entry.file);
  });
  it.each([null, { ...manifest, schemaVersion: 2 }, { ...manifest, pauseMs: 800 },
    { ...manifest, audioPath: '../' }, { ...manifest, sourceCsvSha256: 'invalid' },
    { ...manifest, entries: { YOU: { ...entry, file: '../secret.mp3' } } },
    { ...manifest, entries: { YOU: { ...entry, sha256: 'c'.repeat(64) } } },
    { ...manifest, entries: { you: entry } },
  ])('rejects malformed or unsafe manifests', value => {
    expect(() => parseWordAudioManifest(value)).toThrow();
  });
  it('shares concurrent and successful requests, and retries failures', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(manifest);
    const load = createWordAudioManifestLoader(transport);
    await expect(load()).rejects.toThrow('offline');
    const first = load();
    expect(load()).toBe(first);
    await first;
    await load();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
