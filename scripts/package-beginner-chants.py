"""Prepare a separate static upload candidate; never uploads or changes the existing package."""
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

import lameenc
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artifacts/beginner-chants/all-carol-fast-trimmed-v1'
OLD = ROOT / 'artifacts/crossword-content-audio/public'
OUT = ROOT / 'artifacts/crossword-content-audio-with-chants-v2'
PUBLIC = OUT / 'public'
ZIP = ROOT / 'artifacts/crossword-content-audio-with-chants-v2.zip'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    if OUT.exists() or ZIP.exists():
        raise FileExistsError('Output exists; preserve it and choose a new output location')
    poems = json.loads((ROOT / 'content/beginner-poems/poems.json').read_text(encoding='utf-8'))
    if len(poems) != 45 or not OLD.is_dir():
        raise ValueError('Expected 45 poems and the existing static package')
    shutil.copytree(OLD, PUBLIC)
    target = PUBLIC / 'beginner-chants'
    target.mkdir()
    manifest = []
    for poem in poems:
        source = SOURCE / (poem['id'] + '.wav')
        info = json.loads((SOURCE / (poem['id'] + '.json')).read_text(encoding='utf-8'))
        if info['source_text'] != poem['poem'] or digest(source.read_bytes()) != info['sha256']:
            raise ValueError('Source text or WAV differs: ' + poem['id'])
        samples, rate = sf.read(source, dtype='float32', always_2d=True)
        if rate != 48000 or samples.shape[1] != 2 or not np.isfinite(samples).all():
            raise ValueError('Invalid WAV: ' + poem['id'])
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(96)
        encoder.set_in_sample_rate(rate)
        encoder.set_out_sample_rate(rate)
        encoder.set_channels(2)
        encoder.set_quality(2)
        pcm = (np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()
        data = encoder.encode(pcm) + encoder.flush()
        hashed = digest(data)
        page_id = poem['id'] + '-01'
        filename = f'{page_id}-{hashed[:16]}.mp3'
        path = target / filename
        path.write_bytes(data)
        decoded, decoded_rate = sf.read(path, always_2d=True)
        if (decoded_rate != rate or decoded.shape[1] != 2 or not np.isfinite(decoded).all()
                or np.max(np.abs(decoded)) <= 0.01 or abs(len(decoded) - len(samples)) / rate > 0.15):
            raise ValueError('Invalid MP3: ' + poem['id'])
        manifest.append({'id': page_id, 'text': poem['poem'], 'file': filename,
                         'sha256': hashed, 'bytes': len(data), 'seconds': round(len(decoded) / rate, 3),
                         'sourceWavSha256': info['sha256'], 'reviewStatus': 'draft-unreviewed'})
    (target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(ROOT / 'artifacts/ace-step-local/LICENSE', PUBLIC / 'ACE-STEP-MIT.txt')
    headers = PUBLIC / '_headers'
    headers.write_text(headers.read_text(encoding='utf-8') + '/beginner-chants/*.mp3\n  Cache-Control: public, max-age=31536000, immutable\n', encoding='utf-8')
    files = sorted(p for p in PUBLIC.rglob('*') if p.is_file())
    with zipfile.ZipFile(ZIP, 'x', zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(PUBLIC).as_posix())
    with zipfile.ZipFile(ZIP) as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP integrity failure')
        for path in files:
            if digest(archive.read(path.relative_to(PUBLIC).as_posix())) != digest(path.read_bytes()):
                raise ValueError('ZIP bytes differ: ' + str(path))
    for path in OLD.rglob('*'):
        if path.is_file() and path.name != '_headers' and digest(path.read_bytes()) != digest((PUBLIC / path.relative_to(OLD)).read_bytes()):
            raise ValueError('Existing file changed: ' + str(path))
    (OUT / 'package-report.json').write_text(json.dumps({'count': len(manifest),
        'status': 'draft-unreviewed', 'mp3Bytes': sum(x['bytes'] for x in manifest),
        'files': len(files), 'uploaded': False}, indent=2) + '\n', encoding='utf-8')
    print(f'PASS: {len(manifest)} MP3s; {len(files)} static files; ZIP {ZIP.stat().st_size} bytes')
    print(ZIP)


if __name__ == '__main__':
    main()
