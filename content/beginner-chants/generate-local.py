"""Generate one local ACE-Step pilot and record inputs and model provenance."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import traceback
import types

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'artifacts/ace-step-local'
DIRECT = '--direct' in sys.argv
CHILDREN = '--children' in sys.argv
YOUNGER = '--younger' in sys.argv
TODDLER = '--toddler' in sys.argv
CAROL = '--carol' in sys.argv
COVER = '--carol-cover' in sys.argv
GOOD_MORNING = '--good-morning' in sys.argv
FASTER = '--faster' in sys.argv
OUT = ROOT / ('artifacts/beginner-chants/good-morning-carol-fast-v1' if GOOD_MORNING and FASTER else
              'artifacts/beginner-chants/good-morning-carol-v1' if GOOD_MORNING else
              'artifacts/beginner-chants/local-carol-cover-v1' if COVER else
              'artifacts/beginner-chants/local-carol-v1' if CAROL else
              'artifacts/beginner-chants/local-toddler-v1' if TODDLER else
              'artifacts/beginner-chants/local-younger-v1' if YOUNGER else
              'artifacts/beginner-chants/local-children-v1' if CHILDREN
              else 'artifacts/beginner-chants/local-v1')
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(SOURCE))
os.environ.setdefault('MIOPEN_FIND_MODE', 'FAST')
os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')
os.environ.setdefault('ACESTEP_ROCM_DTYPE', 'float32')
os.environ.setdefault('HF_HUB_OFFLINE', '1')

lyrics = re.search(
    r'```text\n(.*?)\n```',
    (ROOT / 'content/beginner-chants/little-bird-v1.md').read_text(encoding='utf-8'),
    re.S,
).group(1)
if GOOD_MORNING:
    poems = json.loads((ROOT / 'content/beginner-poems/poems.json').read_text(encoding='utf-8'))
    poem = next(item for item in poems if item['id'] == 'beginner-02')
    lines = poem['poem'].splitlines()
    if len(lines) != 4:
        raise ValueError('Good Morning source must have four lines')
    lyrics = '\n'.join([line for line in lines for _ in range(2)] + lines)
caption = ('English learning spoken rhythm chant, 80 bpm, warm clear voice, '
           'gentle percussion and claps, simple cheerful accompaniment. '
           'Lead and response phrases followed by everyone together. '
           'Clear English pronunciation. Only the supplied lyrics.')
if CHILDREN:
    caption = ('English learning chant, 80 bpm, bright natural preschool-age '
               'children voices singing together, small kids choir, playful '
               'call and response, clear English pronunciation, gentle handclaps '
               'and light percussion, simple cheerful melody, vocals prominent. '
               'Only the supplied lyrics. No imitation of real people or existing songs.')
if YOUNGER:
    caption = ('English learning chant, 80 bpm, very youthful preschool children '
               'voices, bright playful little kids choir singing together, '
               'bouncy lighthearted rhythmic melody with lively call and response, '
               'clear English words at an easy pace, gentle claps, ukulele and '
               'light percussion, upbeat and bubbly, vocals upfront, warm natural '
               'sound, no squeaky cartoon effects. Only the supplied lyrics. '
               'No imitation of real people or existing songs.')
if TODDLER:
    caption = ('English learning chant, 80 bpm, very young toddler-like voices, '
               'a little younger than preschool voices, bright and adorable '
               'small children chorus, playful energetic call and response, '
               'extra bouncy, lively cheerful rhythmic melody, clear English '
               'pronunciation at an easy pace, prominent vocals, lively claps, '
               'ukulele, gentle xylophone and light percussion, warm natural '
               'sound without cartoon squeaks. Only the supplied lyrics. '
               'No imitation of real people or existing songs.')
if CAROL or COVER or GOOD_MORNING:
    caption = ('English learning chant, 80 bpm, very young toddler-like voices, '
               'a little younger than preschool voices, bright and adorable '
               'small children chorus, playful energetic call and response, '
               'extra bouncy, lively cheerful rhythmic melody, clear English '
               'pronunciation at an easy pace, prominent vocals, lively claps, '
               'ukulele, gentle xylophone and light percussion. Warm festive '
               'Christmas carol atmosphere, delicate sleigh bells, sparkling '
               'glockenspiel and cozy winter feeling. Natural sound without '
               'cartoon squeaks. Only the supplied lyrics. Original melody; '
               'do not imitate or quote any existing Christmas song or real voice.')
if FASTER and GOOD_MORNING:
    caption = caption.replace('80 bpm', '96 bpm')
    caption += ' A slightly faster, lively tempo while keeping the words easy to follow.'
bpm = 96 if FASTER and GOOD_MORNING else 80
duration = 36 if FASTER and GOOD_MORNING else 42
record = {
    'status': 'starting', 'date': '2026-10-30', 'caption': caption,
    'lyrics': lyrics, 'duration_requested_seconds': duration, 'bpm': bpm,
    'seed': 20261030, 'dit_model': 'acestep-v15-turbo',
    'lm_model': 'acestep-5Hz-lm-1.7B', 'model_revision': json.loads(
        (SOURCE / 'model-revision.json').read_text(encoding='utf-8')),
    'reference_audio': None,
    'language_model_enabled': not DIRECT,
    'rocm_dtype': os.environ['ACESTEP_ROCM_DTYPE'],
}
if GOOD_MORNING:
    record['source_poem_id'] = 'beginner-02'
if COVER:
    record['source_audio'] = 'artifacts/beginner-chants/little-bird-toddler-v1.wav'
    record['source_sha256'] = 'eefcbdf3ff254d689757e72f69be9c3098e20eaade46fc549a8b97d86995fd03'
    record['audio_cover_strength'] = 0.8
report = OUT / 'generation-report.json'


def save():
    report.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


try:
    save()
    import torch
    # AMD's Windows ROCm build lacks distributed support. A dependency imports
    # its training-only helper unconditionally, even for single-device inference.
    # Fail explicitly if anything attempts a distributed operation.
    if not torch.distributed.is_available():
        dist_nn = types.ModuleType('torch.distributed.nn')

        def unsupported_distributed(*args, **kwargs):
            raise RuntimeError('Distributed operations are unavailable in this ROCm build')

        dist_nn.all_reduce = unsupported_distributed
        sys.modules['torch.distributed.nn'] = dist_nn
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationParams, GenerationConfig, generate_music

    record['torch_version'] = torch.__version__
    record['gpu'] = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    record.update(status='initializing', device=device)
    save()
    dit = AceStepHandler()
    message, ok = dit.initialize_service(
        project_root=str(SOURCE), config_path=record['dit_model'], device=device,
        offload_to_cpu=True, prefer_source='huggingface',
    )
    if not ok:
        raise RuntimeError(message)
    lm = LLMHandler()
    if not DIRECT:
        message, ok = lm.initialize(
            checkpoint_dir=str(SOURCE / 'checkpoints'), lm_model_path=record['lm_model'],
            backend='pt', device=device, offload_to_cpu=True,
            dtype=torch.float16 if device == 'cuda' else torch.float32,
        )
        if not ok:
            raise RuntimeError(message)
    record['status'] = 'generating'
    save()
    params = GenerationParams(
        task_type='cover' if COVER else 'text2music',
        src_audio=str(ROOT / record['source_audio']) if COVER else None,
        audio_cover_strength=0.8 if COVER else 1.0,
        caption=caption, lyrics=lyrics, vocal_language='en', bpm=bpm,
        timesignature='4', duration=duration, seed=20261030, inference_steps=8,
        thinking=not DIRECT, use_cot_caption=False, use_cot_language=False,
        use_cot_metas=False,
    )
    config = GenerationConfig(batch_size=1, use_random_seed=False,
                              seeds=[20261030], audio_format='wav')
    result = generate_music(dit, lm, params, config, save_dir=str(OUT))
    if not result.success or not result.audios:
        raise RuntimeError(result.error or result.status_message)
    audio_path = Path(result.audios[0]['path'])
    record.update(status='complete', audio=str(audio_path),
                  sha256=hashlib.file_digest(audio_path.open('rb'), 'sha256').hexdigest(),
                  bytes=audio_path.stat().st_size, message=result.status_message)
    save()
    print(json.dumps(record, ensure_ascii=False, indent=2), flush=True)
except Exception as exc:
    record.update(status='failed', error=str(exc), traceback=traceback.format_exc())
    save()
    raise
