"""Create review copies with long near-silent tails shortened; preserve originals."""
import hashlib
import json
from pathlib import Path
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'artifacts/beginner-chants/all-carol-fast-v1'
DEST = ROOT / 'artifacts/beginner-chants/all-carol-fast-trimmed-v1'
DEST.mkdir(parents=True, exist_ok=True)
WINDOW_SECONDS = 0.1
RMS_THRESHOLD = 0.002
KEEP_SECONDS = 0.8
MIN_TAIL_SECONDS = 1.5
FADE_SECONDS = 0.1


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


results = []
for info_path in sorted(SOURCE.glob('beginner-*.json')):
    info = json.loads(info_path.read_text(encoding='utf-8'))
    source = SOURCE / (info_path.stem + '.wav')
    dest = DEST / source.name
    metadata = DEST / info_path.name
    if dest.exists() or metadata.exists():
        raise FileExistsError(f'Refusing to overwrite {dest} or {metadata}')
    if sha(source) != info['sha256']:
        raise ValueError(f'Source hash mismatch: {source}')
    with wave.open(str(source), 'rb') as wav:
        channels, width, rate, frames = wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()
        if channels != 2 or width != 2 or rate != 48000:
            raise ValueError(f'Unexpected WAV format: {source}')
        raw = wav.readframes(frames)
    samples = np.frombuffer(raw, dtype='<i2').reshape(-1, channels)
    window = int(rate * WINDOW_SECONDS)
    samples_float = samples[:frames // window * window].astype(np.float32) / 32768
    rms = np.sqrt(np.mean(samples_float.reshape(-1, window, channels) ** 2, axis=(1, 2)))
    active = np.flatnonzero(rms > RMS_THRESHOLD)
    if not active.size:
        raise ValueError(f'No audible activity detected: {source}')
    last_active_end = min(frames, (int(active[-1]) + 1) * window)
    tail = (frames - last_active_end) / rate
    cut = min(frames, last_active_end + int(KEEP_SECONDS * rate)) if tail > MIN_TAIL_SECONDS else frames
    output = samples[:cut].copy()
    if cut < frames:
        fade = min(int(FADE_SECONDS * rate), cut)
        ramp = np.linspace(1.0, 0.0, fade, dtype=np.float32)[:, None]
        output[-fade:] = (output[-fade:].astype(np.float32) * ramp).astype('<i2')
    with wave.open(str(dest), 'wb') as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(width)
        wav.setframerate(rate)
        wav.writeframes(output.tobytes())
    info.update(source_audio=str(source.relative_to(ROOT)), source_audio_sha256=info['sha256'],
                sha256=sha(dest), bytes=dest.stat().st_size, duration_seconds=cut / rate,
                trailing_silence_trim={'threshold_rms': RMS_THRESHOLD,
                  'window_seconds': WINDOW_SECONDS, 'keep_seconds': KEEP_SECONDS,
                  'minimum_tail_seconds': MIN_TAIL_SECONDS, 'fade_seconds': FADE_SECONDS if cut < frames else 0,
                  'tail_detected_seconds': round(tail, 3), 'removed_seconds': round((frames-cut)/rate, 3)})
    metadata.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    results.append({'id': info['id'], **info['trailing_silence_trim'], 'sha256': info['sha256']})
if len(results) != 45:
    raise ValueError(f'Expected 45 tracks, found {len(results)}')
(DEST / 'trim-report.json').write_text(json.dumps({'tracks': results}, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f"PASS: {len(results)} tracks; trimmed {sum(x['removed_seconds'] > 0 for x in results)}")
