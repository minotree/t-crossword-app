"""Create a reproducible local Kokoro sample and a Cloudflare static-assets folder.

Run --download once with network access, then generate offline. No deployment.
"""
import argparse
import hashlib
import html
import importlib.metadata
import json
from pathlib import Path
import shutil
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'artifacts/tts-cache'
CONTENT = ROOT / 'content/word-audio'
OUT = ROOT / 'artifacts/toss-word-audio-preview'
SAMPLES = ['YOU', 'SEA', 'SAME', 'APPLE', 'SCIENCE', 'KNOWLEDGE', 'ENVIRONMENT', 'ABSTRACTION', 'CORRELATION', 'EPISTEMOLOGY']


def digest(data):
    return hashlib.sha256(data).hexdigest()


def download():
    from huggingface_hub import HfApi, hf_hub_download
    CACHE.mkdir(parents=True, exist_ok=True)
    CONTENT.mkdir(parents=True, exist_ok=True)
    revision = HfApi().model_info('hexgrad/Kokoro-82M').sha
    records = {}
    for name in ('config.json', 'kokoro-v1_0.pth', 'voices/af_heart.pt', 'README.md', 'VOICES.md'):
        source = Path(hf_hub_download('hexgrad/Kokoro-82M', name, revision=revision, cache_dir=str(CACHE / 'hf')))
        target = CACHE / Path(name).name
        shutil.copyfile(source, target)
        records[name] = {'sha256': digest(target.read_bytes()), 'bytes': target.stat().st_size}
        if name.endswith('.md'):
            shutil.copyfile(target, CONTENT / ('kokoro-' + name))
    assert records['kokoro-v1_0.pth']['sha256'] == '496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4'
    with urllib.request.urlopen('https://raw.githubusercontent.com/hexgrad/kokoro/main/LICENSE', timeout=30) as response:
        (CONTENT / 'KOKORO-APACHE-2.0.txt').write_bytes(response.read())
    (CONTENT / 'model-provenance.json').write_text(json.dumps({'repo': 'hexgrad/Kokoro-82M', 'revision': revision, 'voice': 'af_heart', 'files': records}, indent=2) + '\n', encoding='utf-8')
    print('Model, voice, source documentation and license downloaded.', flush=True)


def generate():
    import lameenc
    import numpy as np
    import torch
    from kokoro import KModel, KPipeline
    provenance = json.loads((CONTENT / 'model-provenance.json').read_text(encoding='utf-8'))
    for name, record in provenance['files'].items():
        assert digest((CACHE / Path(name).name).read_bytes()) == record['sha256']
    torch.set_num_threads(4)
    model = KModel(repo_id='hexgrad/Kokoro-82M', config=str(CACHE / 'config.json'), model=str(CACHE / 'kokoro-v1_0.pth')).eval()
    pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', model=model, device='cpu')
    voice = torch.load(CACHE / 'af_heart.pt', weights_only=True, map_location='cpu')
    vocabulary = json.loads((ROOT / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    selected = [next(word for word in vocabulary if word['word'] == name) for name in SAMPLES]
    public = OUT / 'public'
    audio_dir = public / 'word-audio'
    audio_dir.mkdir(parents=True, exist_ok=True)
    manifest = {}
    start = time.monotonic()
    for word in selected:
        # Dictionary headwords are uppercase UI labels; normal case avoids spelling them as acronyms.
        text = word['word'].lower() + '. ' + word['example']
        text_hash = digest(text.encode('utf-8'))
        chunks = []
        phonemes = []
        for result in pipeline(text, voice=voice, speed=1):
            assert result.audio is not None and result.phonemes
            chunks.append(result.audio.numpy())
            phonemes.append(result.phonemes)
        samples = np.concatenate(chunks)
        assert np.isfinite(samples).all() and np.max(np.abs(samples)) > 0.01
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(64)
        encoder.set_in_sample_rate(24000)
        encoder.set_channels(1)
        encoder.set_quality(2)
        mp3 = encoder.encode((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()) + encoder.flush()
        filename = f'{word["id"]}-{digest(mp3)[:16]}.mp3'
        (audio_dir / filename).write_bytes(mp3)
        manifest[word['id']] = {'word': word['word'], 'example': word['example'], 'file': filename,
                                'sha256': digest(mp3), 'textSha256': text_hash, 'seconds': round(len(samples) / 24000, 3),
                                'bytes': len(mp3), 'phonemes': phonemes}
        print(word['word'], len(mp3), 'bytes', flush=True)
    CONTENT.mkdir(parents=True, exist_ok=True)
    (CONTENT / 'sample-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    app_manifest = {key: {field: value for field, value in record.items() if field in ('word', 'example', 'file')} for key, record in manifest.items()}
    (ROOT / 'apps/toss/src/data/word-audio.json').write_text(json.dumps(app_manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    sizes = [record['bytes'] for record in manifest.values()]
    report = {'created_date': '2026-10-26', 'model': provenance, 'kokoro_version': importlib.metadata.version('kokoro'),
              'voice': 'af_heart', 'language': 'en-US', 'sampleRate': 24000, 'bitrateKbps': 64, 'channels': 1,
              'words': len(manifest), 'totalBytes': sum(sizes), 'meanBytes': round(sum(sizes) / len(sizes)),
              'estimated3839Bytes': round(sum(sizes) / len(sizes) * 3839), 'generationSeconds': round(time.monotonic() - start, 2),
              'listening_review': 'pending', 'device_review': 'pending', 'script_sha256': digest(Path(__file__).read_bytes())}
    (CONTENT / 'sample-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(CONTENT / 'KOKORO-APACHE-2.0.txt', public / 'KOKORO-APACHE-2.0.txt')
    (public / '_headers').write_text('/word-audio/*\n  Cache-Control: public, max-age=31536000, immutable\n  Access-Control-Allow-Origin: *\n  X-Content-Type-Options: nosniff\n', encoding='utf-8')
    cards = ''.join(f'<article><h2>{html.escape(record["word"])}</h2><p>{html.escape(record["example"])}</p><audio controls preload="none" src="word-audio/{record["file"]}"></audio><button type="button" onclick="playSample(this,1)">듣기</button><button type="button" onclick="playSample(this,0.7)">느리게</button></article>' for record in manifest.values())
    script = '<script>function playSample(button,rate){const audio=button.parentElement.querySelector("audio");audio.playbackRate=rate;audio.preservesPitch=true;audio.play().catch(()=>alert("재생하지 못했습니다. 다시 눌러 주세요."));}document.addEventListener("play",event=>{document.querySelectorAll("audio").forEach(audio=>{if(audio!==event.target)audio.pause();});},true);document.addEventListener("visibilitychange",()=>{if(document.hidden)document.querySelectorAll("audio").forEach(audio=>audio.pause());});</script>'
    (public / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>영어 낱말 음성 표본</title><style>body{font:16px/1.6 sans-serif;max-width:720px;margin:auto;padding:20px}article{border-bottom:1px solid #ddd;padding:12px 0}audio{max-width:100%}button{padding:12px}</style><h1>영어 낱말 음성 표본 10개</h1><p>AI 생성 음성 · Kokoro v1.0 / af_heart · 청취 검수 대기</p>' + cards + '<p><a href="KOKORO-APACHE-2.0.txt">Kokoro Apache-2.0 고지</a></p>' + script + '</html>', encoding='utf-8')
    (OUT / 'wrangler.jsonc').write_text(json.dumps({'name': 'crossword-word-audio', 'compatibility_date': '2026-10-26', 'assets': {'directory': './public'}}, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key != 'model'}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    if args.download:
        download()
    else:
        generate()
