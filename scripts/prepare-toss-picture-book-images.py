"""Prepare committed Toss WebP assets from approved content (Python/Pillow).

Normal Toss builds validate these files using Node; they do not require Python.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'apps/toss/public/picture-books'
MANIFEST = ROOT / 'apps/toss/src/data/picture-book-images.json'
images = {}
DEST.mkdir(parents=True, exist_ok=True)
for level, directory, filename in (
    ('beginner', 'beginner-poems', 'poems.json'),
    ('intermediate', 'intermediate-readings', 'books.json'),
    ('advanced', 'advanced-readings', 'books.json'),
):
    source = ROOT / 'content' / directory
    for book in json.loads((source / filename).read_text(encoding='utf-8')):
        if book['reviewStatus'] != 'approved':
            continue
        for number, page in enumerate(book.get('pages', [book]), 1):
            original = (source / page['image']).resolve()
            assert original.is_relative_to(source.resolve())
            name = f'{book["id"]}-{number}.webp'
            destination = DEST / name
            with Image.open(original) as image:
                image = image.convert('RGB')
                height_limit = max(1536, image.height) if original.stem.endswith(('-large-text-v1', '-large-text-v2', '-large-text-v3')) else 1536
                image.thumbnail((1024, height_limit))
                image.save(destination, 'WEBP', quality=85, method=6)
            images[name] = {
                'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                'webpSha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
            }
MANIFEST.parent.mkdir(parents=True, exist_ok=True)
MANIFEST.write_text(json.dumps(images, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(images)} Toss WebP images, '
      f'{sum((DEST / name).stat().st_size for name in images) / 1024 / 1024:.1f} MiB')
