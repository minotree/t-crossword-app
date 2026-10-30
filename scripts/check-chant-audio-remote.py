"""Verify the user-deployed static package against the local candidate."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'artifacts/crossword-content-audio-with-chants-v2/public'
BASE = 'https://crossword-content-audio.minotree0902.workers.dev/'


def check(path):
    name = path.relative_to(PUBLIC).as_posix()
    request = urllib.request.Request(BASE + name, headers={
        'Origin': 'https://example.com', 'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
        actual = hashlib.sha256(data).hexdigest()
        expected = hashlib.sha256(path.read_bytes()).hexdigest()
        if response.status != 200 or actual != expected:
            raise ValueError(f'{name}: HTTP or bytes differ')
        if name.endswith('.mp3'):
            if response.headers.get_content_type() not in ('audio/mpeg', 'audio/mp3'):
                raise ValueError(f'{name}: unexpected MIME')
            if response.headers.get('Access-Control-Allow-Origin') != '*' or 'immutable' not in response.headers.get('Cache-Control', ''):
                raise ValueError(f'{name}: CORS or cache mismatch')
        if name.endswith('/manifest.json') and response.headers.get('Access-Control-Allow-Origin') != '*':
            raise ValueError(f'{name}: manifest CORS mismatch')
        return {'file': name, 'bytes': len(data), 'sha256': actual}


def main():
    files = sorted(p for p in PUBLIC.rglob('*') if p.is_file() and p.name != '_headers')
    if len(files) != 221:
        raise ValueError(f'Expected 221 public files, found {len(files)}')
    with ThreadPoolExecutor(max_workers=6) as pool:
        result = list(pool.map(check, files))
    mp3s = sum(x['file'].endswith('.mp3') for x in result)
    if mp3s != 214:
        raise ValueError(f'Expected 214 MP3s, got {mp3s}')
    output = ROOT / 'artifacts/crossword-content-audio-with-chants-v2/remote-validation.json'
    output.write_text(json.dumps({'date': '2026-10-30', 'base': BASE, 'files': result,
                                 'listeningReview': 'pending', 'deviceReview': 'pending'},
                                 indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'PASS: {len(result)} files; {mp3s} MP3s; HTTP, SHA-256, MIME, CORS and cache')


if __name__ == '__main__':
    main()
