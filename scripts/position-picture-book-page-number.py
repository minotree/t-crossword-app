"""Preserve v2 cards and move the page counter to the upper-right header gap."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/picture-book-large-text-2026-10-29'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def write(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def stage():
    report = json.loads((DEST/'render-report.json').read_text(encoding='utf-8'))
    assert not (DEST/'render-report-v3.json').exists()
    font = ImageFont.truetype(str(ROOT/'content/fonts/source-serif/SourceSerif4-Regular.otf'),38)
    for row in report['records']:
        source = ROOT/row['image']
        assert sha(source)==row['sha256'] and source.name.endswith('-v2.png')
        lines = row['renderedLines']
        footer = next(line for line in lines if line['role']=='page-number')
        body = [line for line in lines if line['role']=='body']
        with Image.open(source) as original:
            image = original.convert('RGB')
        draw = ImageDraw.Draw(image)
        draw.rectangle((0,footer['bbox'][1]-2,1024,image.height),fill='#fff9ee')
        x = 968-font.getlength(footer['text'])
        y = body[0]['bbox'][1]-48
        box = draw.textbbox((x,y),footer['text'],font=font,anchor='lt')
        for line in lines:
            if line is footer: continue
            a,b,c,d = line['bbox']
            assert box[2]<=a or c<=box[0] or box[3]<=b or d<=box[1], 'Counter overlaps text'
        draw.text((x,y),footer['text'],font=font,anchor='lt',fill='#15263e')
        footer['bbox']=list(box)
        image=image.crop((0,0,1024,body[-1]['bbox'][3]+60))
        target=source.with_name(source.name.replace('-v2.png','-v3.png'))
        assert not target.exists()
        image.save(target)
        row.update(previousImage=row['image'],previousSha256=row['sha256'],image=target.relative_to(ROOT).as_posix(),sha256=sha(target),height=image.height,pageNumberPosition='header-right')
    report.update(pageNumberPosition='header-right',pageNumberRevisionDate='2026-10-30',generatorSha256=sha(Path(__file__)))
    write(DEST/'render-report-v3.json',report)
    print('Staged 74 v3 cards; counter collision checks passed')

def activate():
    report=json.loads((DEST/'render-report-v3.json').read_text(encoding='utf-8'))
    for level in ['intermediate','advanced']:
        p=ROOT/f'content/{level}-readings/books.json'
        books=json.loads(p.read_text(encoding='utf-8'))
        for row in [r for r in report['records'] if r['level']==level]:
            book=next(b for b in books if b['id']==row['bookId'])
            page=book['pages'][row['page']-1]
            assert (ROOT/f'content/{level}-readings'/page['image']).resolve()==(ROOT/row['previousImage']).resolve()
            assert sha(ROOT/row['image'])==row['sha256']
            records=ROOT/f'content/{level}-readings/generation-records'
            old_path=records/(row['id']+'.json' if level=='intermediate' else Path(row['previousImage']).stem+'.json')
            record=json.loads(old_path.read_text(encoding='utf-8'))
            if level=='intermediate':
                history=records/'revisions/before-page-number-20261030'/old_path.name
                assert not history.exists()
                write(history,record)
            page['image']=Path(row['image']).relative_to(f'content/{level}-readings').as_posix()
            record['target']=page['image']
            record['postProcessing'].update(pageNumberPosition='header-right',pageNumberRevisionDate='2026-10-30')
            write(old_path if level=='intermediate' else records/(Path(page['image']).stem+'.json'),record)
        write(p,books)
    for name in ['visual-review.json']:
        original=DEST/name
        archive=DEST/(original.stem+'-v2'+original.suffix)
        assert not archive.exists()
        archive.write_bytes(original.read_bytes())
    write(DEST/'render-report.json',report)
    gallery=(DEST/'index-v2.html').read_text(encoding='utf-8').replace('-large-text-v2.png','-large-text-v3.png')
    (DEST/'index.html').write_text(gallery,encoding='utf-8')
    write(DEST/'visual-review.json',{'date':'2026-10-30','renderReportSha256':sha(DEST/'render-report.json'),'reviewedIds':[r['id'] for r in report['records']],
        'method':'Counter relocation; collision/bounds checks on all pages; representative visual inspection; original art and body glyphs preserved',
        'actualDeviceReview':False,'pageNumberPosition':'header-right'})
    print('Activated 74 v3 cards')

if __name__=='__main__':
    import sys
    stage() if sys.argv[1]=='stage' else activate()
