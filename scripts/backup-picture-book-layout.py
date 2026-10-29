"""Create and verify a pre-change snapshot. Restore only unchanged post-task files; never deletes."""
import argparse
from datetime import datetime, timezone, timedelta
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / 'artifacts/picture-book-layout-backup-20261029'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def snapshot_files():
    files = set()
    for folder in ['content/intermediate-readings', 'content/advanced-readings']:
        files.update(p for p in (ROOT / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    for app in ['web', 'toss', 'mobile']:
        files.update((ROOT / f'apps/{app}/public/picture-books').glob('*'))
        for pattern in ['picture-book*.json', 'intermediate-books.json', 'advanced-books.json']:
            files.update((ROOT / f'apps/{app}/src/data').glob(pattern))
    files.update(ROOT / p for p in ['content/picture-book-approval.json', 'progress.md', 'AGENTS.md',
                 'scripts/prepare-picture-books.py', 'scripts/prepare-toss-picture-book-images.py',
                 'scripts/prepare-mobile-picture-books.py'])
    return sorted(p for p in files if p.is_file())


def verify(manifest):
    with zipfile.ZipFile(BACKUP / 'before.zip') as archive:
        assert set(archive.namelist()) == set(manifest['files'])
        assert archive.testzip() is None
        for name, record in manifest['files'].items():
            assert digest(archive.read(name)) == record['sha256'], name


def main(action):
    if action == 'create':
        if BACKUP.exists():
            raise ValueError('Backup already exists; refusing to replace it')
        BACKUP.mkdir(parents=True)
        manifest = {'created': datetime.now(timezone(timedelta(hours=9))).isoformat(), 'files': {}}
        with zipfile.ZipFile(BACKUP / 'before.zip', 'w', zipfile.ZIP_STORED) as archive:
            for path in snapshot_files():
                name = path.relative_to(ROOT).as_posix()
                data = path.read_bytes()
                archive.writestr(name, data)
                manifest['files'][name] = {'sha256': digest(data), 'bytes': len(data)}
        (BACKUP / 'before.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    manifest = json.loads((BACKUP / 'before.json').read_text(encoding='utf-8'))
    verify(manifest)
    if action == 'seal':
        after = {}
        for name, record in manifest['files'].items():
            current = ROOT / name
            if not current.is_file():
                raise ValueError('Backed-up file missing: ' + name)
            current_hash = digest(current.read_bytes())
            if current_hash != record['sha256']:
                after[name] = current_hash
        (BACKUP / 'after.json').write_text(json.dumps(after, indent=2) + '\n', encoding='utf-8')
        print('Recorded post-task hashes:', len(after))
    if action == 'restore':
        after = json.loads((BACKUP / 'after.json').read_text(encoding='utf-8'))
        for name, expected in after.items():
            target = (ROOT / name).resolve()
            if not target.is_relative_to(ROOT.resolve()) or name not in manifest['files']:
                raise ValueError('Invalid restore target')
            if not target.is_file() or digest(target.read_bytes()) != expected:
                raise ValueError('File changed after task; restore aborted without writes: ' + name)
        with zipfile.ZipFile(BACKUP / 'before.zip') as archive:
            for name in after:
                (ROOT / name).write_bytes(archive.read(name))
        print('Restored:', len(after), 'files. New version images and records were retained; no deletions.')
    print('PASS backup:', len(manifest['files']), 'files;', (BACKUP / 'before.zip').stat().st_size, 'bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['create', 'verify', 'seal', 'restore'])
    parser.add_argument('--backup-dir', help='Repository-relative backup directory')
    args = parser.parse_args()
    if args.backup_dir:
        selected = (ROOT / args.backup_dir).resolve()
        if not selected.is_relative_to((ROOT / 'artifacts').resolve()) or selected == (ROOT / 'artifacts').resolve():
            raise ValueError('Backup directory must be inside repository artifacts')
        BACKUP = selected
    main(args.action)
