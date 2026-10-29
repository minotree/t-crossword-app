"""Validate fixed visual-review evidence against current sources, without approving new images."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'content/picture-book-layout-review-2026-10-29'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    review = json.loads((REPORT / 'review.json').read_text(encoding='utf-8'))
    expected = {}
    for filename, digest in review['sourceSha256'].items():
        source = ROOT / filename
        assert sha(source) == digest, f'Source changed; review required: {filename}'
        for book in json.loads(source.read_text(encoding='utf-8')):
            for number, page in enumerate(book['pages'], 1):
                expected[f'{book["id"]}-{number:02}'] = (source.parent / page['image'], page['text'])
    records = review['records']
    assert len(records) == len(expected) == review['pages'] == 74
    assert len({r['id'] for r in records}) == 74
    assert {r['id'] for r in records} == set(expected)
    gallery = (REPORT / 'index.html').read_text(encoding='utf-8')
    for record in records:
        path, text = expected[record['id']]
        assert path == ROOT / record['image']
        assert sha(path) == record['sha256'], f'Image changed; visual review required: {path}'
        assert hashlib.sha256(text.encode()).hexdigest() == record['sourceTextSha256']
        with Image.open(path) as image:
            assert image.size == (record['width'], record['height']) == (1024, 1536)
            image.verify()
        assert record['visualReview'] == 'inspected individually with view_image'
        assert f'id="{record["id"]}"' in gallery
        assert f'../../{record["image"]}' in gallery
        assert 0 < record['boundaryApproxY'] < record['height']
    for kind, count in review['counts'].items():
        assert sum(r['panelClass'] == kind for r in records) == count
    print('PASS: 74 source/image hashes, image dimensions, unique page IDs and gallery references; no new visual approval')


if __name__ == '__main__':
    main()
