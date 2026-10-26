"""Review subsequent supplied batches without modifying operational vocabulary.

Uses the already downloaded WordNet 3.0 archive and recorded editorial decisions.
"""
import argparse
import csv
import hashlib
import json
import re
import runpy
import shutil
import tarfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXPORTS = runpy.run_path(str(ROOT / 'scripts/finalize-special-vocabulary-review.py'))
read_csv = EXPORTS['read_csv']
write_csv = EXPORTS['write_csv']
xlsx = EXPORTS['xlsx']


def workbook_rows(archive, path, shared):
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    result = []
    for row in ET.fromstring(archive.read(path)).findall('s:sheetData/s:row', ns):
        values = []
        for cell in row:
            letters = re.match('[A-Z]+', cell.attrib['r']).group()
            column = 0
            for letter in letters:
                column = column * 26 + ord(letter) - 64
            while len(values) < column:
                values.append('')
            value_node = cell.find('s:v', ns)
            value = value_node.text if value_node is not None else ''
            if cell.get('t') == 's':
                value = shared[int(value)]
            elif cell.get('t') == 'inlineStr':
                value = ''.join(cell.find('s:is', ns).itertext())
            values[column - 1] = value
        result.append(values)
    return result


def main(batch, input_dir):
    work = ROOT / 'content/special-vocabulary' / ('review-' + batch)
    out = ROOT / 'artifacts' / ('vocabulary-review-' + batch)
    work.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    names = [f'vocabulary-special-{kind}-{batch}.csv' for kind in ('candidates', 'sources')]
    provenance_name = f'vocabulary-special-provenance-{batch}.json'
    workbook_name = f'vocabulary-special-{batch}.xlsx'
    supplied_provenance = (input_dir / provenance_name).exists()
    if supplied_provenance:
        names.append(provenance_name)
    names.append(workbook_name)
    companions = [f'vocabulary-special-prompt-{batch}.txt', f'WORDNET-3.0-LICENSE-{batch}.txt',
                  f'vocabulary-special-validation-{batch}.json', f'vocabulary-special-holds-{batch}.json',
                  f'vocabulary-special-review-{batch}.txt']
    names.extend(name for name in companions if (input_dir / name).exists())
    for name in names:
        original, destination = input_dir / name, work / name
        if destination.exists():
            assert original.read_bytes() == destination.read_bytes(), 'Do not overwrite changed original: ' + name
        else:
            shutil.copyfile(original, destination)
    header, candidates = read_csv(work / names[0])
    source_header, sources = read_csv(work / names[1])
    archive_path = ROOT / 'artifacts/vocabulary-review-001/WordNet-3.0.tar.gz'
    if supplied_provenance:
        provenance = json.loads((work / provenance_name).read_text(encoding='utf-8-sig'))
    else:
        # This is our verification record, not a reconstruction of the author's generation history.
        known_archive = json.loads((work.parent / 'review-001/wordnet-download.json').read_text(encoding='utf-8'))
        records = []
        with tarfile.open(archive_path, 'r:gz') as archive:
            blobs = {pos: archive.extractfile('WordNet-3.0/dict/data.' + pos).read() for pos in ('noun', 'verb', 'adj', 'adv')}
            sense_pairs = [line.split()[:2] for line in archive.extractfile('WordNet-3.0/dict/index.sense').read().decode('ascii').splitlines()]
            license_hash = hashlib.sha256(archive.extractfile('WordNet-3.0/LICENSE').read()).hexdigest()
            for source in sources:
                word = source['영단어']
                item = re.search(r'(\d{8})-([nvars])', source['출처자료명'])
                pos = re.search(r'data\.(noun|verb|adj|adv)', source['출처자료명']).group(1)
                raw = blobs[pos][int(item[1]):].split(b'\n', 1)[0] + b'\n'
                candidate = next(row for row in candidates if row['영단어'] == word)
                records.append({'word': word, 'item_id': item[0], 'synset_offset': item[1],
                                'synset_pos': item[2], 'part_of_speech_ko': candidate['품사'],
                                'selected_meaning_summary_ko': candidate['뜻'],
                                'source_file': 'WordNet-3.0/dict/data.' + pos,
                                'source_record_sha256': hashlib.sha256(raw).hexdigest(),
                                'sense_keys': [key for key, offset in sense_pairs if offset == item[1] and key.split('%')[0] == word]})
        provenance = {'batch': batch, 'record_type': 'independent verification; author provenance not supplied',
                      'source_archive': {'sha256': known_archive['archive_sha256']},
                      'license': {'sha256': license_hash}, 'model_name': None, 'records': records}
        (work / 'independent-verification-provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    decisions = json.loads((work / 'editorial-decisions.json').read_text(encoding='utf-8'))
    expected_header = ['난이도', '영단어', '뜻', '품사', '동의어', '예문', '예문해석']
    assert header == expected_header
    assert len(candidates) == len(sources) == len(provenance['records']) == 50
    words = {row['영단어'] for row in candidates}
    assert len(words) == 50 and len({row['영단어'] for row in sources}) == 50
    assert words == {row['영단어'] for row in sources} == {row['word'] for row in provenance['records']}
    existing = json.loads((ROOT / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    excluded = {row['word'].lower() for row in existing}
    for directory in sorted(work.parent.glob('review-*')):
        if directory.name >= work.name:
            continue
        previous = directory / f'vocabulary-special-candidates-{directory.name[-3:]}-reviewed.csv'
        _, records = read_csv(previous)
        excluded.update(row['영단어'] for row in records)
    assert not words.intersection(excluded), 'Duplicate with operational or previous candidate words'
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(work / workbook_name) as book:
        shared = [''.join(item.itertext()) for item in ET.fromstring(book.read('xl/sharedStrings.xml'))]
        # The supplied workbook has a candidate sheet followed by a sources sheet.
        for number, columns, rows in [(1, header, candidates), (2, source_header, sources)]:
            expected = [columns] + [[row[key] for key in columns] for row in rows]
            assert workbook_rows(book, f'xl/worksheets/sheet{number}.xml', shared) == expected
    assert hashlib.sha256(archive_path.read_bytes()).hexdigest() == provenance['source_archive']['sha256']
    evidence = []
    morphology_flags = []
    pos_map = {'명사': 'n', '동사': 'v', '형용사': 'a', '부사': 'r'}
    with tarfile.open(archive_path, 'r:gz') as archive:
        blobs = {pos: archive.extractfile('WordNet-3.0/dict/data.' + pos).read() for pos in ('noun', 'verb', 'adj', 'adv')}
        senses = {}
        for line in archive.extractfile('WordNet-3.0/dict/index.sense').read().decode('ascii').splitlines():
            key, offset, *_ = line.split()
            senses[key] = offset
        license_bytes = archive.extractfile('WordNet-3.0/LICENSE').read()
        assert hashlib.sha256(license_bytes).hexdigest() == provenance['license']['sha256']
        supplied_license = work / f'WORDNET-3.0-LICENSE-{batch}.txt'
        if supplied_license.exists():
            assert supplied_license.read_bytes() == license_bytes, 'Supplied license differs from official archive'
        (work / 'WORDNET-LICENSE.txt').write_bytes(license_bytes)
        for record in provenance['records']:
            word = record['word']
            raw = blobs[record['source_file'].split('.')[-1]][int(record['synset_offset']):].split(b'\n', 1)[0] + b'\n'
            assert hashlib.sha256(raw).hexdigest() == record['source_record_sha256'], word + ' source hash mismatch'
            fields, gloss = raw.decode('ascii').rstrip('\n').split('|', 1)
            tokens = fields.split()
            count = int(tokens[3], 16)
            lemmas = tokens[4:4 + 2 * count:2]
            # WordNet adjective position markers are metadata, not part of the headword.
            normalized_lemmas = [re.sub(r'\((?:a|p|ip)\)$', '', lemma) for lemma in lemmas]
            assert word in normalized_lemmas, f'{word}: source synset contains {lemmas}'
            assert record['item_id'] == tokens[0] + '-' + tokens[2]
            assert record['synset_pos'] == tokens[2]
            assert record['sense_keys'] and all(senses[key] == tokens[0] and key.split('%')[0] == word for key in record['sense_keys'])
            candidate = next(row for row in candidates if row['영단어'] == word)
            assert record['part_of_speech_ko'] == candidate['품사']
            assert record['selected_meaning_summary_ko'] == candidate['뜻']
            assert pos_map[candidate['품사']] == ('a' if tokens[2] == 's' else tokens[2])
            source = next(row for row in sources if row['영단어'] == word)
            assert record['item_id'] in source['출처자료명']
            evidence.append({'word': word, 'item_id': record['item_id'], 'lemmas': lemmas,
                             'gloss': gloss.strip(), 'source_record_sha256': record['source_record_sha256'],
                             'hash_convention': 'exact source row bytes including trailing LF'})
        for pos in ('noun', 'verb', 'adj', 'adv'):
            for line in archive.extractfile('WordNet-3.0/dict/' + pos + '.exc').read().decode('ascii').splitlines():
                form, *bases = line.split()
                if form in words and set(bases).intersection(excluded):
                    morphology_flags.append({'word': form, 'base': sorted(set(bases).intersection(excluded))})
    changes = []
    for row in candidates:
        word = row['영단어']
        if word in decisions['changes']:
            edit = decisions['changes'][word]
            for key, value in edit['fields'].items():
                changes.append({'영단어': word, '항목': key, '수정전': row[key], '수정후': value, '수정이유': edit['reason']})
                row[key] = value
        assert None not in row and len(row) == 7 and row['난이도'] == '특급'
        assert re.fullmatch('[a-z]{3,12}', word)
        assert all(row[key].strip() for key in header if key != '동의어')
        assert all('\n' not in value and '\r' not in value for value in row.values())
        assert re.search(r'\b' + re.escape(word) + r'\b', row['예문'], re.I)
        assert 8 <= len(row['예문'].split()) <= 18
    for source in sources:
        source['검토상태'] = '에이전트 편집검수 완료·출시대기'
        source['뜻과예문작성방식'] += '; Codex 에이전트가 원자료 의미·품사 대조 및 영어·해석 편집검수'
        source['비고'] += ' 이번 검수에서 공식 배포본 LICENSE와 해시 일치 확인 후 WORDNET-LICENSE.txt로 보존. 토플 빈도·외부 문구 전체 유사성·사람의 최종 검수 미실행.'
    for stem, columns, rows in [(f'vocabulary-special-candidates-{batch}-reviewed', header, candidates),
                                 (f'vocabulary-special-sources-{batch}-reviewed', source_header, sources),
                                 (f'vocabulary-special-changes-{batch}', ['영단어', '항목', '수정전', '수정후', '수정이유'], changes)]:
        for directory in (work, out):
            write_csv(directory / (stem + '.csv'), columns, rows)
        xlsx(out / (stem + '.xlsx'), columns, rows)
        assert read_csv(out / (stem + '.csv')) == (columns, rows)
    (work / 'wordnet-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_csv(out / 'vocabulary-exclusions-for-next-batch.csv', ['영단어'], [{'영단어': word} for word in sorted(excluded | words)])
    overlap = EXPORTS['wordnet_phrase_overlap'](candidates, work, archive_path)
    report = {'batch': batch, 'checked_date': '2026-10-26', 'candidates': len(candidates),
              'previous_exclusions': len(excluded), 'duplicates': [], 'source_synset_pos_matches': len(evidence),
              'supplied_provenance': supplied_provenance,
              'supplied_provenance_hash_matches': len(evidence) if supplied_provenance else 0,
              'independently_recorded_source_row_hashes': len(evidence),
              'source_hash_convention': 'trailing LF included', 'original_xlsx_matches_csv': True,
              'reviewed_csv_xlsx_round_trip': 'passed', 'morphology_exception_flags': morphology_flags,
              'wordnet_8_token_overlap_hits': len(overlap['hits']), 'wordnet_glosses_checked': overlap['checked_glosses'],
              'changed_words': len(decisions['changes']), 'changed_fields': len(changes),
              'status': decisions['status'], 'local_llm_used': False,
              'original_sha256': {name: hashlib.sha256((work / name).read_bytes()).hexdigest() for name in names},
              'license_sha256': hashlib.sha256(license_bytes).hexdigest(),
              'model_name': provenance.get('model_name'),
              'model_evidence': 'original provenance; not inferred from batch 001' if supplied_provenance else 'author provenance not supplied; model unknown'}
    (work / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', required=True)
    parser.add_argument('--input-dir', required=True, type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r'\d{3}', args.batch) or args.batch == '001':
        parser.error('--batch must be a three-digit subsequent batch ID')
    main(args.batch, args.input_dir)
