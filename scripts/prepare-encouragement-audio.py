"""Generate quiz English encouragements with the existing offline Kokoro engine. Never deploys."""
from datetime import datetime
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('narration', ROOT/'scripts/prepare-picture-book-audio.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
OUT = ROOT/'artifacts/encouragement-audio'
CONTENT = ROOT/'content/encouragement-audio'
SOURCE = ROOT/'apps/toss/src/data/encouragements.json'
sha = lambda data: hashlib.sha256(data).hexdigest()

def main():
    source = json.loads(SOURCE.read_text(encoding='utf-8'))
    assert len(source)==50 and len({item['english'] for item in source})==50
    provenance=json.loads((ROOT/'content/word-audio/model-provenance.json').read_text(encoding='utf-8'))
    for name,item in provenance['files'].items():
        assert sha((engine.engine.CACHE/Path(name).name).read_bytes())==item['sha256']
    engine.OUT=OUT
    for name in ['checkpoints','public/picture-book-audio']:
        (OUT/name).mkdir(parents=True,exist_ok=True)
    engine.initialize_worker(1)
    records=[]
    public=ROOT/'apps/toss/public/encouragement-audio'
    public.mkdir(parents=True,exist_ok=True)
    for index,item in enumerate(source,1):
        page={'id':f'encouragement-{index:02}','text':item['english'],'source':SOURCE.relative_to(ROOT).as_posix()}
        record=engine.generate(page)
        records.append(record)
        shutil.copyfile(OUT/'public/picture-book-audio'/record['file'],public/record['file'])
        print(f'{index}/50 {record["file"]}',flush=True)
    engine.write_json(CONTENT/'manifest.json',records)
    engine.write_json(ROOT/'apps/toss/src/data/encouragement-audio.json',[
        {'english':r['text'],'file':r['file']} for r in records])
    engine.write_json(CONTENT/'generation-report.json',{'date':datetime.now().astimezone().isoformat(),
        'tool':'Kokoro Python 0.9.4','model':provenance,'voice':'af_heart','configuration':engine.configuration(),
        'sourceSha256':sha(SOURCE.read_bytes()),'generatorSha256':sha(Path(__file__).read_bytes()),
        'completed':len(records),'bytes':sum(r['bytes'] for r in records),'listeningReview':'pending',
        'deviceReview':'pending','deployment':'not-performed'})
    cards=''.join('<article><p>'+html.escape(r['text'])+'</p><audio controls preload="none" src="picture-book-audio/'+r['file']+'"></audio></article>' for r in records)
    (OUT/'public/index.html').write_text('<!doctype html><meta charset="utf-8"><title>Encouragement audio review</title><h1>Kokoro af_heart / 50 English encouragements</h1>'+cards,encoding='utf-8')
    print('PASS: 50 generated, hash-checked and decoded MP3 files; listening review pending',flush=True)

if __name__=='__main__': main()
