"""Prepare mobile-owned images from approved content originals (requires Pillow)."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'apps/mobile/public/picture-books'
DATA = ROOT / 'apps/mobile/src/data'
DEST.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)
manifest = {}
for level, directory, filename in [
    ('beginner', 'beginner-poems', 'poems.json'),
    ('intermediate', 'intermediate-readings', 'books.json'),
    ('advanced', 'advanced-readings', 'books.json'),
]:
    source = ROOT / 'content' / directory
    for book in json.loads((source / filename).read_text(encoding='utf-8')):
        if book.get('reviewStatus') != 'approved':
            continue
        pages = [book] if level == 'beginner' else book['pages']
        for index, page in enumerate(pages, 1):
            original = (source / page['image']).resolve()
            if not original.is_relative_to(source.resolve()):
                raise ValueError('Image outside content directory')
            name = f"{book['id']}-{index}.webp"
            target = DEST / name
            with Image.open(original) as image:
                image = ImageOps.exif_transpose(image).convert('RGB')
                image.thumbnail((1200, 1600), Image.Resampling.LANCZOS)
                image.save(target, 'WEBP', quality=85, method=6)
            manifest[name] = {
                'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                'webpSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            }
(DATA / 'picture-book-images.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Mobile images prepared: {len(manifest)}. Run check-mobile-picture-books.mjs to verify approvals.')
