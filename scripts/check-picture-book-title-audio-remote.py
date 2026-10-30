"""Verify deployed title narration and retained assets; never changes Cloudflare."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'artifacts/picture-book-title-audio/public'
spec = importlib.util.spec_from_file_location('remote_audio', ROOT / 'scripts/check-content-audio-remote.py')
remote = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remote)


def main():
    manifest = json.loads((PUBLIC / 'picture-book-audio/manifest.json').read_text(encoding='utf-8'))
    assert len(manifest) == 119 and all(p.get('narration') == 'title-then-body' for p in manifest)
    files = [(p.relative_to(PUBLIC).as_posix(), {'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
             for p in sorted(PUBLIC.rglob('*')) if p.is_file() and p.name != '_headers']
    def verify(item):
        try:
            return remote.verify(item)
        except Exception as error:
            return {'file': item[0], 'error': str(error)}
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(verify, files))
    failures = [r for r in results if 'error' in r]
    report = {'date': datetime.now().astimezone().isoformat(), 'baseUrl': remote.BASE,
              'state': 'failed' if failures else 'passed', 'files': results,
              'titlePages': len(manifest), 'mp3Count': sum(name.endswith('.mp3') for name, _ in files),
              'failedFiles': len(failures),
              'checks': 'HTTP 200; all bytes/hash; MP3 MIME/CORS/immutable; manifest CORS',
              'listeningReview': 'pending', 'deviceReview': 'pending'}
    (ROOT / 'content/picture-book-audio/title-remote-validation.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{report["state"]}: {len(files)} public files; {report["mp3Count"]} MP3s; {len(failures)} failures', flush=True)
    if failures:
        for failure in failures[:5]:
            print(failure, flush=True)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
