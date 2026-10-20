"""Regression checks for semantic false matches in reading vocabulary audits."""
import contextlib
import io
import json
from pathlib import Path
import runpy
import tempfile
import unittest

CONTENT = Path(__file__).resolve().parent


def audit_copy(level, transform=None):
    source = CONTENT / f'{level}-readings'
    module = runpy.run_path(str(source / 'validate.py'))
    books = json.loads((source / 'books.json').read_text(encoding='utf-8'))
    if transform:
        transform(books)
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        (root / 'books.json').write_text(json.dumps(books), encoding='utf-8')
        module['audit'].__globals__['ROOT'] = root
        with contextlib.redirect_stdout(io.StringIO()):
            module['audit']()
        return json.loads((root / 'vocabulary-report.json').read_text(encoding='utf-8'))


class VocabularyAuditTests(unittest.TestCase):
    def test_copied_restores_copy_before_shorter_cop(self):
        report = audit_copy('intermediate')
        self.assertEqual(report['inflections']['copied'], 'copy')
        self.assertNotIn('cop', report['usedVocabulary'])

    def test_advanced_revised_text_does_not_count_entity(self):
        report = audit_copy('advanced')
        self.assertNotIn('entity', report['usedVocabulary'])
        self.assertEqual(report['inflections']['suffered'], 'suffer')

    def test_unknown_entitled_is_rejected_instead_of_entity(self):
        def insert(books):
            book = next(b for b in books if b['id'] == 'advanced-sf-01')
            book['pages'][7]['text'] += ' Entitled.'
        with self.assertRaisesRegex(AssertionError, 'entitled'):
            audit_copy('advanced', insert)


if __name__ == '__main__':
    unittest.main()
