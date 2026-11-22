"""Audio loading and clean-up: 16 kHz mono, silence trim, no-speech check."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import soundfile as sf

SAMPLE_RATE = 16_000

# Tunable: below these, treat the clip as "didn't hear anything" (a technical
# retry, never scored as a miss).
MIN_SPEECH_SECONDS = 0.2
MIN_RMS = 0.004
TRIM_TOP_DB = 35
PAD_SECONDS = 0.2


@dataclass
class PreparedAudio:
    samples: np.ndarray  # float32, 16 kHz mono, trimmed + padded
    speech_seconds: float
    rms: float
    no_speech: bool


def to_mono_16k(samples: np.ndarray, sr: int) -> np.ndarray:
    a = np.asarray(samples, dtype=np.float32)
    if a.ndim == 2:
        a = a.mean(axis=1)
    if sr != SAMPLE_RATE:
        import librosa

        a = librosa.resample(a, orig_sr=sr, target_sr=SAMPLE_RATE)
    return a.astype(np.float32)


def load_audio(path_or_file) -> np.ndarray:
    """Read any soundfile-supported file (WAV/FLAC/AIFF/…) as 16 kHz mono."""
    data, sr = sf.read(path_or_file, dtype="float32", always_2d=False)
    return to_mono_16k(data, sr)


def prepare(samples: np.ndarray) -> PreparedAudio:
    import librosa

    a = np.asarray(samples, dtype=np.float32)
    peak = float(np.max(np.abs(a))) if a.size else 0.0
    if a.size == 0 or peak < 1e-4:
        return PreparedAudio(np.zeros(SAMPLE_RATE // 2, np.float32), 0.0, 0.0, True)

    trimmed, _ = librosa.effects.trim(a, top_db=TRIM_TOP_DB)
    speech_seconds = len(trimmed) / SAMPLE_RATE
    rms = float(np.sqrt(np.mean(trimmed**2))) if trimmed.size else 0.0
    no_speech = speech_seconds < MIN_SPEECH_SECONDS or rms < MIN_RMS

    # Normalise loudness and pad with a little silence; the model does better
    # with context around the word.
    if trimmed.size:
        trimmed = trimmed / max(float(np.max(np.abs(trimmed))), 1e-6) * 0.9
    pad = np.zeros(int(PAD_SECONDS * SAMPLE_RATE), np.float32)
    return PreparedAudio(np.concatenate([pad, trimmed, pad]), speech_seconds, rms, no_speech)
