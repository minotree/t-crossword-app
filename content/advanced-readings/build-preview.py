"""Validate local reading cards and build a review gallery."""
import html
import json
from pathlib import Path

from PIL import Image, ImageDraw
from validate import audit

ROOT = Path(__file__).resolve().parent
audit()
books = json.loads((ROOT / 'books.json').read_text(encoding='utf-8'))
cards = []
all_pages = []
for book in books:
    cards.append(f'<section><h2>{html.escape(book["koreanTitle"])} · {len(book["pages"])}장</h2><div class="cards">')
    for number, page in enumerate(book['pages'], 1):
        path = ROOT / page['image']
        with Image.open(path) as image:
            image.verify()
        record = ROOT / 'generation-records' / f'{path.stem}.json'
        evidence = json.loads(record.read_text(encoding='utf-8'))
        assert evidence['target'] == page['image']
        assert evidence['bookId'] == book['id'] and evidence['page'] == number
        assert evidence['prompt'] and evidence['tool'] in ('ImageGen', 'Pillow typography reflow')
        if evidence['tool'] == 'Pillow typography reflow':
            import hashlib
            original_record = ROOT.parents[1] / evidence['originalGenerationRecord']
            assert original_record.resolve().is_relative_to(ROOT.resolve())
            assert hashlib.sha256(original_record.read_bytes()).hexdigest() == evidence['originalGenerationRecordSha256']
            assert evidence['renderedText'] == page['text']
        creation_prompt = evidence.get('creationPrompt', evidence['prompt'])
        assert any(page['text'] in prompt for prompt in (creation_prompt, evidence['prompt']))
        assert book['title'] in creation_prompt
        cards.append(f'<article><a href="{page["image"]}"><img loading="lazy" src="{page["image"]}" alt="{html.escape(page["title"])}"></a>'
                     f'<details><summary>{number} / {len(book["pages"])} · 해석 및 원문</summary>'
                     f'<p lang="ko">{html.escape(page["translation"])}</p><p lang="en">{html.escape(page["text"])}</p></details></article>')
        all_pages.append((f'{book["id"]}-{number:02}', path))
    cards.append('</div></section>')
prefix = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>고급 그림책</title><style>body{margin:24px;background:#f4f1e9;color:#233045;font-family:system-ui,sans-serif}section{max-width:1400px;margin:32px auto}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}article{background:white;border-radius:16px;overflow:hidden}img{width:100%;display:block}details{padding:16px}summary{cursor:pointer}p{white-space:pre-line;line-height:1.9}</style>''' + f'<h1>고급 그림책 · {len(books)}편 {len(all_pages)}장</h1><p>성인용 시·창작 에세이·SF·현실 미스터리·법정 드라마. AI 활용 창작 콘텐츠. 작품별 검토 상태는 원본 데이터와 검토 보고서 참조.</p>'
(ROOT / 'index.html').write_text(prefix + ''.join(cards) + '</html>\n', encoding='utf-8')
overview = Image.new('RGB', (1600, ((len(all_pages) + 3) // 4) * 520), '#f4f1e9')
for i, (label, path) in enumerate(all_pages):
    with Image.open(path) as source:
        image = source.convert('RGB')
        image.thumbnail((380, 480))
        x, y = (i % 4) * 400, (i // 4) * 520
        overview.paste(image, (x, y + 24))
        ImageDraw.Draw(overview).text((x + 5, y + 5), label, fill='#233045')
overview.save(ROOT / 'overview.jpg')
for group in range((len(all_pages) + 3) // 4):
    sheet = Image.new('RGB', (2048, 800), '#eeeeee')
    for i, (label, path) in enumerate(all_pages[group * 4:group * 4 + 4]):
        with Image.open(path) as source:
            image = source.convert('RGB')
            image.thumbnail((500, 760))
            sheet.paste(image, (i * 512, 30))
            ImageDraw.Draw(sheet).text((i * 512 + 8, 8), label, fill='black')
    sheet.save(ROOT / f'review-{group + 1}.jpg')
print(f'PASS: {len(all_pages)} referenced PNG files and generation records; preview gallery built.')
