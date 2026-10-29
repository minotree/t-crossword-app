"""Clone approved synthetic voices into page narration. Local artifacts only; never deploys."""
import argparse
from datetime import datetime
import hashlib
import html
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/picture-book-audio'
OUT = ROOT / 'artifacts/picture-book-audio-qwen'
CACHE = ROOT / 'artifacts/qwen-tts-cache'
MODEL = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'
spec = importlib.util.spec_from_file_location('picture_audio', ROOT / 'scripts/prepare-picture-book-audio.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)


def sha(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def write(path, value):
    original.write_json(path, value)


def references():
    target = CONTENT / 'references'
    target.mkdir(exist_ok=True)
    settings = {
        'beginner': {
            'sourceFile': 'audio_12.wav',
            'text': 'Little bird, sing with me. Come and play under the sky.',
            'designPrompt': 'A youthful voice around 12 years old with a low-mid speaking pitch and a soft, grounded tone. Read clear American English slowly, like a student calmly reading aloud in a quiet classroom. Use restrained emotion, minimal pitch variation, and natural pauses between sentences. Avoid a cute, squeaky, breathy, high-pitched, cheerful, or cartoon-like voice.'},
        'intermediate': {
            'sourceFile': 'audio_17.wav',
            'text': 'The garden does not keep a clock. One flower opens; others wait. Beneath the soil, a quiet root can grow without a single cheer.',
            'designPrompt': 'A natural youthful voice around 16 to 17 years old, with a comfortable low-mid speaking pitch and a clear, grounded tone. Read American English calmly, like a college student thoughtfully reading a story aloud. Speak at a relaxed, moderately slow pace, with natural pauses between phrases and sentences. Use subtle expression and restrained emotion. Avoid a high-pitched, squeaky, overly cheerful, theatrical, or sing-song delivery. Sound youthful rather than like a mature adult announcer.'}}
    for level, record in settings.items():
        source = Path('D:/Download') / record['sourceFile']
        destination = target / f'{level}.wav'
        if destination.exists() and sha(destination) != sha(source):
            raise ValueError('Reference would be overwritten: ' + level)
        shutil.copyfile(source, destination)
        record.update(file=f'references/{level}.wav', sha256=sha(destination),
                      origin='user-generated Qwen3-TTS VoiceDesign; user approved in conversation',
                      transcriptSource='test text supplied in conversation; listening verification pending')
    write(CONTENT / 'selected-voices.json', {'date': '2026-10-29', 'voices': settings,
                                            'advanced': 'existing Kokoro af_heart unchanged'})


def download():
    from huggingface_hub import HfApi, snapshot_download
    info = HfApi().model_info(MODEL)
    destination = CACHE / 'base'
    snapshot_download(MODEL, revision=info.sha, local_dir=destination)
    files = {str(p.relative_to(destination)).replace('\\', '/'): sha(p)
             for p in destination.rglob('*') if p.is_file() and '.cache' not in p.parts}
    write(CONTENT / 'qwen-model-provenance.json', {'repo': MODEL, 'revision': info.sha, 'files': files})
    with urllib.request.urlopen('https://raw.githubusercontent.com/QwenLM/Qwen3-TTS/main/LICENSE', timeout=30) as response:
        (CONTENT / 'QWEN-APACHE-2.0.txt').write_bytes(response.read())
    print('Base model downloaded and hashes recorded', flush=True)


def encode(wav, mp3):
    # Keep the already installed Kokoro/lameenc environment separate from Qwen dependencies.
    subprocess.run([str(ROOT / 'artifacts/tts-venv/Scripts/python.exe'),
                    str(ROOT / 'scripts/encode-picture-book-mp3.py'), str(wav), str(mp3)], check=True)


def package(records, report):
    public = OUT / 'public'
    audio_dir = public / 'picture-book-audio'
    for record in records:
        if record['level'] == 'advanced':
            source = ROOT / 'artifacts/picture-book-audio/public/picture-book-audio' / record['file']
            if sha(source) != record['sha256']:
                raise ValueError('Original advanced MP3 mismatch')
            shutil.copyfile(source, audio_dir / record['file'])
    write(public / 'picture-book-audio/manifest.json', records)
    cards = ''.join(f'<article><h2>{html.escape(r["level"])} · {html.escape(r["bookTitle"])} · {r["page"]}</h2>'
                    f'<p>{html.escape(r["text"])}</p><audio controls preload="none" '
                    f'src="picture-book-audio/{r["file"]}"></audio></article>' for r in records)
    (public / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>그림책 영어 낭독 · 연령별 음성</title>'
        '<style>body{max-width:800px;margin:auto;padding:20px;font:16px/1.7 sans-serif}'
        'p{white-space:pre-wrap}audio{width:100%}article{border-bottom:1px solid #ccc;padding:12px}</style>'
        '<h1>그림책 영어 낭독 · 연령별 음성</h1><p>AI 합성 음성 · 초급/중급 Qwen · 고급 Kokoro af_heart · 전체 청취 검수 대기</p>'
        + cards + '<p><a href="QWEN-APACHE-2.0.txt">Qwen 라이선스</a> · '
        '<a href="KOKORO-APACHE-2.0.txt">Kokoro 라이선스</a></p>'
        '<script>document.addEventListener("play",e=>document.querySelectorAll("audio").forEach(a=>{'
        'if(a!==e.target)a.pause()}),true);document.addEventListener("visibilitychange",()=>{'
        'if(document.hidden)document.querySelectorAll("audio").forEach(a=>a.pause())});</script></html>', encoding='utf-8')
    shutil.copyfile(CONTENT / 'QWEN-APACHE-2.0.txt', public / 'QWEN-APACHE-2.0.txt')
    shutil.copyfile(ROOT / 'content/word-audio/KOKORO-APACHE-2.0.txt', public / 'KOKORO-APACHE-2.0.txt')
    (public / '_headers').write_text('/picture-book-audio/*\n  Access-Control-Allow-Origin: *\n'
        '/picture-book-audio/*.mp3\n  Cache-Control: public, max-age=31536000, immutable\n', encoding='utf-8')
    with zipfile.ZipFile(OUT.with_suffix('.zip'), 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(public.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(public))
    write(OUT / 'generation-report.json', report)


def main(args):
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['NUMBA_CACHE_DIR'] = str(ROOT / 'artifacts/qwen-tts-cache/numba')
    print('IMPORTING Qwen runtime', flush=True)
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel
    print('VERIFYING model files', flush=True)
    torch.set_num_threads(args.threads)
    start = time.monotonic()
    provenance = json.loads((CONTENT / 'qwen-model-provenance.json').read_text(encoding='utf-8'))
    for name, digest in provenance['files'].items():
        if sha(CACHE / 'base' / name) != digest:
            raise ValueError('Model file mismatch: ' + name)
    selected = json.loads((CONTENT / 'selected-voices.json').read_text(encoding='utf-8'))['voices']
    source_pages = original.pages()
    jobs = [page for page in source_pages if page['level'] != 'advanced']
    if args.limit:
        jobs = jobs[:args.limit]
    for folder in ['checkpoints', 'wav', 'public/picture-book-audio']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    model = None
    prompts = {}
    records = {}
    config = {'model': MODEL, 'modelRevision': provenance['revision'], 'device': 'cpu', 'dtype': 'float32',
              'attention': 'sdpa', 'language': 'English', 'seed': 20261029, 'maxNewTokens': 4096,
              'generatorVersion': 1, 'qwenTtsVersion': importlib.metadata.version('qwen-tts'),
              'torchVersion': torch.__version__, 'sampleRate': 24000, 'bitrateKbps': 64}
    for page in jobs:
        voice = selected[page['level']]
        ref_path = CONTENT / voice['file']
        if sha(ref_path) != voice['sha256']:
            raise ValueError('Reference hash mismatch')
        input_key = hashlib.sha256(json.dumps({'page': page, 'config': config, 'reference': voice},
                                             sort_keys=True).encode()).hexdigest()
        checkpoint = OUT / 'checkpoints' / (page['id'] + '.json')
        if checkpoint.exists():
            old = json.loads(checkpoint.read_text(encoding='utf-8'))
            path = OUT / 'public/picture-book-audio' / old['file']
            if old.get('inputKey') == input_key and path.exists() and sha(path) == old['sha256']:
                records[page['id']] = old
                print('REUSED', page['id'], flush=True)
                continue
        if model is None:
            print('LOADING model on CPU', flush=True)
            model = Qwen3TTSModel.from_pretrained(str(CACHE / 'base'), device_map='cpu',
                                                dtype=torch.float32, attn_implementation='sdpa')
        if page['level'] not in prompts:
            print('ENCODING reference', page['level'], flush=True)
            prompts[page['level']] = model.create_voice_clone_prompt(ref_audio=str(ref_path),
                                      ref_text=voice['text'], x_vector_only_mode=False)
        torch.manual_seed(config['seed'])
        tick = time.monotonic()
        print('GENERATING', page['id'], flush=True)
        waves, rate = model.generate_voice_clone(text=page['text'], language='English',
                            voice_clone_prompt=prompts[page['level']], non_streaming_mode=True,
                            max_new_tokens=config['maxNewTokens'])
        samples = waves[0]
        if not np.isfinite(samples).all() or len(samples) == 0 or np.max(np.abs(samples)) <= 0.01:
            raise ValueError('Empty/invalid synthesis')
        wav = OUT / 'wav' / (page['id'] + '.wav')
        sf.write(wav, samples, rate, subtype='PCM_16')
        temporary = OUT / 'wav' / (page['id'] + '.mp3')
        encode(wav, temporary)
        digest = sha(temporary)
        filename = f'{page["id"]}-{digest[:16]}.mp3'
        destination = OUT / 'public/picture-book-audio' / filename
        shutil.copyfile(temporary, destination)
        decoded, decoded_rate = sf.read(destination)
        if (decoded_rate != 24000 or decoded.ndim != 1 or not np.isfinite(decoded).all()
                or np.max(np.abs(decoded)) <= 0.01
                or abs(len(decoded) / decoded_rate - len(samples) / rate) >= 0.3):
            raise ValueError('MP3 verification failed')
        record = {**page, 'file': filename, 'sha256': digest, 'bytes': destination.stat().st_size,
                  'textSha256': hashlib.sha256(page['text'].encode()).hexdigest(),
                  'seconds': round(len(decoded) / decoded_rate, 3), 'inputKey': input_key,
                  'engine': 'Qwen3-TTS-1.7B-Base', 'referenceSha256': voice['sha256'],
                  'referenceText': voice['text'], 'generationSeconds': round(time.monotonic() - tick, 2),
                  'contentListeningReview': 'pending', 'speakerConsistencyReview': 'pending'}
        write(checkpoint, record)
        records[page['id']] = record
        write(OUT / 'progress.json', {'completed': len(records), 'target': len(jobs), 'lastPage': page['id']})
        print('DONE', page['id'], record['seconds'], 'audio seconds;', record['generationSeconds'], 'wall seconds', flush=True)
    report = {'date': datetime.now().astimezone().isoformat(), 'config': config,
              'generatorSha256': sha(Path(__file__)),
              'sourceSha256': {s: sha(ROOT / s) for s in original.SOURCES},
              'completedQwenPages': len(records), 'elapsedSeconds': round(time.monotonic() - start, 2),
              'listeningReview': 'pending', 'deviceReview': 'pending', 'deployment': 'not-performed'}
    if args.limit:
        package(list(records.values()), report)
    else:
        old = json.loads((CONTENT / 'manifest.json').read_text(encoding='utf-8'))
        advanced = {r['id']: r for r in old if r['level'] == 'advanced'}
        for page in source_pages:
            if page['level'] == 'advanced' and advanced[page['id']]['text'] != page['text']:
                raise ValueError('Advanced source changed; cannot reuse original narration')
        ordered = [records.get(p['id']) or advanced[p['id']] for p in source_pages]
        report.update(pages=len(ordered), totalBytes=sum(r['bytes'] for r in ordered),
                      totalSeconds=round(sum(r['seconds'] for r in ordered), 3))
        package(ordered, report)
        write(CONTENT / 'qwen-manifest.json', ordered)
        write(CONTENT / 'qwen-generation-report.json', report)
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--references', action='store_true')
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--threads', type=int, choices=range(1, 13), default=6)
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error('--limit must be positive')
    if args.references:
        references()
    elif args.download:
        download()
    else:
        main(args)
