"""Encode narration PCM using existing production audio settings."""
import sys
import lameenc
import numpy as np
from scipy.signal import resample_poly
import soundfile as sf
from math import gcd
from pathlib import Path


def main(source, target):
    audio, rate = sf.read(source, dtype='float32')
    if audio.ndim != 1 or not len(audio) or not np.isfinite(audio).all():
        raise ValueError('Expected finite mono PCM')
    if rate != 24000:
        divisor = gcd(rate, 24000)
        audio = resample_poly(audio, 24000 // divisor, rate // divisor)
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(24000)
    encoder.set_channels(1)
    encoder.set_quality(2)
    data = encoder.encode((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes()) + encoder.flush()
    Path(target).write_bytes(data)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
