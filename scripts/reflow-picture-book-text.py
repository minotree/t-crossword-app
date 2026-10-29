"""Deterministic larger-type cards using preserved original art. Stage first, activate after visual review."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import shutil
import zipfile
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/picture-book-large-text-2026-10-29'
REVIEW = ROOT / 'content/picture-book-layout-review-2026-10-29/review.json'
FONT = ROOT / 'content/fonts/source-serif'
BACKUP = ROOT / 'artifacts/picture-book-layout-backup-20261029'
WIDTH, MARGIN, BODY_SIZE, LINE = 1024, 56, 64, 88
INK, PAPER = '#15263e', '#fff9ee'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def wrap(text, font):
    lines, current = [], ''
    for word in text.split():
        candidate = current + (' ' if current else '') + word
        if font.getlength(candidate) > WIDTH - MARGIN * 2:
            if not current:
                raise ValueError('Single word exceeds panel width: ' + word)
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def boundary(image, record):
    estimate = record['boundaryApproxY']
    if record['panelClass'] == 'feathered-edge':
        return estimate + 24  # preserve the paint fringe and some blank paper, before the old title
    grey = image.convert('L')
    scores = []
    for y in range(estimate - 28, estimate + 29):
        above = sum(grey.crop((0, y - 2, WIDTH, y)).getdata()) / (WIDTH * 2)
        below = sum(grey.crop((0, y, WIDTH, y + 2)).getdata()) / (WIDTH * 2)
        scores.append((below - above, y))
    return max(scores)[1]


def stage():
    if (DEST / 'render-report.json').exists():
        raise ValueError('Staged revision already exists; refusing to replace reviewed artifacts')
    assert (BACKUP / 'before.zip').exists(), 'Create backup first'
    old = json.loads(REVIEW.read_text(encoding='utf-8'))
    fonts = json.loads((FONT / 'provenance.json').read_text(encoding='utf-8'))
    for name, item in fonts['files'].items():
        assert sha(FONT / name) == item['sha256']
    regular = ImageFont.truetype(str(FONT / 'SourceSerif4-Regular.otf'), BODY_SIZE)
    heading = ImageFont.truetype(str(FONT / 'SourceSerif4-Semibold.otf'), 64)
    subheading = ImageFont.truetype(str(FONT / 'SourceSerif4-Regular.otf'), 48)
    footer = ImageFont.truetype(str(FONT / 'SourceSerif4-Regular.otf'), 38)
    books = {}
    for level in ['intermediate', 'advanced']:
        for book in json.loads((ROOT / f'content/{level}-readings/books.json').read_text(encoding='utf-8')):
            books[book['id']] = book
    rendered, cards = [], []
    for item in old['records']:
        book = books[item['bookId']]
        page = book['pages'][item['page'] - 1]
        source = ROOT / item['image']
        assert sha(source) == item['sha256']
        assert hashlib.sha256(page['text'].encode()).hexdigest() == item['sourceTextSha256']
        with Image.open(source) as image:
            image = image.convert('RGB')
            cut = boundary(image, item)
            art = image.crop((0, 0, WIDTH, cut))
        placed, y = [], cut + 36

        def add(text, font, role, spacing):
            nonlocal y
            for line in wrap(text, font):
                placed.append((line, font, role, MARGIN, y))
                y += spacing

        add(book['title'], heading, 'title', 82)
        if page['title'] != book['title']:
            y += 10
            add(page['title'], subheading, 'page-title', 66)
        y += 36
        for paragraph in page['text'].split('\n'):
            if paragraph.strip():
                add(paragraph, regular, 'body', LINE)
            else:
                y += 40
        y += 24
        add(f'{item["page"]} / {len(book["pages"])}', footer, 'page-number', 54)
        output = Image.new('RGB', (WIDTH, y + 36), PAPER)
        output.paste(art, (0, 0))
        draw = ImageDraw.Draw(output)
        boxes = []
        for text, font, role, x, top in placed:
            box = draw.textbbox((x, top), text, font=font, anchor='lt')
            assert box[0] >= 0 and box[2] <= WIDTH - MARGIN + 2 and box[3] < output.height
            draw.text((x, top), text, font=font, fill=INK, anchor='lt')
            boxes.append({'role': role, 'text': text, 'bbox': list(box)})
        assert [w for row in boxes if row['role'] == 'body' for w in row['text'].split()] == page['text'].split()
        assert output.crop((0, 0, WIDTH, cut)).tobytes() == art.tobytes()
        target = source.parent / f'{item["id"]}-large-text-v1.png'
        if target.exists():
            raise ValueError('Version path exists: ' + str(target))
        output.save(target)
        record = {**item, 'originalImage': item['image'], 'originalSha256': item['sha256'],
                  'image': target.relative_to(ROOT).as_posix(), 'sha256': sha(target),
                  'width': WIDTH, 'height': output.height, 'artCropBottom': cut,
                  'artPreservedPixelExact': True, 'bodyFontPx': BODY_SIZE, 'bodyLinePx': LINE,
                  'renderedLines': boxes, 'sourceText': page['text'], 'visualReview': 'pending'}
        rendered.append(record)
        cards.append(f'<article id="{item["id"]}"><h2>{item["id"]}</h2><div class="compare">'
            f'<div><h3>이전</h3><img loading="lazy" src="../../{item["image"]}" alt="이전 {item["id"]}"></div>'
            f'<div><h3>확대</h3><img loading="lazy" src="../../{record["image"]}" alt="확대 {item["id"]}"></div></div>'
            f'<details><summary>영어 원문</summary><p>{html.escape(page["text"])}</p></details></article>')
    write(DEST / 'render-report.json', {'date': '2026-10-29', 'tool': 'Python/Pillow deterministic typography',
          'generatorSha256': sha(Path(__file__)), 'fontProvenance': fonts, 'bodyFontPx': BODY_SIZE,
          'bodyLinePx': LINE, 'originalSourceHashes': old['sourceSha256'], 'imageGenerationCalls': 0,
          'records': rendered})
    (DEST / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>그림책 큰 본문 비교</title>'
        '<style>body{font:16px/1.6 sans-serif;max-width:1200px;margin:auto;padding:20px}'
        '.compare{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}img{width:100%;height:auto}'
        'article{margin:32px 0}p{white-space:pre-wrap}@media(max-width:600px){.compare{grid-template-columns:1fr}}</style>'
        '<h1>중급·고급 본문 확대 · 74장 비교</h1><p>기존 삽화 보존 · 본문 64px · 원문/페이지 수 유지 · AI 재생성 없음</p>'
        + ''.join(cards) + '</html>', encoding='utf-8')
    print('STAGED', len(rendered), 'cards; height range', min(r['height'] for r in rendered), max(r['height'] for r in rendered))


def activate():
    report = json.loads((DEST / 'render-report.json').read_text(encoding='utf-8'))
    visual = json.loads((DEST / 'visual-review.json').read_text(encoding='utf-8'))
    assert len(visual['reviewedIds']) == 74 and set(visual['reviewedIds']) == {r['id'] for r in report['records']}
    assert visual['renderReportSha256'] == sha(DEST / 'render-report.json')
    current = {level: json.loads((ROOT / f'content/{level}-readings/books.json').read_text(encoding='utf-8'))
               for level in ['intermediate', 'advanced']}
    # Preflight everything before changing any source links.
    for r in report['records']:
        assert sha(ROOT / r['image']) == r['sha256'] and sha(ROOT / r['originalImage']) == r['originalSha256']
        book = next(b for b in current[r['level']] if b['id'] == r['bookId'])
        page = book['pages'][r['page'] - 1]
        assert page['text'] == r['sourceText']
        assert page['image'] == str(Path(r['originalImage']).relative_to(f'content/{r["level"]}-readings')).replace('\\', '/')
    for r in report['records']:
        directory = ROOT / f'content/{r["level"]}-readings'
        book = next(b for b in current[r['level']] if b['id'] == r['bookId'])
        page = book['pages'][r['page'] - 1]
        old_record = directory / 'generation-records' / (f'{r["id"]}.json' if r['level'] == 'intermediate'
                                                        else Path(r['originalImage']).stem + '.json')
        original_record = old_record
        if r['level'] == 'intermediate':
            original_record = directory / 'generation-records/revisions/before-large-text-20261029' / old_record.name
            original_record.parent.mkdir(parents=True, exist_ok=True)
            if original_record.exists():
                raise ValueError('History exists; refusing to replace')
            shutil.copyfile(old_record, original_record)
        old = json.loads(original_record.read_text(encoding='utf-8'))
        page['image'] = Path(r['image']).relative_to(f'content/{r["level"]}-readings').as_posix()
        record = {**old, 'target': page['image'], 'tool': 'Pillow typography reflow', 'model': 'not applicable',
                  'renderedText': page['text'], 'originalGenerationRecord': original_record.relative_to(ROOT).as_posix(),
                  'originalGenerationRecordSha256': sha(original_record),
                  'originalImage': r['originalImage'], 'originalImageSha256': r['originalSha256'],
                  'postProcessing': {'date': '2026-10-29', 'method': 'preserved art + new larger text panel',
                                     'bodyFontPx': BODY_SIZE, 'linePx': LINE, 'artCropBottom': r['artCropBottom'],
                                     'imageGenerationCalls': 0, 'evidence': 'content/picture-book-large-text-2026-10-29/visual-review.json'}}
        record_path = old_record if r['level'] == 'intermediate' else directory / 'generation-records' / (Path(page['image']).stem + '.json')
        write(record_path, record)
    for level, books in current.items():
        write(ROOT / f'content/{level}-readings/books.json', books)
    print('Activated 74 larger-text cards; approval hashes must be updated from visual review before app preparation')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['stage', 'activate'])
    stage() if parser.parse_args().action == 'stage' else activate()
