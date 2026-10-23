"""Prepare web-owned picture-book metadata and compressed assets from content drafts.

Run from the repository root: python scripts/prepare-picture-books.py
Requires Pillow. Does not change the original content or its rights review status.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'content/beginner-poems'
DESTINATION = ROOT / 'apps/web/public/picture-books'
DATA = ROOT / 'apps/web/src/data/picture-books.json'

DESTINATION.mkdir(parents=True, exist_ok=True)
DATA.parent.mkdir(parents=True, exist_ok=True)
books = []


def prepare_image(source, filename):
    destination = DESTINATION / filename
    if not destination.exists() or destination.stat().st_mtime < source.stat().st_mtime:
        with Image.open(source) as image:
            image = image.convert('RGB')
            image.thumbnail((1024, 1536))
            image.save(destination, 'WEBP', quality=85, method=6)
    return 'picture-books/' + filename


for poem in json.loads((SOURCE / 'poems.json').read_text(encoding='utf-8')):
    filename = poem['id'] + '.webp'
    books.append({key: poem[key] for key in ('id', 'level', 'title', 'koreanTitle', 'poem', 'translation')}
                 | {'image': prepare_image(SOURCE / poem['image'], filename)})
DATA.write_text(json.dumps(books, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
counts = {'beginner': len(books)}
for level in ('intermediate', 'advanced'):
    source = ROOT / f'content/{level}-readings'
    readings = []
    for book in json.loads((source / 'books.json').read_text(encoding='utf-8')):
        pages = []
        for number, page in enumerate(book['pages'], 1):
            filename = f'{book["id"]}-{number:02}.webp'
            pages.append({key: page[key] for key in ('title', 'text', 'translation')}
                         | {'image': prepare_image(source / page['image'], filename)})
        readings.append({key: book[key] for key in ('id', 'level', 'genre', 'title', 'koreanTitle')}
                        | {'subgenre': book.get('subgenre'), 'pages': pages})
    (DATA.parent / f'{level}-books.json').write_text(json.dumps(readings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    counts[level] = len(readings)
print(f'Prepared {counts}, {sum(p.stat().st_size for p in DESTINATION.glob("*.webp")) / 1024 / 1024:.1f} MiB')
