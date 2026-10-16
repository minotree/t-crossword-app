"""Validate content, then rebuild the local gallery and coverage report."""
import html
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent


def tokens(text):
    return set(re.findall(r'[a-z]+(?:-[a-z]+)*', text.lower()))


def main():
    poems = json.loads((ROOT / 'poems.json').read_text(encoding='utf-8'))
    vocab = json.loads((REPO / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    known = {w['word'].lower() for w in vocab if w['level'] == 'beginner'}
    records = json.loads((ROOT / 'generation-record.json').read_text(encoding='utf-8'))
    assert len(poems) == 45
    assert len({p['id'] for p in poems}) == len(poems)
    assert len(records) == len(poems)
    assert len({r['id'] for r in records}) == len(records)
    assert {p['id'] for p in poems} == {r['id'] for r in records}
    word_poems = {}
    previous = set()
    for i, poem in enumerate(poems):
        actual = tokens(poem['title'] + ' ' + poem['poem'])
        assert actual <= known, (poem['id'], actual - known)
        assert actual == set(poem['words']), poem['id']
        assert len(poem['poem'].splitlines()) == (4 if i < 20 else 6)
        assert poem['translation'].strip(), poem['id']
        assert len(poem['translation'].splitlines()) == len(poem['poem'].splitlines()), poem['id']
        for word in tokens(poem['poem']):
            word_poems.setdefault(word, []).append(poem['id'])
        if i < 20:
            previous |= tokens(poem['poem'])
        with Image.open(ROOT / poem['image']) as image:
            image.verify()
    assert len(word_poems) >= 500
    report = {
        'countingRule': 'Distinct lowercase words actually present in poem bodies; titles, word lists and illustration prompts excluded. Hyphenated words stay intact.',
        'beginnerVocabularyCount': len(known), 'poemCount': len(poems),
        'previousBodyWordCount': len(previous), 'bodyWordCount': len(word_poems),
        'additionalBodyWords': len(set(word_poems) - previous),
        'target': 500, 'targetReached': True,
        'usedWords': sorted(word_poems), 'unusedWords': sorted(known - set(word_poems)),
        'wordPoems': dict(sorted(word_poems.items())),
    }
    (ROOT / 'coverage-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    cards = []
    for poem in poems:
        cards.append(
            f'<article id="{poem["id"]}"><a href="{poem["image"]}">'
            f'<img loading="lazy" src="{poem["image"]}" alt="{html.escape(poem["title"])} 삽화와 영어 동시"></a>'
            f'<details><summary>{poem["id"]} · {html.escape(poem["title"])}</summary>'
            f'<p lang="en" class="poem">{html.escape(poem["poem"])}</p>'
            f'<p lang="ko" class="poem">{html.escape(poem["translation"])}</p>'
            f'<p lang="en" class="words">{html.escape(", ".join(poem["words"]))}</p></details></article>'
        )
    page = '''<!doctype html><html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>초급 영어 동시 · 45편</title><style>
body{margin:0;background:#f5f1e8;color:#24324a;font-family:system-ui,sans-serif}
header{padding:24px;max-width:1200px;margin:auto}h1{margin-bottom:12px}
main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:24px;max-width:1200px;padding:24px;margin:auto}
article{background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px #22334412}
img{display:block;width:100%;height:auto}details{padding:16px}summary{cursor:pointer}
.poem{white-space:pre-line;line-height:1.9}.words{font-size:13px;line-height:1.7;color:#56627a}
a:focus-visible,summary:focus-visible{outline:3px solid #315da8;outline-offset:3px}
</style><header><h1>초급 영어 동시·삽화 45편</h1>
<p>기존 20편 + 추가 25편 · 본문에 사용한 초급 단어 ''' + str(len(word_poems)) + '''종 / ''' + str(len(known)) + '''종</p>
<p>이미지를 누르면 원본을, 제목을 펼치면 원문과 사용 단어를 확인할 수 있습니다.</p>
<p>직접 창작한 콘텐츠 초안입니다. 배포 전 편집·권리 검토가 필요합니다.</p>
<a href="coverage-report.json">단어 사용 현황</a> · <a href="overview.jpg">전체 이미지 모음</a>
</header><main>''' + ''.join(cards) + '</main></html>\n'
    (ROOT / 'index.html').write_text(page, encoding='utf-8')
    overview = Image.new('RGB', (1600, ((len(poems) + 4) // 5) * 520), '#f5f1e8')
    draw = ImageDraw.Draw(overview)
    for i, poem in enumerate(poems):
        with Image.open(ROOT / poem['image']) as source:
            image = source.convert('RGB')
            image.thumbnail((308, 480))
            x, y = (i % 5) * 320, (i // 5) * 520
            overview.paste(image, (x, y + 24))
            draw.text((x + 5, y + 5), poem['id'] + ' ' + poem['title'], fill='#24324a')
    overview.save(ROOT / 'overview.jpg')
    for start in range(20, len(poems), 4):
        sheet = Image.new('RGB', (2048, 800), '#eeeeee')
        draw = ImageDraw.Draw(sheet)
        for i, poem in enumerate(poems[start:start + 4]):
            with Image.open(ROOT / poem['image']) as source:
                image = source.convert('RGB')
                image.thumbnail((500, 760))
                sheet.paste(image, (i * 512, 30))
                draw.text((i * 512 + 8, 8), poem['id'], fill='black')
        sheet.save(ROOT / f'review-expansion-{(start - 20) // 4 + 1}.jpg')
    print(f'PASS: {len(poems)} poems and PNGs; {len(word_poems)} unique beginner words in bodies; all titles and words validated.')


if __name__ == '__main__':
    main()
