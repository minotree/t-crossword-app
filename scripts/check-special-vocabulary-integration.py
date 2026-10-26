"""Validate the 500 reviewed entries, stable identities and packaged notices."""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def csv_rows(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.reader(handle))


def main(check_builds):
    vocabulary = json.loads((ROOT / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    records = csv_rows(ROOT / 'words_completed.csv')[1:]
    assert len(records) == len(vocabulary) == 3839
    assert Counter(word['level'] for word in vocabulary) == {
        'beginner': 775, 'intermediate': 1199, 'advanced': 1365, 'special': 500,
    }
    identity = '\n'.join(f"{word['id']}:{word['word']}:{word['level']}" for word in vocabulary[:3339])
    assert hashlib.sha256(identity.encode()).hexdigest() == 'a88539457e21da73a7c0365c6d63c2bc306a35758f8fb4cea1e638abe37f5351'
    assert len({word['id'] for word in vocabulary}) == 3839
    assert len({word['word'] for word in vocabulary}) == 3839
    additions = []
    inputs = {}
    for number in range(1, 11):
        batch = f'{number:03}'
        path = ROOT / f'content/special-vocabulary/review-{batch}/vocabulary-special-candidates-{batch}-reviewed.csv'
        inputs[batch] = hashlib.sha256(path.read_bytes()).hexdigest()
        rows = csv_rows(path)[1:]
        assert len(rows) == 50
        additions.extend(rows)
    assert records[3339:] == additions
    for offset, (row, word) in enumerate(zip(additions, vocabulary[3339:]), start=3341):
        assert word['id'] == f'word-{offset}' and word['level'] == 'special'
        assert [word['word'].lower(), word['meaning'], word['partOfSpeech'], word.get('synonym', ''), word['example'], word['exampleMeaning']] == row[1:]
    license_path = ROOT / 'content/special-vocabulary/review-001/WORDNET-LICENSE.txt'
    notice = license_path.read_text(encoding='utf-8')
    exported = (ROOT / 'packages/core/src/assets/wordnetLicense.ts').read_text(encoding='utf-8').split('export const wordnetLicense = ', 1)[1].strip().removesuffix(';')
    assert json.loads(exported) == notice
    built = []
    if check_builds:
        for app in ('web', 'toss', 'mobile'):
            bundles = '\n'.join(path.read_text(encoding='utf-8') for path in (ROOT / f'apps/{app}/dist/assets').glob('*.js'))
            for marker in ('WordNet 3.0 Copyright 2006 by Princeton University.',
                           'Permission to use, copy, modify and distribute',
                           'UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES',
                           'advertising or publicity pertaining to distribution'):
                assert marker in bundles, f'{app}: missing notice marker'
            built.append(app)
    report = {'status': 'integrated-source-not-released', 'original_words': 3339, 'special_words': 500,
              'total_words': 3839, 'old_identity_hash': hashlib.sha256(identity.encode()).hexdigest(),
              'reviewed_input_sha256': inputs, 'source_csv_json_correspondence': 'passed',
              'full_license_export': 'passed', 'built_apps_notice_markers': built,
              'human_final_review': 'pending', 'global_phrase_similarity_review': 'not-performed',
              'toefl_frequency_validation': 'not-performed'}
    out = ROOT / 'artifacts/special-vocabulary-integration.json'
    out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--builds', action='store_true')
    main(parser.parse_args().builds)
