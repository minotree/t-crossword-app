"""Verify every current source page against its manifest and decoded MP3."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/picture-book-audio'
OUT = ROOT / 'artifacts/picture-book-audio'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main(qwen=False):
    out = ROOT / 'artifacts/picture-book-audio-qwen' if qwen else OUT
    prefix = 'qwen-' if qwen else ''
    manifest = json.loads((CONTENT / f'{prefix}manifest.json').read_text(encoding='utf-8'))
    report = json.loads((CONTENT / f'{prefix}generation-report.json').read_text(encoding='utf-8'))
    references = json.loads((CONTENT / 'selected-voices.json').read_text(encoding='utf-8'))['voices'] if qwen else {}
    original = {r['id']: r for r in json.loads((CONTENT / 'manifest.json').read_text(encoding='utf-8'))}
    expected = {}
    layout_only_changes = []
    for source, digest in report['sourceSha256'].items():
        current_bytes = (ROOT / source).read_bytes()
        if sha(current_bytes) != digest:
            # Restoring the original image layout changes JSON bytes, never narration.
            assert source in ['content/intermediate-readings/books.json', 'content/advanced-readings/books.json'], source
            with zipfile.ZipFile(ROOT / 'artifacts/picture-book-before-original-layout-20261030.zip') as snapshot:
                generated_bytes = snapshot.read(source)
            assert sha(generated_bytes) == digest, 'Generation source snapshot mismatch: ' + source
            generated = json.loads(generated_bytes)
            current = json.loads(current_bytes)
            for old, now in zip(generated, current, strict=True):
                for old_page, now_page in zip(old['pages'], now['pages'], strict=True):
                    old_page['image'] = now_page['image']
            assert generated == current, 'Changes extend beyond image paths: ' + source
            layout_only_changes.append(source)
        for book in json.loads((ROOT / source).read_text(encoding='utf-8')):
            for number, page in enumerate(book.get('pages', [book]), 1):
                expected[f'{book["id"]}-{number:02}'] = page.get('text', page.get('poem'))
    assert len(manifest) == len(expected) == len({p['id'] for p in manifest})
    assert {p['id'] for p in manifest} == set(expected)
    assert json.loads((out / 'public/picture-book-audio/manifest.json').read_text(encoding='utf-8')) == manifest
    with zipfile.ZipFile(out.with_suffix('.zip')) as archive:
        assert archive.testzip() is None
        for page in manifest:
            assert page['text'] == expected[page['id']]
            assert page['textSha256'] == sha(page['text'].encode())
            if qwen and page['level'] != 'advanced':
                reference = references[page['level']]
                assert page['engine'] == 'Qwen3-TTS-1.7B-Base'
                assert page['referenceSha256'] == reference['sha256']
                assert page['referenceText'] == reference['text']
                assert sha((CONTENT / reference['file']).read_bytes()) == reference['sha256']
            else:
                assert not page['missingPhonemeTokens'] and page['phonemes']
                if qwen:
                    assert page == original[page['id']], 'Advanced narration must remain identical'
            path = out / 'public/picture-book-audio' / page['file']
            data = path.read_bytes()
            assert sha(data) == page['sha256'] and len(data) == page['bytes']
            assert page['file'] == f'{page["id"]}-{sha(data)[:16]}.mp3'
            assert archive.read('picture-book-audio/' + page['file']) == data
            audio, rate = sf.read(path)
            assert rate == 24000 and audio.ndim == 1 and np.isfinite(audio).all()
            assert len(audio) > 0 and np.max(np.abs(audio)) > 0.01
            assert abs(len(audio) / rate - page['seconds']) < 0.002
    result = {'pages': len(manifest), 'books': len({p['bookId'] for p in manifest}),
              'verifiedImagePathOnlyChanges': layout_only_changes,
              'totalBytes': sum(p['bytes'] for p in manifest),
              'totalSeconds': round(sum(p['seconds'] for p in manifest), 3),
              'sourceTextHashDecodeZip': 'passed', 'listeningReview': 'pending', 'deviceReview': 'pending'}
    (CONTENT / f'{prefix}validation.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--qwen', action='store_true')
    main(parser.parse_args().qwen)
