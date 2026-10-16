"""Audit cumulative vocabulary, documented grammar words, and inflections."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
GRAMMAR = set('a an am is are was were be been being do does did doing has had i me my mine we us our ours he him his she her hers it its they them their theirs you your yours to in on at of as by someone anyone everyone nobody something somewhere whenever whose anything cannot if more no or these those'.split())
IRREGULAR = {
    'wrote': 'write', 'written': 'write', 'kept': 'keep', 'felt': 'feel',
    'thought': 'think', 'caught': 'catch', 'lay': 'lie', 'made': 'make',
    'knew': 'know', 'known': 'know', 'built': 'build', 'hid': 'hide',
    'hidden': 'hide', 'spent': 'spend', 'found': 'find', 'gave': 'give',
    'given': 'give', 'said': 'say', 'sent': 'send', 'held': 'hold',
    'came': 'come', 'became': 'become', 'got': 'get', 'took': 'take',
    'taken': 'take', 'saw': 'see', 'seen': 'see', 'grew': 'grow',
    'grown': 'grow', 'better': 'good', 'lower': 'low',
    'later': 'late', 'longer': 'long',
    'children': 'child', 'taught': 'teach', 'told': 'tell', 'stood': 'stand',
    'sat': 'sit', 'shook': 'shake', 'ran': 'run', 'rang': 'ring', 'won': 'win',
    'lost': 'lose', 'heard': 'hear', 'began': 'begin', 'forgotten': 'forget',
    'struck': 'strike', 'broken': 'break', 'meant': 'mean',
    'richer': 'rich', 'higher': 'high', 'stronger': 'strong', 'closer': 'close',
    'less': 'little', 'slowly': 'slow',
    'woke': 'wake',
}

# Explicit common word-family forms, not silently admitted advanced vocabulary.
DERIVATIONS = {'driver': 'drive', 'farmer': 'farm', 'poster': 'post', 'phone': 'telephone'}


def audit():
    vocab = json.loads((REPO / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    known = {w['word'].lower(): w['level'] for w in vocab if w['level'] in ('beginner', 'intermediate')}
    books = json.loads((ROOT / 'books.json').read_text(encoding='utf-8'))
    assert len(books) == len({book['id'] for book in books}) == 9
    assert {genre: sum(book['genre'] == genre for book in books) for genre in ('poem', 'essay', 'novel')} == {'poem': 3, 'essay': 3, 'novel': 3}
    report = {'grammarPolicy': 'Listed basic function words, inflections, and explicitly listed common word-family forms (including phone/telephone) are recorded separately from beginner/intermediate vocabulary. No other content words are admitted.',
              'bookCount': len(books), 'genreCounts': {genre: sum(book['genre'] == genre for book in books) for genre in ('poem', 'essay', 'novel')},
              'grammarWords': [], 'inflections': {}, 'derivations': {}, 'usedVocabulary': {}, 'unrecognized': [], 'pages': []}
    for book in books:
        assert book['level'] == 'intermediate'
        assert len(book['pages']) == {'poem': 1, 'essay': 3, 'novel': 8}[book['genre']]
        for i, page in enumerate(book['pages'], 1):
            text = (book['title'] + ' ' + page['title'] + ' ' + page['text']).replace("'s", '')
            tokens = re.findall(r'[a-z]+', text.lower())
            for token in tokens:
                if token in known:
                    report['usedVocabulary'][token] = known[token]
                elif token in GRAMMAR:
                    report['grammarWords'].append(token)
                elif token in DERIVATIONS and DERIVATIONS[token] in known:
                    base = DERIVATIONS[token]
                    report['derivations'][token] = base
                    report['usedVocabulary'][base] = known[base]
                else:
                    candidates = [IRREGULAR.get(token)]
                    if token.endswith('s'): candidates += [token[:-1]]
                    if token.endswith('es'): candidates += [token[:-2]]
                    if token.endswith('ies'): candidates += [token[:-3] + 'y']
                    if token.endswith('ed'): candidates += [token[:-1], token[:-2], token[:-3], token[:-3] + 'y']
                    if token.endswith('ing'): candidates += [token[:-3], token[:-3] + 'e', token[:-4]]
                    base = next((c for c in candidates if c in known), None)
                    if base:
                        report['inflections'][token] = base
                        report['usedVocabulary'][base] = known[base]
                    else:
                        report['unrecognized'].append(token)
            assert page['translation'].strip() and re.search('[가-힣]', page['translation'])
            word_count = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", page['text']))
            assert 40 <= word_count <= 80, (book['id'], i, word_count)
            report['pages'].append({'book': book['id'], 'page': i, 'words': word_count})
    report['grammarWords'] = sorted(set(report['grammarWords']))
    report['unrecognized'] = sorted(set(report['unrecognized']))
    report['usedVocabulary'] = dict(sorted(report['usedVocabulary'].items()))
    (ROOT / 'vocabulary-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assert not report['unrecognized'], report['unrecognized']
    assert len(report['pages']) == 36
    print(f'PASS: {len(books)} books, {len(report["pages"])} pages; {len(report["usedVocabulary"])} vocabulary entries, {len(report["inflections"])} inflections; translations present.')
    print('Page word counts:', [p['words'] for p in report['pages']])


if __name__ == '__main__':
    audit()
