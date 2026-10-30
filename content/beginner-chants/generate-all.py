"""Generate resumable, unreviewed beginner chant drafts locally, one at a time."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import traceback
import types
import wave

ROOT = Path(__file__).resolve().parents[2]
CODE = ROOT / 'artifacts/ace-step-local'
OUT = ROOT / 'artifacts/beginner-chants/all-carol-fast-v1'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(CODE))
os.environ.setdefault('MIOPEN_FIND_MODE', 'FAST')
os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')
os.environ.setdefault('ACESTEP_ROCM_DTYPE', 'float32')
os.environ.setdefault('HF_HUB_OFFLINE', '1')

POEMS = json.loads((ROOT / 'content/beginner-poems/poems.json').read_text(encoding='utf-8'))
GOOD_REPORT = json.loads((ROOT / 'artifacts/beginner-chants/good-morning-carol-fast-v1/generation-report.json').read_text(encoding='utf-8'))
CAPTION = GOOD_REPORT['caption']
MODEL_REVISION = json.loads((CODE / 'model-revision.json').read_text(encoding='utf-8'))
STATUS = OUT / 'status.json'


def save_json(path, data):
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def lyrics_for(poem):
    lines = poem['poem'].splitlines()
    if len(lines) not in (4, 6):
        raise ValueError(f"{poem['id']}: unexpected line count {len(lines)}")
    return '\n'.join([line for line in lines for _ in range(2)] + lines)


def inspect(path, duration):
    import numpy as np
    with wave.open(str(path), 'rb') as wav:
        if wav.getsampwidth() != 2 or wav.getnchannels() != 2 or wav.getframerate() != 48000:
            raise ValueError(f'{path}: unexpected WAV format')
        seconds = wav.getnframes() / wav.getframerate()
        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype='<i2').astype(np.float32) / 32768
    peak = float(np.max(np.abs(samples)))
    rms = float(np.sqrt(np.mean(samples * samples)))
    if abs(seconds - duration) > 0.1 or peak <= 0.01 or rms <= 0.001:
        raise ValueError(f'{path}: unexpected duration or silence')
    return {'duration_seconds': seconds, 'sample_rate': 48000, 'channels': 2,
            'peak': peak, 'rms': rms, 'bytes': path.stat().st_size, 'sha256': sha(path)}


def valid_existing(poem, lyrics, duration):
    wav = OUT / (poem['id'] + '.wav')
    info = OUT / (poem['id'] + '.json')
    if not wav.exists() and not info.exists():
        return False
    if not wav.exists() or not info.exists():
        raise RuntimeError(f"Incomplete existing output for {poem['id']}; preserve and inspect before retry")
    data = json.loads(info.read_text(encoding='utf-8'))
    if (data['lyrics'] != lyrics or data['caption'] != CAPTION or
            data['model_revision'] != MODEL_REVISION or data['sha256'] != sha(wav)):
        raise RuntimeError(f"Existing output differs for {poem['id']}; refusing to overwrite")
    inspect(wav, duration)
    return True


def main():
    import torch
    if not torch.distributed.is_available():
        dist_nn = types.ModuleType('torch.distributed.nn')
        def unsupported(*args, **kwargs):
            raise RuntimeError('Distributed operations are unavailable in this ROCm build')
        dist_nn.all_reduce = unsupported
        sys.modules['torch.distributed.nn'] = dist_nn
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationParams, GenerationConfig, generate_music

    ids = [poem['id'] for poem in POEMS]
    if len(ids) != 45 or len(set(ids)) != len(ids):
        raise ValueError('Expected 45 unique beginner poems')
    save_json(STATUS, {'status': 'initializing', 'completed': [], 'total': len(POEMS)})
    handler = AceStepHandler()
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    message, ok = handler.initialize_service(project_root=str(CODE), config_path='acestep-v15-turbo',
        device=device, offload_to_cpu=True, prefer_source='huggingface')
    if not ok:
        raise RuntimeError(message)
    lm = LLMHandler()
    done = []
    for poem in POEMS:
        ident = poem['id']
        lyric = lyrics_for(poem)
        # 14 and 20 four-beat bars respectively, plus a small timing allowance.
        duration = 36 if len(poem['poem'].splitlines()) == 4 else 51
        save_json(STATUS, {'status': 'generating', 'current': ident, 'completed': done, 'total': len(POEMS)})
        wav = OUT / (ident + '.wav')
        info = OUT / (ident + '.json')
        if valid_existing(poem, lyric, duration):
            done.append(ident)
            continue
        seed = 20261030
        if ident == 'beginner-02':
            existing = ROOT / 'artifacts/beginner-chants/good-morning-carol-fast.wav'
            if GOOD_REPORT['lyrics'] != lyric or sha(existing) != GOOD_REPORT['sha256']:
                raise ValueError('Existing Good Morning sample no longer matches the source')
            shutil.copyfile(existing, wav)
            origin = 'existing Good Morning fast sample'
        else:
            params = GenerationParams(caption=CAPTION, lyrics=lyric, vocal_language='en',
                bpm=96, timesignature='4', duration=duration, seed=seed, inference_steps=8,
                thinking=False, use_cot_caption=False, use_cot_language=False, use_cot_metas=False)
            config = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format='wav')
            result = generate_music(handler, lm, params, config, save_dir=str(OUT / 'generated'))
            if not result.success or not result.audios:
                raise RuntimeError(result.error or result.status_message)
            source = Path(result.audios[0]['path'])
            shutil.copyfile(source, wav)
            origin = 'new local generation'
        metrics = inspect(wav, duration)
        save_json(info, {'id': ident, 'title': poem['title'], 'korean_title': poem.get('koreanTitle'),
            'source_text': poem['poem'], 'lyrics': lyric, 'caption': CAPTION, 'date': '2026-10-30',
            'model': 'acestep-v15-turbo', 'model_revision': MODEL_REVISION,
            'code_revision': 'ca1e85fe9430179831e6bc6be790c332190a3866', 'seed': seed,
            'bpm_requested': 96, 'duration_requested': duration, 'device': device,
            'reference_audio': None, 'language_model_enabled': False, 'origin': origin,
            'review_status': 'draft-unreviewed', **metrics})
        done.append(ident)
        save_json(STATUS, {'status': 'generating', 'current': None, 'completed': done, 'total': len(POEMS)})
        print(f'COMPLETE {len(done)}/{len(POEMS)} {ident} {poem["title"]}', flush=True)
    save_json(STATUS, {'status': 'complete', 'completed': done, 'total': len(POEMS)})


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        previous = json.loads(STATUS.read_text(encoding='utf-8')) if STATUS.exists() else {}
        previous.update(status='failed', error=str(exc), traceback=traceback.format_exc())
        save_json(STATUS, previous)
        raise
