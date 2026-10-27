"""Compare a downloaded public manifest with CSV without rewriting source files."""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
manifest = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
source = (root / 'words_completed.csv').read_bytes()
rows = list(csv.reader(io.StringIO(source.decode('utf-8-sig'))))[1:]
words = [(row[1].upper(), row[5]) for row in rows if row and any(row)]
assert manifest['schemaVersion'] == 1 and manifest['pauseMs'] == 500
assert manifest['audioPath'] == 'word-audio/'
entries = manifest['entries']
missing = [word for word, _ in words if word not in entries]
mismatches = [word for word, example in words if word in entries and entries[word]['example'] != example]
digest = hashlib.sha256(source).hexdigest()
report = {
    'csvWords': len(words), 'manifestEntries': len(entries),
    'csvSha256': digest, 'manifestCsvSha256': manifest['sourceCsvSha256'],
    'byteIdenticalCsv': digest == manifest['sourceCsvSha256'],
    'missing': missing, 'exampleMismatches': mismatches,
    'extraWords': sorted(set(entries) - {word for word, _ in words}),
}
print(json.dumps(report, ensure_ascii=False, indent=2))
assert not missing and not mismatches
