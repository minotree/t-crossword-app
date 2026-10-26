"""One-time integration; reviewed originals remain untouched."""
import csv
import io
import json
from pathlib import Path

root = Path.cwd()
csv_path = root / 'words_completed.csv'
old_bytes = csv_path.read_bytes()
old_rows = list(csv.reader(io.StringIO(old_bytes.decode('utf-8-sig'))))
old_vocab = json.loads((root / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
assert len(old_rows) == 3340 and len(old_vocab) == 3339
additions = []
for number in range(1, 11):
    batch = f'{number:03}'
    file = root / f'content/special-vocabulary/review-{batch}/vocabulary-special-candidates-{batch}-reviewed.csv'
    rows = list(csv.reader(io.StringIO(file.read_text(encoding='utf-8-sig'))))
    assert rows[0] == old_rows[0] and len(rows) == 51
    additions.extend(rows[1:])
assert len({r[1].lower() for r in old_rows[1:] + additions}) == 3839
buffer = io.StringIO(newline='')
csv.writer(buffer, lineterminator='\n').writerows(additions)
assert old_bytes.endswith(b'\n')
csv_path.write_bytes(old_bytes + buffer.getvalue().encode('utf-8'))
(root / 'artifacts/special-vocabulary-original-vocab.json').write_text(json.dumps(old_vocab, ensure_ascii=False), encoding='utf-8')

for name in ['apps/web/src/pages/WordBankPage.tsx', 'apps/mobile/src/pages/HomePage.tsx',
             'apps/toss/src/App.tsx', 'apps/toss/src/components/WordList.tsx']:
    p = root / name
    text = p.read_text(encoding='utf-8')
    text = text.replace("advanced: '고급' }", "advanced: '고급', special: '특급' }")
    # Only quiz controls in these files use this array; picture-book choices live separately.
    text = text.replace("['beginner', 'intermediate', 'advanced'] as const", "['beginner', 'intermediate', 'advanced', 'special'] as const")
    p.write_text(text, encoding='utf-8')

for name in ['packages/core/src/algorithms/crosswordGenerator.test.ts', 'packages/core/src/algorithms/crosswordDraft.test.ts']:
    p = root / name
    p.write_text(p.read_text(encoding='utf-8').replace("['beginner', 'intermediate', 'advanced']", "['beginner', 'intermediate', 'advanced', 'special']"), encoding='utf-8')

license_text = (root / 'content/special-vocabulary/review-001/WORDNET-LICENSE.txt').read_text(encoding='utf-8')
(root / 'packages/core/src/assets/wordnetLicense.ts').write_text(
    '// Full WordNet 3.0 notice retained for all app distributions.\n'
    + 'export const wordnetLicense = ' + json.dumps(license_text) + ';\n', encoding='utf-8')
