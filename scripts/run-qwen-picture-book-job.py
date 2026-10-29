"""Persistent local generation + validation job, with a log and explicit final status."""
from datetime import datetime
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/picture-book-audio-qwen'


def status(value):
    temporary = OUT / 'job-status.tmp'
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(OUT / 'job-status.json')


def main():
    if os.name == 'nt':
        import ctypes
        # Scope error-dialog suppression to this job and its children, preserving crash logs.
        ctypes.windll.kernel32.SetErrorMode(0x0001 | 0x0002)
    OUT.mkdir(exist_ok=True)
    record = {'pid': os.getpid(), 'started': datetime.now().astimezone().isoformat(),
              'state': 'generating'}
    status(record)
    commands = [
        [sys.executable, '-u', str(ROOT / 'scripts/generate-qwen-picture-book-audio.py')],
        [str(ROOT / 'artifacts/tts-venv/Scripts/python.exe'),
         str(ROOT / 'scripts/check-picture-book-audio.py'), '--qwen']]
    try:
        with (OUT / 'job.log').open('a', encoding='utf-8') as log:
            for step, command in zip(['generating', 'validating'], commands):
                record['state'] = step
                status(record)
                child_env = dict(os.environ, PYTHONFAULTHANDLER='1', PYTHONIOENCODING='utf-8')
                process = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, env=child_env)
                record['childPid'] = process.pid
                status(record)
                returncode = process.wait()
                record.pop('childPid', None)
                if returncode:
                    record.update(state='failed', failedStep=step, exitCode=returncode,
                                  exitCodeHex=f'0x{returncode & 0xffffffff:08X}')
                    break
            else:
                record.update(state='complete', exitCode=0)
    except Exception as error:
        record.update(state='failed', error=str(error))
    record['finished'] = datetime.now().astimezone().isoformat()
    status(record)
    if record['state'] != 'complete':
        raise SystemExit(1)


if __name__ == '__main__':
    main()
