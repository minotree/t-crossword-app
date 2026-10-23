import io
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
total = edited = 0
for directory, source, target in (
    ('beginner-poems', 'poems.json', 'picture-books.json'),
    ('intermediate-readings', 'books.json', 'intermediate-books.json'),
    ('advanced-readings', 'books.json', 'advanced-books.json'),
):
    base = root / 'content' / directory
    originals = json.loads((base / source).read_text(encoding='utf-8'))
    web = json.loads((root / 'apps/web/src/data' / target).read_text(encoding='utf-8'))
    assert len(originals) == len(web)
    for book, generated in zip(originals, web):
        assert book['id'] == generated['id']
        for key in ('title', 'level', 'koreanTitle'):
            if key in book: assert book[key] == generated[key]
        pages = book.get('pages', [book])
        web_pages = generated.get('pages', [generated])
        assert len(pages) == len(web_pages)
        for page, web_page in zip(pages, web_pages):
            total += 1
            for key in ('title', 'translation', 'text' if 'pages' in book else 'poem'):
                assert page[key] == web_page[key]
            public = root / 'apps/web/public' / web_page['image']
            dist = root / 'apps/web/dist' / web_page['image']
            assert public.read_bytes() == dist.read_bytes()
            # Newly edited cards must reproduce the deployed WebP, not just exist.
            if '-v' in page['image'] and (base / page['image']).stem in {
                Path(job['target']).stem for job in json.loads((root / 'tmp/picture-book-edit-jobs.json').read_text(encoding='utf-8'))
            }:
                with Image.open(base / page['image']) as image:
                    image = image.convert('RGB')
                    image.thumbnail((1024, 1536))
                    buffer = io.BytesIO()
                    image.save(buffer, 'WEBP', quality=85, method=6)
                    assert public.read_bytes() == buffer.getvalue(), page['image']
                edited += 1
assert total == 119 and edited == 16
print(f'PASS: {total} source/web/dist pages; {edited} edited PNG-to-WebP conversions.')
