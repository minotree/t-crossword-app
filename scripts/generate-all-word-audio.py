"""Offline full-vocabulary audio generation with per-word checkpoints. Never deploys."""
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import hashlib
import json
import os
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'artifacts/tts-cache'
CONTENT = ROOT / 'content/word-audio'
OUT = ROOT / 'artifacts/toss-word-audio-full'
PAUSE_MS = 500
RATE = 24000
PIPELINE = None
VOICE = None


def sha(data):
    return hashlib.sha256(data).hexdigest()


def config_key():
    source = json.loads((CONTENT / 'model-provenance.json').read_text(encoding='utf-8'))
    return {'model': source['revision'], 'voiceSha256': source['files']['voices/af_heart.pt']['sha256'],
            'pauseMs': PAUSE_MS, 'sampleRate': RATE, 'bitrateKbps': 64, 'speed': 1,
            'wordCase': 'lower', 'modelMode': 'eval', 'generatorVersion': 1}


def initialize(threads):
    global PIPELINE, VOICE
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    os.environ['OMP_NUM_THREADS'] = str(threads)
    import torch
    from kokoro import KModel, KPipeline
    torch.set_num_threads(threads)
    torch.set_num_interop_threads(1)
    model = KModel(repo_id='hexgrad/Kokoro-82M', config=str(CACHE / 'config.json'), model=str(CACHE / 'kokoro-v1_0.pth')).eval()
    PIPELINE = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', model=model, device='cpu')
    VOICE = torch.load(CACHE / 'af_heart.pt', weights_only=True, map_location='cpu')


def generate(word):
    import lameenc
    import numpy as np
    import soundfile as sf
    identifier = word['id']
    checkpoint = OUT / 'checkpoints' / (identifier + '.json')
    key = sha(json.dumps({'word': word['word'], 'example': word['example'], 'config': config_key()}, sort_keys=True).encode())
    if checkpoint.exists():
        old = json.loads(checkpoint.read_text(encoding='utf-8'))
        path = OUT / 'public/word-audio' / old['file']
        if old.get('inputKey') == key and path.exists() and sha(path.read_bytes()) == old['sha256']:
            return old
    chunks, phonemes, missing_tokens = [], [], []
    segments = [word['word'].lower() + '.', word['example']]
    pause_start = 0
    for index, segment in enumerate(segments):
        if index:
            pause_start = sum(len(chunk) for chunk in chunks)
            chunks.append(np.zeros(RATE * PAUSE_MS // 1000, dtype=np.float32))
        count = 0
        for result in PIPELINE(segment, voice=VOICE, speed=1):
            assert result.audio is not None and result.phonemes, identifier
            count += 1
            chunks.append(result.audio.numpy())
            phonemes.append(result.phonemes)
            for token in result.tokens or []:
                if any(character.isalpha() for character in token.text) and not token.phonemes:
                    missing_tokens.append(token.text)
        assert count > 0, identifier + ' empty synthesis'
    assert not missing_tokens, identifier + ' missing phonemes: ' + repr(missing_tokens)
    samples = np.concatenate(chunks)
    assert np.isfinite(samples).all() and np.max(np.abs(samples)) > 0.01
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64); encoder.set_in_sample_rate(RATE); encoder.set_channels(1); encoder.set_quality(2)
    mp3 = encoder.encode((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()) + encoder.flush()
    digest = sha(mp3)
    filename = f'{identifier}-{digest[:16]}.mp3'
    path = OUT / 'public/word-audio' / filename
    path.write_bytes(mp3)
    decoded, rate = sf.read(path)
    assert rate == RATE and decoded.ndim == 1 and np.isfinite(decoded).all()
    assert abs(len(decoded) / RATE - len(samples) / RATE) < 0.3
    middle = decoded[pause_start + RATE // 10:pause_start + RATE * 4 // 10]
    assert len(middle) == RATE * 3 // 10 and np.max(np.abs(middle)) < 0.001
    record = {'id': identifier, 'word': word['word'], 'level': word['level'], 'example': word['example'],
              'file': filename, 'sha256': digest, 'bytes': len(mp3), 'seconds': round(len(samples) / RATE, 4),
              'inputKey': key, 'segments': segments, 'pauseMs': PAUSE_MS, 'pauseStartSample': pause_start,
              'phonemes': phonemes, 'missingPhonemeTokens': missing_tokens,
              'pauseCentralPeak': float(np.max(np.abs(middle)))}
    temp = checkpoint.with_suffix('.tmp')
    temp.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(checkpoint)
    return record


def main(workers, threads, limit):
    vocabulary_path = ROOT / 'packages/core/src/assets/vocab.json'
    vocabulary = json.loads(vocabulary_path.read_text(encoding='utf-8'))
    assert len(vocabulary) == 3839 and all(word['example'].strip() for word in vocabulary)
    assert len({word['word'] for word in vocabulary}) == len(vocabulary)
    source = json.loads((CONTENT / 'model-provenance.json').read_text(encoding='utf-8'))
    for name, record in source['files'].items():
        assert sha((CACHE / Path(name).name).read_bytes()) == record['sha256']
    for folder in ('checkpoints', 'public/word-audio'):
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    selected = vocabulary[:limit] if limit else vocabulary
    start = time.monotonic()
    records, failures = {}, []
    last = start
    with ProcessPoolExecutor(max_workers=workers, initializer=initialize, initargs=(threads,)) as pool:
        jobs = {pool.submit(generate, word): word for word in selected}
        for job in as_completed(jobs):
            word = jobs[job]
            try:
                record = job.result()
                records[record['id']] = record
            except Exception as error:
                failures.append({'id': word['id'], 'word': word['word'], 'error': str(error)})
                print('FAILED', word['id'], word['word'], str(error), flush=True)
            now = time.monotonic()
            if now - last >= 15 or len(records) + len(failures) == len(selected):
                progress = {'completed': len(records), 'failed': len(failures), 'target': len(selected),
                            'elapsedSeconds': round(now - start, 1)}
                (OUT / 'progress.json').write_text(json.dumps(progress, indent=2) + '\n', encoding='utf-8')
                print(json.dumps(progress), flush=True)
                last = now
    report = {'created_date': '2026-10-26', 'config': config_key(), 'workers': workers, 'threadsPerWorker': threads,
              'target': len(selected), 'completed': len(records), 'failures': failures,
              'elapsedSeconds': round(time.monotonic() - start, 1), 'vocabularySha256': sha(vocabulary_path.read_bytes()),
              'generatorSha256': sha(Path(__file__).read_bytes()), 'listeningReview': 'sample-v2-approved; full-v3-not-listened',
              'deployment': 'not-performed'}
    (OUT / 'generation-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if failures:
        raise RuntimeError(f'{len(failures)} entries failed; checkpoints retained for retry')
    if not limit:
        ordered = {word['id']: records[word['id']] for word in vocabulary}
        (CONTENT / 'full-manifest.json').write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (CONTENT / 'full-generation-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--threads', type=int, default=1)
    parser.add_argument('--limit', type=int)
    args = parser.parse_args()
    assert 1 <= args.workers <= 6 and 1 <= args.threads <= 4
    main(args.workers, args.threads, args.limit)
