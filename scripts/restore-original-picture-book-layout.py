"""Restore only original illustration/text layouts. Preserve current audio/UI code."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT/'artifacts/picture-book-layout-backup-20261029/before.zip'
SNAPSHOT = ROOT/'artifacts/picture-book-before-original-layout-20261030.zip'
sha = lambda b: hashlib.sha256(b).hexdigest()

def main():
    report=json.loads((ROOT/'content/picture-book-large-text-2026-10-29/render-report.json').read_text(encoding='utf-8'))
    replacements={}
    with zipfile.ZipFile(BACKUP) as archive:
        for level in ['intermediate','advanced']:
            name=f'content/{level}-readings/books.json'
            original=json.loads(archive.read(name))
            current=json.loads((ROOT/name).read_text(encoding='utf-8'))
            for old,new in zip(original,current,strict=True):
                for old_page,new_page in zip(old['pages'],new['pages'],strict=True):
                    row=next(r for r in report['records'] if r['bookId']==new['id'] and r['sourceText']==new_page['text'] and r['originalImage'].endswith('/'+old_page['image']))
                    assert sha((ROOT/row['originalImage']).read_bytes())==row['originalSha256']
                    new_page['image']=old_page['image']
                assert new==old,'Unexpected source edits; stop before writes'
            replacements[name]=archive.read(name)
        for row in report['records']:
            if row['level']=='intermediate':
                name=f"content/intermediate-readings/generation-records/{row['id']}.json"
                replacements[name]=archive.read(name)
            for app in ['web','toss','mobile']:
                number=f"{row['page']:02}" if app=='web' else str(row['page'])
                name=f"apps/{app}/public/picture-books/{row['bookId']}-{number}.webp"
                replacements[name]=archive.read(name)
        for app in ['web','toss','mobile']:
            for filename in ['picture-book-images.json','picture-books.json','intermediate-books.json','advanced-books.json']:
                name=f'apps/{app}/src/data/{filename}'
                if name in archive.namelist(): replacements[name]=archive.read(name)
        name='content/picture-book-approval.json'
        approvals=json.loads((ROOT/name).read_text(encoding='utf-8'))
        previous=json.loads(archive.read(name))
        affected={r['bookId'] for r in report['records']}
        approvals['books']=[next(old for old in previous['books'] if old['id']==entry['id']) if entry['id'] in affected else entry for entry in approvals['books']]
        replacements[name]=(json.dumps(approvals,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    if SNAPSHOT.exists(): raise ValueError('Pre-restore snapshot already exists')
    with zipfile.ZipFile(SNAPSHOT,'w',zipfile.ZIP_STORED) as snapshot:
        for name in replacements: snapshot.writestr(name,(ROOT/name).read_bytes())
    for name,data in replacements.items(): (ROOT/name).write_bytes(data)
    assert all((ROOT/name).read_bytes()==data for name,data in replacements.items())
    print(f'PASS: restored original layout for 74 pages and 222 app images; {len(replacements)} files. Audio/UI code untouched. Snapshot: {SNAPSHOT.name}')

if __name__=='__main__': main()
