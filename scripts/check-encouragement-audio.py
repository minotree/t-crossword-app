"""Check all encouragement inputs, packaged hashes, decoding and non-silence."""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'content/encouragement-audio'
sha=lambda b:hashlib.sha256(b).hexdigest()
source=json.loads((ROOT/'apps/toss/src/data/encouragements.json').read_text(encoding='utf-8'))
records=json.loads((CONTENT/'manifest.json').read_text(encoding='utf-8'))
runtime=json.loads((ROOT/'apps/toss/src/data/encouragement-audio.json').read_text(encoding='utf-8'))
report=json.loads((CONTENT/'generation-report.json').read_text(encoding='utf-8'))
assert report['sourceSha256']==sha((ROOT/'apps/toss/src/data/encouragements.json').read_bytes())
assert len(source)==len(records)==len(runtime)==50
assert len({r['file'] for r in records})==50
for phrase,record,entry in zip(source,records,runtime,strict=True):
    assert phrase['english']==record['text']==entry['english']
    assert sha(record['text'].encode())==record['textSha256']
    assert record['file']==entry['file']
    path=ROOT/'apps/toss/public/encouragement-audio'/record['file']
    assert sha(path.read_bytes())==record['sha256']
    assert record['sha256'][:16] in record['file']
    assert not record['missingPhonemeTokens']
    samples,rate=sf.read(path)
    assert rate==24000 and samples.ndim==1 and np.isfinite(samples).all()
    assert len(samples)>rate and np.max(np.abs(samples))>0.01
    assert abs(len(samples)/rate-record['seconds'])<0.002
print(f"PASS: 50 phrases, source/runtime/hash correspondence and MP3 decoding; {sum(r['bytes'] for r in records)} bytes. Listening review pending.")
