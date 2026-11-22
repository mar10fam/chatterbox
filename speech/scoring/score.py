"""Turn a recording into an AttemptResult-shaped dict.

Decision rule (per judged position: each /θ/, or each /ɹ/ before a vowel):
  1. Align target phonemes with what the model heard.
  2. If the aligned heard phone is an accepted variant → correct.
  3. Otherwise look at the model's frame probabilities around that position
     and compare P(accepted) vs P(typical errors). If the accepted sound is at
     least as likely → correct. This rescues quiet sounds like /θ/ that greedy
     decoding misses.
The word counts as correct only if every target-sound position is correct.
Other sounds in the word never affect the yes/no, only the 0–100 score.
"""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass

import numpy as np

from .audio import prepare
from .phonemes import TARGET_RULES, Sound, align, infer_sound, normalize, target_positions

# P(accepted) / (P(accepted) + P(errors)) needed to accept on posteriors alone.
POSTERIOR_THRESHOLD = 0.5
WINDOW_PAD_FRAMES = 2  # ~40 ms either side of the aligned phone


@dataclass
class TargetCheck:
    position: int  # index into the normalised target
    target: str
    heard: str | None  # aligned heard phone (None = not heard at all)
    aligned_ok: bool
    confidence: float | None  # posterior ratio, None if not computed
    correct: bool


def _window(pairs, ti: int, spans: list[tuple[int, int]], n_frames: int) -> tuple[int, int]:
    """Frame range to inspect for target index `ti`."""
    k = next(idx for idx, (t, _) in enumerate(pairs) if t == ti)
    hj = pairs[k][1]
    if hj is not None:
        s, e = spans[hj]
    else:
        # Deleted: look in the gap between the nearest heard phones either side.
        before = [spans[h][1] for _, h in pairs[:k] if h is not None]
        after = [spans[h][0] for _, h in pairs[k + 1 :] if h is not None]
        s = before[-1] if before else 0
        e = after[0] if after else n_frames
        if e <= s:
            s, e = s - 1, s + 1
    return max(0, s - WINDOW_PAD_FRAMES), min(n_frames, e + WINDOW_PAD_FRAMES)


def _posterior_ratio(probs: np.ndarray, vocab: dict[str, int], frames: tuple[int, int], target: str) -> float:
    rule = TARGET_RULES[target]
    acc_ids = [vocab[p] for p in rule.accepted if p in vocab]
    err_ids = [vocab[p] for p in rule.errors if p in vocab]
    window = probs[frames[0] : frames[1]]
    if window.size == 0:
        return 0.0
    p_acc = float(window[:, acc_ids].sum(axis=1).max())
    p_err = float(window[:, err_ids].sum(axis=1).max())
    return p_acc / (p_acc + p_err + 1e-9)


def judge(
    target: list[str],
    heard: list[str],
    sound: Sound,
    spans: list[tuple[int, int]] | None = None,
    probs: np.ndarray | None = None,
    vocab: dict[str, int] | None = None,
) -> tuple[bool, float, list[TargetCheck]]:
    """Pure decision logic. Without probs it's alignment-only (used in unit tests)."""
    pairs, cost = align(target, heard)
    checks: list[TargetCheck] = []
    for ti in target_positions(target, sound):
        tp = target[ti]
        hj = next(h for t, h in pairs if t == ti)
        heard_p = heard[hj] if hj is not None else None
        aligned_ok = heard_p in TARGET_RULES[tp].accepted
        confidence = None
        if probs is not None and spans is not None and vocab is not None:
            frames = _window(pairs, ti, spans, probs.shape[0])
            confidence = _posterior_ratio(probs, vocab, frames, tp)
        correct = aligned_ok or (confidence is not None and confidence >= POSTERIOR_THRESHOLD)
        checks.append(TargetCheck(ti, tp, heard_p, aligned_ok, confidence, correct))

    target_sound_correct = bool(checks) and all(c.correct for c in checks)
    score = max(0.0, 100.0 * (1.0 - cost / max(len(target), 1)))
    return target_sound_correct, round(score, 1), checks


def score_attempt(
    samples: np.ndarray,
    word_id: str,
    target_phonemes: list[str],
    sound: Sound | None = None,
    model=None,
) -> dict:
    """samples: 16 kHz mono float32. Returns AttemptResult fields + debug info."""
    from .model import get_model

    started = time.perf_counter()
    model = model or get_model()
    sound = sound or infer_sound(target_phonemes)
    target = normalize(list(target_phonemes))

    result = {
        "word_id": word_id,
        "target_phonemes": list(target_phonemes),
        "heard_phonemes": [],
        "target_sound_correct": False,
        "score": 0.0,
        "sound": sound,
        "no_speech": False,
        "checks": [],
    }

    audio = prepare(samples)
    if not audio.no_speech:
        tr = model.transcribe(audio.samples)
        # Split heard tokens the same way as the target, keeping each part's frames.
        heard, spans = [], []
        for p, span in zip(tr.phones, tr.spans):
            for part in normalize([p]):
                heard.append(part)
                spans.append(span)
        if heard:
            ok, score, checks = judge(target, heard, sound, spans, tr.probs, tr.vocab)
            result.update(
                heard_phonemes=heard,
                target_sound_correct=ok,
                score=score,
                checks=[asdict(c) for c in checks],
            )
        else:
            audio.no_speech = True

    result["no_speech"] = audio.no_speech
    result["latency_ms"] = round((time.perf_counter() - started) * 1000)
    return result
