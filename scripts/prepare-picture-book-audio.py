"""Generate offline page narration, checkpoints and a listening gallery. Never deploys."""
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import shutil
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('word_audio_engine', ROOT / 'scripts/generate-all-word-audio.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


def initialize_worker(threads):
    engine.initialize(threads)
CONTENT = ROOT / 'content/picture-book-audio'
OUT = ROOT / 'artifacts/picture-book-audio'
SOURCES = ['content/beginner-poems/poems.json', 'content/intermediate-readings/books.json',
           'content/advanced-readings/books.json']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def pages():
    records = []
    for source in SOURCES:
        for book in json.loads((ROOT / source).read_text(encoding='utf-8')):
            if book['reviewStatus'] != 'approved':
                raise ValueError('Unapproved source: ' + book['id'])
            for number, page in enumerate(book.get('pages', [book]), 1):
                text = page.get('text', page.get('poem', ''))
                if not text.strip():
                    raise ValueError('Empty page: ' + book['id'])
                records.append({'id': f'{book["id"]}-{number:02}', 'bookId': book['id'],
                                'level': book['level'], 'page': number, 'bookTitle': book['title'],
                                'title': page['title'], 'text': text, 'source': source})
    if len({page['id'] for page in records}) != len(records):
        raise ValueError('Duplicate page IDs')
    return records


def configuration():
    return {**engine.config_key(), 'pauseMs': 0, 'wordCase': 'source', 'generatorVersion': 'picture-book-1',
            'narration': 'page body only; original line breaks; no added silence'}


def generate(page):
    import lameenc
    import numpy as np
    import soundfile as sf
    key = sha(json.dumps({'page': page, 'config': configuration()}, sort_keys=True).encode())
    checkpoint = OUT / 'checkpoints' / (page['id'] + '.json')
    if checkpoint.exists():
        old = json.loads(checkpoint.read_text(encoding='utf-8'))
        audio = OUT / 'public/picture-book-audio' / old['file']
        if old.get('inputKey') == key and audio.exists() and sha(audio.read_bytes()) == old['sha256']:
            return old
    chunks, phonemes, missing = [], [], []
    for result in engine.PIPELINE(page['text'], voice=engine.VOICE, speed=1):
        if result.audio is None or not result.phonemes:
            raise ValueError('Empty synthesis: ' + page['id'])
        chunks.append(result.audio.numpy())
        phonemes.append(result.phonemes)
        missing.extend(token.text for token in result.tokens or []
                       if any(c.isalpha() for c in token.text) and not token.phonemes)
    if not chunks or missing:
        raise ValueError('Missing audio/phonemes: ' + repr(missing))
    samples = np.concatenate(chunks)
    if not np.isfinite(samples).all() or np.max(np.abs(samples)) <= 0.01:
        raise ValueError('Invalid/silent PCM')
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(24000)
    encoder.set_channels(1)
    encoder.set_quality(2)
    mp3 = encoder.encode((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()) + encoder.flush()
    digest = sha(mp3)
    filename = f'{page["id"]}-{digest[:16]}.mp3'
    target = OUT / 'public/picture-book-audio' / filename
    target.write_bytes(mp3)
    decoded, rate = sf.read(target)
    if (rate != 24000 or decoded.ndim != 1 or not np.isfinite(decoded).all()
            or np.max(np.abs(decoded)) <= 0.01
            or abs(len(decoded) - len(samples)) / rate >= 0.3):
        raise ValueError('MP3 verification failed: ' + filename)
    record = {**page, 'file': filename, 'sha256': digest, 'textSha256': sha(page['text'].encode()),
              'bytes': len(mp3), 'seconds': round(len(decoded) / rate, 3), 'inputKey': key,
              'phonemes': phonemes, 'missingPhonemeTokens': missing}
    write_json(checkpoint, record)
    return record


def main(args):
    start = time.monotonic()
    provenance = json.loads((ROOT / 'content/word-audio/model-provenance.json').read_text(encoding='utf-8'))
    for name, item in provenance['files'].items():
        if sha((engine.CACHE / Path(name).name).read_bytes()) != item['sha256']:
            raise ValueError('Model provenance mismatch: ' + name)
    selected = pages()
    if args.limit:
        selected = selected[:args.limit]
    for folder in ['checkpoints', 'public/picture-book-audio']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    records = {}
    failures = []
    with ProcessPoolExecutor(max_workers=args.workers, initializer=initialize_worker, initargs=(1,)) as pool:
        jobs = {pool.submit(generate, page): page for page in selected}
        for job in as_completed(jobs):
            page = jobs[job]
            try:
                records[page['id']] = job.result()
            except Exception as error:
                failures.append({'id': page['id'], 'error': str(error)})
            print(f'{len(records)}/{len(selected)} completed; {len(failures)} failed', flush=True)
    report = {'date': datetime.now().astimezone().isoformat(), 'model': provenance,
              'config': configuration(), 'sourceSha256': {s: sha((ROOT / s).read_bytes()) for s in SOURCES},
              'generatorSha256': sha(Path(__file__).read_bytes()), 'completed': len(records),
              'target': len(selected), 'failures': failures, 'elapsedSeconds': round(time.monotonic() - start, 1),
              'listeningReview': 'pending', 'deviceReview': 'pending', 'deployment': 'not-performed'}
    write_json(OUT / 'generation-report.json', report)
    if failures:
        raise RuntimeError(repr(failures))
    ordered = [records[p['id']] for p in selected]
    report.update(totalBytes=sum(p['bytes'] for p in ordered), totalSeconds=sum(p['seconds'] for p in ordered))
    write_json(OUT / 'generation-report.json', report)
    public = OUT / 'public'
    write_json(public / 'picture-book-audio/manifest.json', ordered)
    cards = ''.join('<article><h2>' + html.escape(f'{p["level"]} · {p["bookTitle"]} · {p["page"]}')
                    + '</h2><p>' + html.escape(p['text']) + '</p><audio controls preload="none" src="picture-book-audio/'
                    + p['file'] + '"></audio></article>' for p in ordered)
    (public / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>그림책 영어 낭독</title>'
        '<style>body{font:16px/1.7 sans-serif;max-width:800px;margin:auto;padding:20px}p{white-space:pre-wrap}'
        'article{border-bottom:1px solid #ccc;padding:16px 0}audio{width:100%}</style>'
        '<h1>그림책 영어 낭독</h1><p>AI 생성 음성 · Kokoro af_heart · 본문만 낭독 · 청취 검수 대기</p>'
        + cards + '<p><a href="KOKORO-APACHE-2.0.txt">Kokoro 라이선스</a></p>'
        '<script>document.addEventListener("play",e=>document.querySelectorAll("audio").forEach(a=>{'
        'if(a!==e.target)a.pause()}),true);document.addEventListener("visibilitychange",()=>{'
        'if(document.hidden)document.querySelectorAll("audio").forEach(a=>a.pause())});</script></html>', encoding='utf-8')
    shutil.copyfile(ROOT / 'content/word-audio/KOKORO-APACHE-2.0.txt', public / 'KOKORO-APACHE-2.0.txt')
    (public / '_headers').write_text('/picture-book-audio/*\n  Access-Control-Allow-Origin: *\n'
        '/picture-book-audio/*.mp3\n  Cache-Control: public, max-age=31536000, immutable\n', encoding='utf-8')
    if not args.limit:
        write_json(CONTENT / 'manifest.json', ordered)
        write_json(CONTENT / 'generation-report.json', report)
    with zipfile.ZipFile(OUT.with_suffix('.zip'), 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(public.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(public))
    print(json.dumps({k: report[k] for k in ['completed', 'totalBytes', 'totalSeconds', 'elapsedSeconds']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, choices=range(1, 7), default=4)
    parser.add_argument('--limit', type=int)
    arguments = parser.parse_args()
    if arguments.limit is not None and arguments.limit < 1:
        parser.error('--limit must be positive')
    main(arguments)
