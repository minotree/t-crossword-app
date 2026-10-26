"""Validate generated sample content, audio bytes and MP3 decoding, not listening quality."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
content = root / 'content/word-audio'
out = root / 'artifacts/toss-word-audio-preview'
manifest = json.loads((content / 'sample-manifest.json').read_text(encoding='utf-8'))
vocabulary = {word['id']: word for word in json.loads((root / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))}
app = json.loads((root / 'apps/toss/src/data/word-audio.json').read_text(encoding='utf-8'))
assert set(app) == set(manifest) and len(app) == 10
checks = []
for identifier, entry in manifest.items():
    word = vocabulary[identifier]
    assert word['word'] == entry['word'] and word['example'] == entry['example']
    text = word['word'].lower() + '. ' + word['example']
    assert hashlib.sha256(text.encode()).hexdigest() == entry['textSha256']
    path = out / 'public/word-audio' / entry['file']
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == entry['sha256'] and len(data) == entry['bytes']
    assert app[identifier] == {key: entry[key] for key in ('word', 'example', 'file')}
    decoded, rate = sf.read(path)
    assert rate == 24000 and decoded.ndim == 1 and len(decoded) > 24000
    assert np.isfinite(decoded).all() and np.max(np.abs(decoded)) > 0.01
    assert abs(len(decoded) / rate - entry['seconds']) < 0.3
    checks.append({'id': identifier, 'word': entry['word'], 'bytes': len(data), 'decodedSeconds': round(len(decoded) / rate, 3), 'peak': round(float(np.max(np.abs(decoded))), 4)})
with ZipFile(out.with_suffix('.zip'), 'w', ZIP_DEFLATED) as archive:
    for path in sorted((out / 'public').rglob('*')):
        if path.is_file(): archive.write(path, path.relative_to(out / 'public').as_posix())
report = {'decoded_files': checks, 'source_and_runtime_manifest_match': True, 'hashes_match': True, 'listening_review': 'pending', 'toss_device_review': 'pending'}
(content / 'validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'files': len(checks), 'mp3Bytes': sum(entry['bytes'] for entry in checks), 'zipBytes': out.with_suffix('.zip').stat().st_size, 'status': 'passed; listening review pending'}))
