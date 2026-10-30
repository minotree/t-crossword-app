"""Prepend matching-voice page titles to existing narration; package locally, never upload."""
import argparse
from datetime import datetime
import hashlib
import importlib.util
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/picture-book-audio'
OUT = ROOT / 'artifacts/picture-book-title-audio'
BASE = ROOT / 'artifacts/crossword-content-audio-with-chants-v2/public'
RATE = 24000


def sha(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def load(name):
    spec = importlib.util.spec_from_file_location('title_' + name.replace('-', '_'), ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pages():
    current = load('prepare-picture-book-audio').pages()
    old = {p['id']: p for p in json.loads((CONTENT / 'qwen-manifest.json').read_text(encoding='utf-8'))}
    if set(old) != {p['id'] for p in current}:
        raise ValueError('Source page IDs changed')
    for page in current:
        for key in ['text', 'title', 'bookTitle', 'level', 'page']:
            if page[key] != old[page['id']][key]:
                raise ValueError('Source changed: ' + page['id'] + ' ' + key)
        if sha(BASE / 'picture-book-audio' / old[page['id']]['file']) != old[page['id']]['sha256']:
            raise ValueError('Body audio hash mismatch: ' + page['id'])
    return current, old


def title_text(page):
    # Read the work title on entry, then distinct page headings; avoid duplicate titles.
    titles = [page['title']]
    if page['page'] == 1 and page['bookTitle'] != page['title']:
        titles.insert(0, page['bookTitle'])
    return '\n'.join(title.rstrip('.!?') + '.' for title in titles)


def generate(engine, limit):
    import numpy as np
    import soundfile as sf
    selected, _ = pages()
    jobs = [p for p in selected if (p['level'] == 'advanced') == (engine == 'kokoro')]
    if limit:
        jobs = jobs[:limit]
    runtime = None
    prompts = {}
    references = json.loads((CONTENT / 'selected-voices.json').read_text(encoding='utf-8'))['voices']
    provenance = json.loads((CONTENT / 'qwen-model-provenance.json').read_text(encoding='utf-8'))
    for page in jobs:
        text = title_text(page)
        voice = references.get(page['level'])
        config = {'text': text, 'engine': engine, 'seed': 20261031, 'version': 1,
                  'voice': voice if engine == 'qwen' else load('generate-all-word-audio').config_key(),
                  'revision': provenance['revision'] if engine == 'qwen' else None}
        if engine == 'kokoro':
            config['runtimeVersions'] = {name: importlib.metadata.version(name) for name in
                ['kokoro', 'misaki', 'spacy', 'thinc', 'blis', 'torch', 'numpy', 'en_core_web_sm']}
        key = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
        checkpoint = OUT / 'titles' / (page['id'] + '.json')
        wav = checkpoint.with_suffix('.wav')
        if checkpoint.exists() and wav.exists():
            old = json.loads(checkpoint.read_text(encoding='utf-8'))
            if old['inputKey'] == key and old['sha256'] == sha(wav):
                print('REUSED', page['id'], flush=True)
                continue
        tick = time.monotonic()
        if engine == 'qwen':
            import torch
            if runtime is None:
                os.environ['HF_HUB_OFFLINE'] = '1'
                os.environ['NUMBA_CACHE_DIR'] = str(ROOT / 'artifacts/qwen-tts-cache/numba')
                from qwen_tts import Qwen3TTSModel
                for name, digest in provenance['files'].items():
                    if sha(ROOT / 'artifacts/qwen-tts-cache/base' / name) != digest:
                        raise ValueError('Model hash mismatch: ' + name)
                torch.set_num_threads(6)
                runtime = Qwen3TTSModel.from_pretrained(str(ROOT / 'artifacts/qwen-tts-cache/base'),
                    device_map='cpu', dtype=torch.float32, attn_implementation='sdpa')
            if sha(CONTENT / voice['file']) != voice['sha256']:
                raise ValueError('Reference mismatch')
            if page['level'] not in prompts:
                prompts[page['level']] = runtime.create_voice_clone_prompt(ref_audio=str(CONTENT / voice['file']),
                    ref_text=voice['text'], x_vector_only_mode=False)
            torch.manual_seed(config['seed'])
            waves, rate = runtime.generate_voice_clone(text=text, language='English',
                voice_clone_prompt=prompts[page['level']], non_streaming_mode=True, max_new_tokens=512)
            samples = waves[0]
        else:
            if runtime is None:
                runtime = load('generate-all-word-audio')
                provenance_k = json.loads((ROOT / 'content/word-audio/model-provenance.json').read_text(encoding='utf-8'))
                for name, item in provenance_k['files'].items():
                    if sha(runtime.CACHE / Path(name).name) != item['sha256']:
                        raise ValueError('Kokoro model hash mismatch')
                runtime.initialize(2)
            chunks = []
            for result in runtime.PIPELINE(text, voice=runtime.VOICE, speed=1):
                if result.audio is None or not result.phonemes or any(
                    any(c.isalpha() for c in token.text) and not token.phonemes for token in result.tokens or []):
                    raise ValueError('Missing title phonemes: ' + page['id'])
                chunks.append(result.audio.numpy())
            samples, rate = np.concatenate(chunks), RATE
        if rate != RATE or not len(samples) or not np.isfinite(samples).all() or np.max(np.abs(samples)) <= .01:
            raise ValueError('Invalid title synthesis: ' + page['id'])
        wav.parent.mkdir(parents=True, exist_ok=True)
        sf.write(wav, samples, RATE, subtype='PCM_16')
        write(checkpoint, {'id': page['id'], 'text': text, 'config': config, 'inputKey': key,
              'sha256': sha(wav), 'seconds': len(samples) / RATE,
              'generatedAt': datetime.now().astimezone().isoformat(), 'listeningReview': 'pending'})
        print('DONE', page['id'], round(time.monotonic() - tick, 1), flush=True)


def package(defer_advanced=False, limit=None):
    import numpy as np
    import soundfile as sf
    selected, bodies = pages()
    if limit:
        selected = selected[:limit]
    records = []
    # Retain all deployed narration, chants and encouragement assets for older clients.
    destination = OUT / 'sample' if limit else OUT
    public = destination / 'public'
    shutil.copytree(BASE, public, dirs_exist_ok=True)
    encoder = load('encode-picture-book-mp3')
    for page in selected:
        if defer_advanced and page['level'] == 'advanced':
            records.append(bodies[page['id']])
            continue
        checkpoint = OUT / 'titles' / (page['id'] + '.json')
        title = json.loads(checkpoint.read_text(encoding='utf-8'))
        if title['text'] != title_text(page) or sha(checkpoint.with_suffix('.wav')) != title['sha256']:
            raise ValueError('Title checkpoint mismatch: ' + page['id'])
        first, rate = sf.read(checkpoint.with_suffix('.wav'), dtype='float32')
        body = bodies[page['id']]
        rest, body_rate = sf.read(BASE / 'picture-book-audio' / body['file'], dtype='float32')
        assert rate == body_rate == RATE and first.ndim == rest.ndim == 1
        audio = np.concatenate([first, np.zeros(RATE // 2, dtype=np.float32), rest])
        wav = destination / 'combined.wav'
        sf.write(wav, audio, RATE, subtype='PCM_16')
        mp3 = destination / 'combined.mp3'
        encoder.main(wav, mp3)
        digest = sha(mp3)
        filename = f'{page["id"]}-{digest[:16]}.mp3'
        target = public / 'picture-book-audio' / filename
        shutil.copyfile(mp3, target)
        decoded, decoded_rate = sf.read(target)
        assert decoded_rate == RATE and decoded.ndim == 1 and np.isfinite(decoded).all()
        assert abs(len(decoded) / RATE - len(audio) / RATE) < .3
        # MP3 introduces encoder delay; check the central part of the explicit pause.
        gap = decoded[len(first) + RATE // 5:len(first) + RATE * 2 // 5]
        assert len(gap) == RATE // 5 and np.max(np.abs(gap)) < .001
        records.append({**body, 'file': filename, 'sha256': digest, 'bytes': target.stat().st_size,
            'inputKey': hashlib.sha256((title['inputKey'] + body['sha256'] + ':pause500:v1').encode()).hexdigest(),
            'seconds': round(len(decoded) / RATE, 3), 'narration': 'title-then-body',
            'spokenTitle': title['text'], 'titleAudioSha256': title['sha256'], 'bodyAudioSha256': body['sha256'],
            'pauseMs': 500, 'pauseStartSample': len(first), 'titleGeneration': title,
            'contentListeningReview': 'pending', 'speakerConsistencyReview': 'pending'})
    write(public / 'picture-book-audio/manifest.json', records)
    # The old gallery referenced body-only MP3s; provide an explicit title-version gallery.
    import html
    cards = ''.join('<article><h2>' + html.escape(r['bookTitle'] + ' / ' + r['title']) + '</h2><p>' +
        html.escape(r.get('spokenTitle', '[Body only; title pending]') + '\n\n' + r['text']) + '</p><audio controls preload="none" src="picture-book-audio/' +
        r['file'] + '"></audio></article>' for r in records)
    (public / 'title-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>Title narration review</title>'
        '<style>body{max-width:800px;margin:auto;font:16px/1.6 sans-serif}p{white-space:pre-wrap}audio{width:100%}</style>' + cards +
        '<script>document.addEventListener("play",e=>document.querySelectorAll("audio").forEach(a=>{if(a!==e.target)a.pause()}),true)</script>', encoding='utf-8')
    retained = [p for p in BASE.rglob('*') if p.is_file() and p.relative_to(BASE).as_posix() != 'picture-book-audio/manifest.json']
    for path in retained:
        assert sha(path) == sha(public / path.relative_to(BASE)), 'Old asset changed'
    report = {'date': datetime.now().astimezone().isoformat(), 'pages': len(records),
        'titlePages': sum(r.get('narration') == 'title-then-body' for r in records),
        'deferredAdvancedPages': sum(r['level'] == 'advanced' for r in records) if defer_advanced else 0,
        'generatorSha256': sha(Path(__file__)), 'retainedFiles': len(retained),
        'sourceSha256': {p['source']: sha(ROOT / p['source']) for p in selected},
        'previousManifestSha256': sha(BASE / 'picture-book-audio/manifest.json'),
        'validation': 'source/title/body hashes, MP3 decode, 500ms pause, retained assets passed',
        'listeningReview': 'pending', 'deviceReview': 'pending', 'deployment': 'not-performed'}
    target = destination.with_suffix('.zip')
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(public.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(public))
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        for path in public.rglob('*'):
            if path.is_file():
                assert hashlib.sha256(archive.read(path.relative_to(public).as_posix())).hexdigest() == sha(path)
    report.update(zipValidation='all file bytes and CRC passed', zipSha256=sha(target), zipBytes=target.stat().st_size)
    if not limit:
        write(CONTENT / 'title-manifest.json', records)
        write(CONTENT / 'title-generation-report.json', report)
    write(destination / 'validation.json', report)
    print(json.dumps(report), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', choices=['qwen', 'kokoro', 'package', 'all'], default='all')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--defer-advanced', action='store_true', help='Keep advanced body-only narration unchanged')
    parser.add_argument('--kokoro-python', default=str(ROOT / 'artifacts/kokoro-title-runtime/Scripts/python.exe'),
                        help='Python in the working Kokoro environment for the all-engine job')
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error('--limit must be positive')
    if args.engine == 'all':
        if args.limit:
            parser.error('--limit requires a specific engine')
        OUT.mkdir(parents=True, exist_ok=True)
        steps = [(ROOT / '../qwen3-tts/.venv/Scripts/python.exe', 'qwen')]
        if not args.defer_advanced:
            steps.append((Path(args.kokoro_python), 'kokoro'))
        steps.append((ROOT / 'artifacts/tts-venv/Scripts/python.exe', 'package'))
        for executable, engine in steps:
            command = [str(executable), '-u', str(Path(__file__)), '--engine', engine]
            if args.defer_advanced:
                command.append('--defer-advanced')
            subprocess.run(command, check=True)
    elif args.engine == 'package':
        package(args.defer_advanced, args.limit)
    else:
        generate(args.engine, args.limit)


if __name__ == '__main__':
    main()
