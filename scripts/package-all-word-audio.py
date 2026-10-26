"""Recheck every generated clip, prepare public manifests and ZIP, then update Toss data.

Does not deploy, and never puts MP3 files in the Toss bundle.
"""
from collections import Counter
import csv
import hashlib
import json
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/word-audio'
OUT = ROOT / 'artifacts/toss-word-audio-full'
PUBLIC = OUT / 'public'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    vocabulary_path = ROOT / 'packages/core/src/assets/vocab.json'
    words = json.loads(vocabulary_path.read_text(encoding='utf-8'))
    with (ROOT / 'words_completed.csv').open(encoding='utf-8-sig', newline='') as handle:
        csv_words = list(csv.DictReader(handle))
    assert len(csv_words) == len(words) == 3839
    for record_number, (row, word) in enumerate(zip(csv_words, words), start=2):
        assert word['id'] == f'word-{record_number}'
        assert row['영단어'].strip().upper() == word['word'] and row['예문'].strip() == word['example']
    records = json.loads((CONTENT / 'full-manifest.json').read_text(encoding='utf-8'))
    generation = json.loads((CONTENT / 'full-generation-report.json').read_text(encoding='utf-8'))
    assert len(words) == len(records) == generation['completed'] == 3839 and not generation['failures']
    assert generation['vocabularySha256'] == sha(vocabulary_path.read_bytes())
    levels, byte_count, duration = Counter(), 0, 0
    runtime, public_records = {}, {}
    for word in words:
        record = records[word['id']]
        assert record['word'] == word['word'] and record['example'] == word['example']
        assert record['segments'] == [word['word'].lower() + '.', word['example']]
        assert record['pauseMs'] == 500 and not record['missingPhonemeTokens']
        path = PUBLIC / 'word-audio' / record['file']
        assert sha(path.read_bytes()) == record['sha256'] and path.stat().st_size == record['bytes']
        assert record['file'] == f'{word["id"]}-{record["sha256"][:16]}.mp3'
        decoded, rate = sf.read(path)
        assert rate == 24000 and decoded.ndim == 1 and np.isfinite(decoded).all()
        assert np.max(np.abs(decoded)) > 0.01 and len(decoded) > rate
        assert abs(len(decoded) / rate - record['seconds']) < 0.3
        start = record['pauseStartSample'] + rate // 10
        middle = decoded[start:start + rate * 3 // 10]
        assert len(middle) == rate * 3 // 10 and np.max(np.abs(middle)) < 0.001
        runtime[word['id']] = {key: record[key] for key in ('word', 'example', 'file')}
        public_records[word['word']] = {key: record[key] for key in ('id', 'word', 'example', 'file', 'sha256', 'seconds')}
        levels[word['level']] += 1
        byte_count += record['bytes']; duration += record['seconds']
    retained = []
    for source_manifest, folder in [
        (CONTENT / 'revisions/v1/sample-manifest.json', ROOT / 'artifacts/toss-word-audio-preview/public/word-audio'),
        (CONTENT / 'sample-manifest.json', ROOT / 'artifacts/toss-word-audio-preview-v2/public/word-audio'),
    ]:
        for record in json.loads(source_manifest.read_text(encoding='utf-8')).values():
            source = folder / record['file']
            assert sha(source.read_bytes()) == record['sha256']
            shutil.copyfile(source, PUBLIC / 'word-audio' / record['file'])
            retained.append(record['file'])
    assert len(retained) == 20 and len(set(retained)) == 20
    for source, name in [(CONTENT / 'KOKORO-APACHE-2.0.txt', 'KOKORO-APACHE-2.0.txt'),
                         (ROOT / 'content/special-vocabulary/review-001/WORDNET-LICENSE.txt', 'WORDNET-LICENSE.txt')]:
        shutil.copyfile(source, PUBLIC / name)
    notice = '''English vocabulary audio generated locally with Kokoro v1.0 / af_heart.
Model: https://huggingface.co/hexgrad/Kokoro-82M
Voice documentation: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
Inference library: https://github.com/hexgrad/kokoro
Kokoro code/model metadata: Apache-2.0. No code or model weights are distributed here.
The original model card credits Koniwa (CC BY 3.0) and SIWIS (CC BY 4.0) among its training data:
https://github.com/koniwa/koniwa
https://datashare.ed.ac.uk/handle/10283/2353
Vocabulary and example sentences: t-crossword-app words_completed.csv.
The special-vocabulary meaning review used WordNet 3.0; its notice is retained in WORDNET-LICENSE.txt.
Generated speech is AI output. Full per-word human pronunciation review has not been performed.
Model provenance and generation hashes are recorded in the project content/word-audio directory.
'''
    (PUBLIC / 'NOTICE.txt').write_text(notice, encoding='utf-8')
    manifest = {'schemaVersion': 1, 'createdDate': '2026-10-26', 'language': 'en-US', 'voice': 'af_heart',
                'pauseMs': 500, 'audioPath': 'word-audio/', 'vocabularySha256': generation['vocabularySha256'],
                'sourceCsvSha256': sha((ROOT / 'words_completed.csv').read_bytes()), 'entries': public_records}
    (PUBLIC / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (PUBLIC / '_headers').write_text('/word-audio/*\n  Cache-Control: public, max-age=31536000, immutable\n  Access-Control-Allow-Origin: *\n  X-Content-Type-Options: nosniff\n/manifest.json\n  Cache-Control: no-cache\n  Access-Control-Allow-Origin: *\n', encoding='utf-8')
    (OUT / 'wrangler.jsonc').write_text(json.dumps({'name': 'crossword-word-audio', 'compatibility_date': '2026-10-26', 'assets': {'directory': './public'}}, indent=2) + '\n', encoding='utf-8')
    # Other apps can join by uppercase word + exact example instead of assuming IDs.
    with (OUT / 'word-audio-links.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow(['word', 'example', 'url', 'sha256', 'seconds', 'pauseMs'])
        for entry in public_records.values():
            writer.writerow([entry['word'], entry['example'], 'https://crossword-word-audio.minotree0902.workers.dev/word-audio/' + entry['file'], entry['sha256'], entry['seconds'], 500])
    shutil.copyfile(ROOT / 'scripts/word-audio-full-preview.html', PUBLIC / 'index.html')
    shutil.copyfile(ROOT / 'scripts/word-audio-full-preview.js', PUBLIC / 'audio-preview.js')
    files = [path for path in PUBLIC.rglob('*') if path.is_file()]
    assert len(files) < 20000 and all(path.stat().st_size < 25 * 1024 * 1024 for path in files)
    expected_audio = {record['file'] for record in records.values()} | set(retained)
    assert {path.name for path in (PUBLIC / 'word-audio').glob('*.mp3')} == expected_audio
    with ZipFile(OUT.with_suffix('.zip'), 'w', ZIP_DEFLATED) as archive:
        for path in sorted(files): archive.write(path, path.relative_to(PUBLIC).as_posix())
    assert json.loads((PUBLIC / 'manifest.json').read_text(encoding='utf-8')) == manifest
    # Publish application data only after every clip and the upload package have passed.
    (ROOT / 'apps/toss/src/data/word-audio.json').write_text(json.dumps(runtime, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report = {'checkedDate': '2026-10-26', 'words': len(records), 'pauseMs': 500, 'levelCounts': dict(levels),
              'audioBytes': byte_count, 'audioSeconds': round(duration, 2), 'retainedSampleFiles': len(retained),
              'publicFileCount': len(files), 'publicBytes': sum(path.stat().st_size for path in files),
              'zipBytes': OUT.with_suffix('.zip').stat().st_size, 'runtimeManifestCount': len(runtime),
              'allHashesAndDecodedAudio': 'passed', 'allPauseCentralSilence': 'passed',
              'allPhonemeTokensPresent': 'passed', 'publicManifestCorrespondence': 'passed',
              'sourceCsvWordAndExampleCorrespondence': 'passed',
              'humanFullListeningReview': 'not-performed', 'cloudflareFullDeployment': 'pending-user-upload'}
    (CONTENT / 'full-validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
