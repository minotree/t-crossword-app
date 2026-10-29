"""Download unmodified Adobe Source Serif fonts and their OFL notice from a pinned commit."""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/fonts/source-serif'


def fetch(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read()


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request('https://api.github.com/repos/adobe-fonts/source-serif/commits/release',
                                     headers={'User-Agent': 'picture-book-font-preparation'})
    with urllib.request.urlopen(request, timeout=60) as response:
        revision = json.load(response)['sha']
    records = {}
    for source in ['OTF/SourceSerif4-Regular.otf', 'OTF/SourceSerif4-Semibold.otf', 'LICENSE.md']:
        url = f'https://raw.githubusercontent.com/adobe-fonts/source-serif/{revision}/{source}'
        data = fetch(url)
        name = Path(source).name
        (DEST / name).write_bytes(data)
        records[name] = {'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    (DEST / 'provenance.json').write_text(json.dumps({'date': '2026-10-29', 'revision': revision,
        'license': 'SIL Open Font License 1.1', 'modifiedFont': False, 'files': records}, indent=2) + '\n', encoding='utf-8')
    print('Downloaded Source Serif 4 Regular/Semibold and OFL license:', revision)


if __name__ == '__main__':
    main()
