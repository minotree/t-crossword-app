"""Package final picture-book and encouragement MP3s for static Cloudflare upload. Never uploads."""
import hashlib
import html
import json
from pathlib import Path
import shutil
import zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/crossword-content-audio'
PUBLIC=OUT/'public'
sha=lambda b:hashlib.sha256(b).hexdigest()

def main():
    assert json.loads((ROOT/'artifacts/picture-book-audio-qwen/job-status.json').read_text(encoding='utf-8'))['state']=='complete'
    books=json.loads((ROOT/'content/picture-book-audio/qwen-manifest.json').read_text(encoding='utf-8'))
    phrases=json.loads((ROOT/'content/encouragement-audio/manifest.json').read_text(encoding='utf-8'))
    assert len(books)==119 and len(phrases)==50
    if PUBLIC.exists(): raise ValueError('Package exists; refusing to replace it')
    selected=[]
    for folder,records,source in [
        ('picture-book-audio',books,ROOT/'artifacts/picture-book-audio-qwen/public/picture-book-audio'),
        ('encouragement-audio',phrases,ROOT/'apps/toss/public/encouragement-audio')]:
        for record in records:
            path=source/record['file']
            assert path.name==record['file'] and sha(path.read_bytes())==record['sha256']
            selected.append((folder,record,path))
    for folder,record,path in selected:
        target=PUBLIC/folder/record['file'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
    for folder,records in [('picture-book-audio',books),('encouragement-audio',phrases)]:
        (PUBLIC/folder/'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for name in ['KOKORO-APACHE-2.0.txt','QWEN-APACHE-2.0.txt']:
        shutil.copyfile(ROOT/'artifacts/picture-book-audio-qwen/public'/name,PUBLIC/name)
    (PUBLIC/'_headers').write_text('/*\n  Access-Control-Allow-Origin: *\n/picture-book-audio/*.mp3\n  Cache-Control: public, max-age=31536000, immutable\n/encouragement-audio/*.mp3\n  Cache-Control: public, max-age=31536000, immutable\n',encoding='utf-8')
    cards=''.join('<article><h2>'+html.escape(record['id'])+'</h2><p>'+html.escape(record['text'])+'</p><audio controls preload="none" src="'+folder+'/'+record['file']+'"></audio></article>' for folder,record,_ in selected)
    (PUBLIC/'index.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Content audio</title><style>body{max-width:800px;margin:auto;padding:20px;font:16px/1.7 sans-serif}p{white-space:pre-wrap}article{border-bottom:1px solid #ddd;padding:16px 0}audio{width:100%}</style><h1>Picture books / Encouragement audio</h1><p>AI-generated audio. Listening and device review pending.</p><p><a href="KOKORO-APACHE-2.0.txt">Kokoro license</a> / <a href="QWEN-APACHE-2.0.txt">Qwen license</a></p>'+cards+'<script>document.addEventListener("play",e=>document.querySelectorAll("audio").forEach(a=>{if(a!==e.target)a.pause()}),true)</script>',encoding='utf-8')
    files=sorted(path for path in PUBLIC.rglob('*') if path.is_file())
    report={'pictureBookPages':119,'encouragements':50,'mp3Bytes':sum(r['bytes'] for _,r,_ in selected),
        'files':{p.relative_to(PUBLIC).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in files},
        'listeningReview':'pending','deviceReview':'pending','deployment':'not-performed'}
    (OUT/'package-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    target=ROOT/'artifacts/crossword-content-audio.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        for p in files: archive.write(p,p.relative_to(PUBLIC).as_posix())
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert set(archive.namelist())==set(report['files'])
        for name,item in report['files'].items(): assert sha(archive.read(name))==item['sha256']
    print(f'PASS: 169 MP3s; {len(files)} static files; {report["mp3Bytes"]} MP3 bytes; ZIP {target.stat().st_size} bytes')
    print(PUBLIC)
    print(target)

if __name__=='__main__': main()
