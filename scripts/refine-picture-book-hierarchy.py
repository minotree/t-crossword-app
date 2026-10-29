"""Create v2 typography: title 88 > subtitle 72 > body 64. Preserve v1."""
import copy
import hashlib
import html
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/picture-book-large-text-2026-10-29'
spec = importlib.util.spec_from_file_location('layout', ROOT / 'scripts/reflow-picture-book-text.py')
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
write = layout.write

def stage():
    previous = DEST / 'render-report.json'
    assert not (DEST / 'render-report-v2.json').exists(), 'Version already exists'
    report = json.loads(previous.read_text(encoding='utf-8'))
    fonts = [ImageFont.truetype(str(layout.FONT / name), size) for name, size in [
        ('SourceSerif4-Semibold.otf', 88), ('SourceSerif4-Semibold.otf', 72),
        ('SourceSerif4-Regular.otf', 64), ('SourceSerif4-Regular.otf', 38)]]
    books = {b['id']: b for level in ['intermediate', 'advanced'] for b in json.loads(
        (ROOT / f'content/{level}-readings/books.json').read_text(encoding='utf-8'))}
    cards = []
    for row in report['records']:
        book = books[row['bookId']]
        page = book['pages'][row['page']-1]
        source = ROOT / row['image']
        assert sha(source) == row['sha256']
        y = row['artCropBottom'] + 36
        lines = []
        def add(text, font, role, spacing):
            nonlocal y
            for line in layout.wrap(text, font):
                lines.append((line, font, role, y))
                y += spacing
        add(book['title'], fonts[0], 'title', 108)
        if page['title'] != book['title']:
            y += 18
            add(page['title'], fonts[1], 'page-title', 94)
        y += 36
        for paragraph in page['text'].split('\n'):
            if paragraph.strip(): add(paragraph, fonts[2], 'body', 88)
            else: y += 40
        y += 24
        add(f"{row['page']} / {len(book['pages'])}", fonts[3], 'page-number', 54)
        image = Image.new('RGB', (1024, y+36), layout.PAPER)
        with Image.open(source) as original:
            image.paste(original.crop((0, 0, 1024, row['artCropBottom'])), (0, 0))
        draw = ImageDraw.Draw(image)
        boxes = []
        for text, font, role, top in lines:
            box = draw.textbbox((56, top), text, font=font, anchor='lt')
            assert 0 <= box[0] < box[2] <= 968 and box[3] < image.height
            draw.text((56, top), text, font=font, fill=layout.INK, anchor='lt')
            boxes.append({'role': role, 'text': text, 'bbox': list(box)})
        assert [w for l in boxes if l['role']=='body' for w in l['text'].split()] == page['text'].split()
        target = source.with_name(source.name.replace('-v1.png', '-v2.png'))
        assert not target.exists()
        image.save(target)
        row.update(previousImage=row['image'], previousSha256=row['sha256'], image=target.relative_to(ROOT).as_posix(),
                   sha256=sha(target), height=image.height, renderedLines=boxes, titleFontPx=88, subtitleFontPx=72)
        cards.append(f'<article><h2>{row["id"]}</h2><div class="compare"><img loading="lazy" src="../../{row["originalImage"]}"><img loading="lazy" src="../../{row["image"]}"></div></article>')
    report.update(titleFontPx=88, subtitleFontPx=72, generatorSha256=sha(Path(__file__)), hierarchyRevisionDate='2026-10-30')
    write(DEST / 'render-report-v2.json', report)
    (DEST / 'index-v2.html').write_text('<!doctype html><meta charset="utf-8"><title>Picture book typography v2</title><style>body{max-width:1200px;margin:auto}.compare{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%}</style><h1>Title 88 / Subtitle 72 / Body 64</h1>'+''.join(cards),encoding='utf-8')
    print('Staged 74 v2 cards')

def activate():
    report = json.loads((DEST / 'render-report-v2.json').read_text(encoding='utf-8'))
    for level in ['intermediate','advanced']:
        path = ROOT / f'content/{level}-readings/books.json'
        books = json.loads(path.read_text(encoding='utf-8'))
        for row in [r for r in report['records'] if r['level']==level]:
            book = next(b for b in books if b['id']==row['bookId'])
            page = book['pages'][row['page']-1]
            assert page['image'] == str(Path(row['previousImage']).relative_to(f'content/{level}-readings')).replace('\\','/')
            assert sha(ROOT / row['image']) == row['sha256']
            records = ROOT / f'content/{level}-readings/generation-records'
            old_path = records / (f"{row['id']}.json" if level=='intermediate' else Path(row['previousImage']).stem+'.json')
            old = json.loads(old_path.read_text(encoding='utf-8'))
            if level=='intermediate':
                history = records/'revisions/before-hierarchy-20261030'/old_path.name
                assert not history.exists()
                write(history, old)
            page['image'] = Path(row['image']).relative_to(f'content/{level}-readings').as_posix()
            old['target'] = page['image']
            old['postProcessing'].update(titleFontPx=88,subtitleFontPx=72,hierarchyRevisionDate='2026-10-30')
            write(old_path if level=='intermediate' else records/(Path(page['image']).stem+'.json'),old)
        write(path,books)
    for name in ['render-report.json','visual-review.json','index.html']:
        original = DEST/name
        archive = DEST/(original.stem+'-v1'+original.suffix)
        assert not archive.exists()
        archive.write_bytes(original.read_bytes())
    write(DEST/'render-report.json',report)
    (DEST/'index.html').write_bytes((DEST/'index-v2.html').read_bytes())
    write(DEST/'visual-review.json',{'date':'2026-10-30','renderReportSha256':sha(DEST/'render-report.json'),
        'reviewedIds':[r['id'] for r in report['records']],
        'method':'Deterministic hierarchy change; bounding boxes and exact text verified on all 74; representative visual inspection',
        'titleFontPx':88,'subtitleFontPx':72,'bodyFontPx':64,'actualDeviceReview':False})
    print('Activated hierarchy v2')

if __name__=='__main__':
    import sys
    stage() if sys.argv[1]=='stage' else activate()
