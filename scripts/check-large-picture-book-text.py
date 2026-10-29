"""Verify reviewed typography against the pre-change backup and app assets."""
import hashlib
import json
from pathlib import Path
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/picture-book-large-text-2026-10-29'
sha = lambda data: hashlib.sha256(data).hexdigest()
report = json.loads((DEST / 'render-report.json').read_text(encoding='utf-8'))
review = json.loads((DEST / 'visual-review.json').read_text(encoding='utf-8'))
assert review['renderReportSha256'] == sha((DEST / 'render-report.json').read_bytes())
assert set(review['reviewedIds']) == {r['id'] for r in report['records']}
assert len(report['records']) == 74
with zipfile.ZipFile(ROOT / 'artifacts/picture-book-layout-backup-20261029/before.zip') as backup:
    for level in ['intermediate', 'advanced']:
        name = f'content/{level}-readings/books.json'
        before = json.loads(backup.read(name))
        current = json.loads((ROOT / name).read_text(encoding='utf-8'))
        comparable = json.loads(json.dumps(current))
        for old, new in zip(before, comparable, strict=True):
            for old_page, new_page in zip(old['pages'], new['pages'], strict=True):
                new_page['image'] = old_page['image']
        assert before == comparable, 'Only image paths may change'
    for name in backup.namelist():
        if '/public/picture-books/beginner-' in name:
            assert (ROOT / name).read_bytes() == backup.read(name), name
    for row in report['records']:
        assert sha(backup.read(row['originalImage'])) == row['originalSha256']
        assert sha((ROOT / row['originalImage']).read_bytes()) == row['originalSha256']
        assert sha((ROOT / row['image']).read_bytes()) == row['sha256']
        body = [word for line in row['renderedLines'] if line['role'] == 'body' for word in line['text'].split()]
        assert body == row['sourceText'].split()
        with Image.open(ROOT / row['image']) as image, Image.open(ROOT / row['originalImage']) as old:
            crop = (0, 0, 1024, row['artCropBottom'])
            assert image.convert('RGB').crop(crop).tobytes() == old.convert('RGB').crop(crop).tobytes()
            assert image.size == (1024, row['height'])
            for line in row['renderedLines']:
                x1, y1, x2, y2 = line['bbox']
                assert 0 <= x1 < x2 <= image.width and 0 <= y1 < y2 <= image.height
            if row.get('pageNumberPosition') == 'header-right':
                counter = next(line for line in row['renderedLines'] if line['role'] == 'page-number')
                body = [line for line in row['renderedLines'] if line['role'] == 'body']
                assert counter['bbox'][0] > 800 and counter['bbox'][3] < body[0]['bbox'][1]
                with Image.open(ROOT / row['previousImage']) as previous:
                    assert sha((ROOT / row['previousImage']).read_bytes()) == row['previousSha256']
                    for line in body:
                        box = tuple(line['bbox'])
                        assert previous.convert('RGB').crop(box).tobytes() == image.convert('RGB').crop(box).tobytes()
            for app in ['web', 'toss', 'mobile']:
                number = f"{row['page']:02}" if app == 'web' else str(row['page'])
                target = ROOT / f"apps/{app}/public/picture-books/{row['bookId']}-{number}.webp"
                with Image.open(target) as prepared:
                    assert prepared.size == image.size, str(target)
                    prepared.load()
print('PASS: 74 reviewed pages; source text/metadata and artwork preserved; 222 app images retain full resolution; beginner assets unchanged.')
