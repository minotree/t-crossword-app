"""Separate age-impression audition; never replaces full narration or deploys."""
import argparse
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import shutil
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/picture-book-voice-preview'
CACHE = ROOT / 'artifacts/tts-cache'
REVISION = json.loads((ROOT / 'content/word-audio/model-provenance.json').read_text(encoding='utf-8'))['revision']
# These are audition candidates, not age-certified child/teen voices.
VOICES = {'af_sky': 'c799548a', 'af_bella': '8cb64e02'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main(download):
    if download:
        for voice, prefix in VOICES.items():
            url = f'https://huggingface.co/hexgrad/Kokoro-82M/resolve/{REVISION}/voices/{voice}.pt'
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read()
            if not sha(data).startswith(prefix):
                raise ValueError('Official voice hash mismatch: ' + voice)
            (CACHE / f'{voice}.pt').write_bytes(data)
        return
    import torch
    spec = importlib.util.spec_from_file_location('picture_audio', ROOT / 'scripts/prepare-picture-book-audio.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.OUT = OUT
    for folder in ['checkpoints', 'public/picture-book-audio']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    module.initialize_worker(1)
    original_config = module.configuration
    records = []
    for level in ['beginner', 'intermediate']:
        page = next(p for p in module.pages() if p['level'] == level)
        for voice in ['af_sky', 'af_bella', 'af_heart']:
            voice_path = CACHE / f'{voice}.pt'
            digest = sha(voice_path.read_bytes())
            if voice in VOICES and not digest.startswith(VOICES[voice]):
                raise ValueError('Voice hash mismatch: ' + voice)
            module.engine.VOICE = torch.load(voice_path, weights_only=True, map_location='cpu')
            module.configuration = lambda v=voice, d=digest: {**original_config(), 'voice': v, 'voiceSha256': d}
            record = module.generate({**page, 'id': page['id'] + '-' + voice})
            record.update(voice=voice, voiceSha256=digest,
                          voiceSource=f'https://huggingface.co/hexgrad/Kokoro-82M/blob/{REVISION}/voices/{voice}.pt',
                          ageImpressionReview='pending; not an age-certified voice')
            records.append(record)
            print(level, voice, record['seconds'], flush=True)
    public = OUT / 'public'
    cards = ''.join(f'<article><h2>{html.escape(r["level"])} · {r["voice"]}</h2>'
                    f'<p>{html.escape(r["text"])}</p><audio controls preload="none" '
                    f'src="picture-book-audio/{r["file"]}"></audio></article>' for r in records)
    (public / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>연령 느낌 음성 비교</title>'
        '<style>body{max-width:800px;margin:auto;padding:20px;font:16px/1.7 sans-serif}'
        'p{white-space:pre-wrap}audio{width:100%}article{border-bottom:1px solid #ccc;padding:12px}</style>'
        '<h1>어린이·청소년 느낌 음성 후보</h1><p>AI 합성 음성. 실제 어린이·청소년 성우로 확인된 음성은 아닙니다. '
        'sky·bella와 현재 heart를 같은 본문으로 비교합니다. 고급과 기존 전체 음성은 유지했습니다.</p>'
        + cards + '<script>document.addEventListener("play",e=>document.querySelectorAll("audio").forEach(a=>{'
        'if(a!==e.target)a.pause()}),true);document.addEventListener("visibilitychange",()=>{'
        'if(document.hidden)document.querySelectorAll("audio").forEach(a=>a.pause())});</script></html>', encoding='utf-8')
    shutil.copyfile(ROOT / 'content/word-audio/KOKORO-APACHE-2.0.txt', public / 'KOKORO-APACHE-2.0.txt')
    module.write_json(ROOT / 'content/picture-book-audio/voice-audition.json',
                      {'date': '2026-10-29', 'purpose': 'child/teen impression audition; not selected',
                       'modelRevision': REVISION, 'pitchShift': 'none', 'speed': 1,
                       'generatorSha256': sha(Path(__file__).read_bytes()), 'records': records})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    main(parser.parse_args().download)
