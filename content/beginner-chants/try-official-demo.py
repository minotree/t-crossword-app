"""One unpaid official ACE-Step demo attempt; no token or paid endpoint."""
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.request

BASE = 'https://ace-step-ace-step-v1-5.hf.space'
HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / 'artifacts' / 'beginner-chants'


def request(path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={'Content-Type': 'application/json'})
    return urllib.request.urlopen(req, timeout=55)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with request('/config') as response:
        config = json.load(response)
    components = {item['id']: item for item in config['components']}
    dep = next(item for item in config['dependencies']
               if item.get('api_name') == 'generation_wrapper')
    text = (HERE / 'little-bird-v1.md').read_text(encoding='utf-8')
    lyrics = re.search(r'```text\n(.*?)\n```', text, re.S).group(1)
    prompt = ('Original English learning spoken-rhythm chant, warm clear voice, '
              'light percussion and gentle claps, natural English stress, '
              'call and response followed by unison, simple cheerful arrangement, '
              'one bar intro, twelve lyric lines each one bar, one bar outro, '
              'no extra lyrics, no imitation of existing songs or singers.')
    overrides = {95: prompt, 96: lyrics, 112: 80, 114: '4', 116: 'en',
                 115: 42, 117: 1, 143: False, 126: False, 121: '20261030'}
    data = [overrides.get(i, components[i]['props'].get('value'))
            for i in dep['inputs']]
    record = {'date': '2026-10-30', 'endpoint': BASE,
              'modelRequested': data[0], 'prompt': prompt, 'lyrics': lyrics,
              'parameters': dict(zip(map(str, dep['inputs']), data)),
              'status': 'submitted', 'paidApi': False}
    report = OUT / 'official-demo-attempt.json'
    report.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    try:
        with request('/gradio_api/call/generation_wrapper', {'data': data}) as response:
            event_id = json.load(response)['event_id']
        event = ''
        started = time.monotonic()
        with request('/gradio_api/call/generation_wrapper/' + event_id) as stream:
            for raw in stream:
                if time.monotonic() - started > 180:
                    record['status'] = 'queue-time-limit'
                    break
                line = raw.decode().strip()
                if line.startswith('event: '):
                    event = line[7:]
                elif line.startswith('data: ') and event in ('complete', 'error'):
                    result = json.loads(line[6:])
                    record.update(status=event, result=result)
                    break
        if record['status'] == 'complete':
            first_audio = record['result'][0]
            audio = first_audio.get('value', first_audio) if isinstance(first_audio, dict) else None
            url = audio.get('url') if isinstance(audio, dict) else None
            if url and url.startswith(BASE + '/'):
                with urllib.request.urlopen(url, timeout=55) as response:
                    payload = response.read()
                target = OUT / 'little-bird-demo-v1.mp3'
                target.write_bytes(payload)
                record.update(audioFile=str(target), bytes=len(payload),
                              sha256=hashlib.sha256(payload).hexdigest())
        if record['status'] == 'submitted':
            record['status'] = 'no-completion'
    except Exception as exc:
        record.update(status='failed', error=str(exc))
    report.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'status': record['status'], 'error': record.get('error'),
                      'result': record.get('result'), 'report': str(report)}, ensure_ascii=True))


if __name__ == '__main__':
    main()
