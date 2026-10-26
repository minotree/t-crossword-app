"""Apply recorded editorial decisions to separate review copies; validate and export."""
import csv
import hashlib
import io
import json
import re
import tarfile
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'content/special-vocabulary/review-001'
OUT = ROOT / 'artifacts/vocabulary-review-001'


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames, list(reader)


def write_csv(path, header, rows):
    with path.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=header, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)


def column(number):
    result = ''
    while number:
        number, digit = divmod(number - 1, 26)
        result = chr(65 + digit) + result
    return result


def wordnet_phrase_overlap(rows, work=WORK, archive_path=OUT / 'WordNet-3.0.tar.gz'):
    """Limited reproduction check, explicitly not a global similarity clearance."""
    def grams(text):
        tokens = re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())
        return {tuple(tokens[index:index + 8]) for index in range(len(tokens) - 7)}
    lookup = {}
    for row in rows:
        for phrase in grams(row['예문']):
            lookup.setdefault(phrase, set()).add(row['영단어'])
    checked = 0
    hits = []
    with tarfile.open(archive_path, 'r:gz') as archive:
        for pos in ('noun', 'verb', 'adj', 'adv'):
            member = next(member for member in archive.getmembers() if member.name.endswith('/dict/data.' + pos))
            for line in archive.extractfile(member).read().decode('ascii').splitlines():
                if '|' not in line:
                    continue
                checked += 1
                for phrase in grams(line.split('|', 1)[1]):
                    if phrase in lookup:
                        hits.append({'words': sorted(lookup[phrase]), 'matched_tokens': ' '.join(phrase),
                                     'wordnet_synset': line.split()[0] + '-' + pos})
    result = {'scope': 'reviewed English examples vs all WordNet 3.0 gloss fields only',
              'minimum_consecutive_tokens': 8, 'checked_glosses': checked, 'hits': hits,
              'not_a_copyright_or_global_similarity_clearance': True}
    (work / 'wordnet-phrase-overlap.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return result


def xlsx(path, header, records):
    rows = [header] + [[row[key] for key in header] for row in records]
    cells = []
    for index, row in enumerate(rows, 1):
        values = ''.join(f'<c r="{column(j)}{index}" t="inlineStr"><is><t xml:space="preserve">{escape(value)}</t></is></c>' for j, value in enumerate(row, 1))
        cells.append(f'<row r="{index}">{values}</row>')
    widths = ''.join(f'<col min="{j}" max="{j}" width="{18 if j < 5 else 65}" customWidth="1"/>' for j in range(1, len(header) + 1))
    worksheet = ('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                 '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews>'
                 f'<cols>{widths}</cols><sheetData>{"".join(cells)}</sheetData>'
                 f'<autoFilter ref="A1:{column(len(header))}{len(rows)}"/></worksheet>')
    parts = {
        '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Review" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/worksheets/sheet1.xml': worksheet,
    }
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, value in parts.items():
            archive.writestr(name, value.encode('utf-8'))
    with zipfile.ZipFile(path) as archive:
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        root = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        restored = [[cell.find('s:is/s:t', ns).text or '' for cell in row] for row in root.findall('s:sheetData/s:row', ns)]
        assert rows == restored, 'XLSX round trip mismatch'


def main():
    header, rows = read_csv(WORK / 'vocabulary-special-candidates-001.csv')
    source_header, sources = read_csv(WORK / 'vocabulary-special-sources-001.csv')
    decisions = json.loads((WORK / 'editorial-decisions.json').read_text(encoding='utf-8'))
    evidence = json.loads((WORK / 'wordnet-evidence.json').read_text(encoding='utf-8'))
    existing = json.loads((ROOT / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    old = {row['word'].strip().lower() for row in existing}
    assert header == ['난이도', '영단어', '뜻', '품사', '동의어', '예문', '예문해석']
    words = {row['영단어'] for row in rows}
    assert len(words) == len(rows) == 50
    assert words == {row['영단어'] for row in sources} == set(decisions['selected_wordnet_synsets'])
    assert len(sources) == 50
    assert not words.intersection(old)
    pos_map = {'명사': 'noun', '동사': 'verb', '형용사': 'adj', '부사': 'adv'}
    mappings = []
    changes = []
    for row in rows:
        word = row['영단어']
        if word in decisions['changes']:
            edit = decisions['changes'][word]
            for field, new in edit['fields'].items():
                changes.append({'영단어': word, '항목': field, '수정전': row[field], '수정후': new, '수정이유': edit['reason']})
                row[field] = new
        assert len(row) == 7 and None not in row
        assert row['난이도'] == '특급' and re.fullmatch('[a-z]{3,12}', word)
        assert all(row[key].strip() for key in header if key != '동의어')
        assert all('\n' not in value and '\r' not in value for value in row.values())
        assert re.search(r'\b' + re.escape(word) + r'\b', row['예문'], re.I)
        assert 8 <= len(row['예문'].split()) <= 18
        synset = decisions['selected_wordnet_synsets'][word]
        sense = next(sense for sense in evidence[word] if sense['synset'] == synset)
        assert sense['pos'] == pos_map[row['품사']]
        mappings.append({'word': word, 'synset': synset, 'pos': sense['pos'],
                         'meaning_review': 'agent-selected matching meaning; not a TOEFL frequency certification'})
    for row in sources:
        word = row['영단어']
        synset = decisions['selected_wordnet_synsets'][word]
        row['출처자료명'] = 'Princeton WordNet 3.0; synset ' + synset
        row['확인날짜'] = '2026-10-26'
        row['뜻과예문작성방식'] = 'ChatGPT 웹 초안(사용자 신고 모델: gpt 6.1 sol light); Codex 에이전트 의미 대조·편집; 로컬 LLM 보조 검토는 별도 기록'
        row['검토상태'] = '에이전트 편집검수 완료·출시대기'
        row['비고'] = 'WORDNET-LICENSE.txt 전문 보존. 병합 시 배포물에도 고지 포함 필요. 토플 출제 빈도 미확인. 외부 문구 유사성 전수검색·사람의 최종 검수 미실행.'
    OUT.mkdir(parents=True, exist_ok=True)
    for name, columns, data in [('vocabulary-special-candidates-001-reviewed', header, rows),
                                ('vocabulary-special-sources-001-reviewed', source_header, sources),
                                ('vocabulary-special-changes-001', ['영단어', '항목', '수정전', '수정후', '수정이유'], changes)]:
        write_csv(WORK / (name + '.csv'), columns, data)
        write_csv(OUT / (name + '.csv'), columns, data)
        xlsx(OUT / (name + '.xlsx'), columns, data)
        assert read_csv(OUT / (name + '.csv')) == (columns, data)
    (WORK / 'selected-synsets.json').write_text(json.dumps(mappings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_csv(OUT / 'vocabulary-exclusions-for-next-batch.csv', ['영단어'], [{'영단어': word} for word in sorted(old | words)])
    overlap = wordnet_phrase_overlap(rows)
    local_reports = []
    for path in sorted(WORK.glob('*-response.json')):
        result = json.loads(path.read_text(encoding='utf-8'))
        try:
            review = json.loads(result.get('response', ''))
            covered = set(review.get('reviewed_words', []))
        except (json.JSONDecodeError, TypeError):
            covered = set()
        local_reports.append({'file': path.name, 'model': result.get('model'),
                              'done_reason': result.get('done_reason'),
                              'coverage_complete': covered == words,
                              'reviewed_words': len(covered)})
    manifest = {'checked_date': '2026-10-26', 'existing_words': len(existing), 'reviewed_candidates': len(rows),
                'wordnet_pos_sense_links': len(mappings), 'changed_words': len(decisions['changes']),
                'changed_fields': len(changes), 'status': decisions['status'],
                'csv_encoding': 'UTF-8 BOM', 'csv_and_xlsx_round_trip': 'passed',
                'wordnet_phrase_overlap_hits': len(overlap['hits']), 'local_reports': local_reports,
                'original_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in WORK.glob('vocabulary-special-*-001.*') if 'reviewed' not in p.name and 'changes' not in p.name}}
    (WORK / 'validation.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=True))


if __name__ == '__main__':
    main()
