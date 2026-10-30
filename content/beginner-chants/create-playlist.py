"""Build a local listening list from generated files; unfinished tracks are omitted."""
import html
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ('artifacts/beginner-chants/all-carol-fast-trimmed-v1'
              if '--trimmed' in sys.argv else 'artifacts/beginner-chants/all-carol-fast-v1')
poems = json.loads((ROOT / 'content/beginner-poems/poems.json').read_text(encoding='utf-8'))
rows = []
for item in poems:
    wav = OUT / (item['id'] + '.wav')
    metadata = OUT / (item['id'] + '.json')
    if not wav.is_file() or not metadata.is_file():
        continue
    record = json.loads(metadata.read_text(encoding='utf-8'))
    title = html.escape(item['title'])
    korean = html.escape(item.get('koreanTitle', ''))
    ident = html.escape(item['id'], quote=True)
    text = html.escape(item['poem'])
    rows.append(f'<section><h2>{ident} · {title} <small>{korean}</small></h2>'
                f'<audio controls preload="none" src="{ident}.wav"></audio>'
                f'<details><summary>그림책 원문</summary><p>{text}</p></details>'
                f'<p class="status">{record["duration_seconds"]:.0f}초 · 청취 검수 전 시안</p></section>')
page = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>초급 그림책 챈트 시안</title><style>
body{{font-family:system-ui,sans-serif;margin:2rem auto;padding:0 1rem;max-width:48rem;line-height:1.6}}
section{{padding:1rem 0;border-bottom:1px solid #ddd}} h2{{font-size:1.1rem;margin:.3rem 0}}
small,.status{{color:#555}} audio{{width:100%}} details p{{white-space:pre-line}} .status{{font-size:.9rem}}
</style></head><body><h1>초급 그림책 챈트 시안</h1>
<p>준비된 곡 {len(rows)}/{len(poems)}편. 생성된 음원의 가사·발음과 사용 권리는 검수 전입니다.</p>
{''.join(rows)}
<script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{{if(b!==a)b.pause()}})))</script>
</body></html>'''
(OUT / 'index.html').write_text(page, encoding='utf-8')
print(f'Playlist: {len(rows)}/{len(poems)}')
