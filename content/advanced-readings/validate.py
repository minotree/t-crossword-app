"""Audit cumulative vocabulary, documented grammar words, and inflections."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
GRAMMAR = set('himself itself myself most outside a an am is are was were be been being do does did doing has had i me my mine we us our ours he him his she her hers it its they them their theirs you your yours to in on at of as by someone anyone everyone nobody something somewhere whenever whose anything cannot if more no or these those'.split())
IRREGULAR = {'brought': 'bring', 'drawn': 'draw', 'fell': 'fall', 'forbade': 'forbid', 'forgiven': 'forgive', 'met': 'meet', 'paid': 'pay', 'earlier': 'early', 'larger': 'large', 'older': 'old', 'smaller': 'small',
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

# Explicit word-family forms; they do not add entries to the source vocabulary.
DERIVATIONS = {'accusation': 'accuse',
 'actual': 'act',
 'admission': 'admit',
 'agreement': 'agree',
 'approval': 'approve',
 'argument': 'argue',
 'assistant': 'assist',
 'attachment': 'attach',
 'attractive': 'attract',
 'betrayal': 'betray',
 'buyer': 'buy',
 'certainty': 'certain',
 'conclusion': 'conclude',
 'connection': 'connect',
 'conversation': 'converse',
 'decision': 'decide',
 'delivery': 'deliver',
 'departure': 'depart',
 'different': 'differ',
 'distant': 'distance',
 'driver': 'drive',
 'easily': 'ease',
 'editor': 'edit',
 'elsewhere': 'else',
 'embarrassment': 'embarrass',
 'employee': 'employ',
 'entrance': 'enter',
 'examination': 'examine',
 'excessive': 'excess',
 'expression': 'express',
 'failure': 'fail',
 'farmer': 'farm',
 'fictional': 'fiction',
 'flawless': 'flaw',
 'forgiveness': 'forgive',
 'friendship': 'friend',
 'handwriting': 'write',
 'illness': 'ill',
 'imaginary': 'imagine',
 'inaccurate': 'accurate',
 'incomplete': 'complete',
 'inference': 'infer',
 'information': 'inform',
 'injury': 'injure',
 'instruction': 'instruct',
 'introduction': 'introduce',
 'invitation': 'invite',
 'joyful': 'joy',
 'kindness': 'kind',
 'loyalty': 'loyal',
 'manager': 'manage',
 'meeting': 'meet',
 'merely': 'mere',
 'nearby': 'near',
 'necessarily': 'necessary',
 'operator': 'operate',
 'owner': 'own',
 'painful': 'pain',
 'patience': 'patient',
 'permission': 'permit',
 'persuasive': 'persuade',
 'phone': 'telephone',
 'poster': 'post',
 'printer': 'print',
 'procedure': 'proceed',
 'professional': 'profession',
 'quietly': 'quiet',
 'rarely': 'rare',
 'recently': 'recent',
 'reconciliation': 'reconcile',
 'reference': 'refer',
 'relationship': 'relate',
 'relative': 'relate',
 'remainder': 'remain',
 'reminder': 'remind',
 'replacement': 'replace',
 'resentment': 'resent',
 'responsibility': 'responsible',
 'restriction': 'restrict',
 'revelation': 'reveal',
 'revision': 'revise',
 'shopkeeper': 'shop',
 'signature': 'sign',
 'storage': 'store',
 'strangely': 'strange',
 'suspicion': 'suspect',
 'sympathetic': 'sympathy',
 'unclaimed': 'claim',
 'unfamiliar': 'familiar',
 'unfinished': 'finish',
 'unopened': 'open',
 'unresolved': 'resolve',
 'unwelcome': 'welcome',
 'useful': 'use',
 'weaken': 'weak',
 'withdrawal': 'withdraw',
 'workshop': 'work'}


def audit():
    vocab = json.loads((REPO / 'packages/core/src/assets/vocab.json').read_text(encoding='utf-8'))
    known = {w['word'].lower(): w['level'] for w in vocab if w['level'] in ('beginner', 'intermediate', 'advanced')}
    books = json.loads((ROOT / 'books.json').read_text(encoding='utf-8'))
    assert len(books) == len({book['id'] for book in books}) == 7
    assert {genre: sum(book['genre'] == genre for book in books) for genre in ('poem', 'essay', 'novel')} == {'poem': 2, 'essay': 2, 'novel': 3}
    report = {'grammarPolicy': 'Listed basic function words, inflections, and explicitly listed common word-family forms (including phone/telephone) are recorded separately from beginner/intermediate/advanced vocabulary. No other content words are admitted.',
              'bookCount': len(books), 'genreCounts': {genre: sum(book['genre'] == genre for book in books) for genre in ('poem', 'essay', 'novel')},
              'grammarWords': [], 'inflections': {}, 'derivations': {}, 'usedVocabulary': {}, 'unrecognized': [], 'pages': []}
    for book in books:
        assert book['level'] == 'advanced'
        assert book['id'].startswith('advanced-')
        assert len(book['pages']) == {'poem': 1, 'essay': 3, 'novel': 10}[book['genre']]
        for i, page in enumerate(book['pages'], 1):
            stem = f'{book["id"]}-{i:02}'
            assert re.fullmatch(rf'images/{re.escape(stem)}(?:-v[1-9]\d*)?\.png', page['image'])
            assert page['title'].strip() and page['scene'].strip()
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
                    family_candidates = []
                    if token.endswith('s'): family_candidates.append(token[:-1])
                    if token.endswith('ies'): family_candidates.append(token[:-3] + 'y')
                    candidates += [DERIVATIONS.get(c) for c in family_candidates]
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
            assert 40 <= word_count <= 100, (book['id'], i, word_count)
            report['pages'].append({'book': book['id'], 'page': i, 'words': word_count})
    report['grammarWords'] = sorted(set(report['grammarWords']))
    report['unrecognized'] = sorted(set(report['unrecognized']))
    report['usedVocabulary'] = dict(sorted(report['usedVocabulary'].items()))
    report['levelCounts'] = {level: sum(value == level for value in report['usedVocabulary'].values())
                             for level in ('beginner', 'intermediate', 'advanced')}
    (ROOT / 'vocabulary-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assert not report['unrecognized'], report['unrecognized']
    assert len(report['pages']) == 38
    print(f'PASS: {len(books)} books, {len(report["pages"])} pages; {len(report["usedVocabulary"])} vocabulary entries, {len(report["inflections"])} inflections; translations present.')
    print('Page word counts:', [p['words'] for p in report['pages']])


if __name__ == '__main__':
    audit()
