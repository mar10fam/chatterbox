"""Guided recorder: build a labelled test set of real voices.

For each word you record it twice:
  1. normally            → {word}__correct__{n}.wav
  2. "wrong" on purpose  → {word}__error__{n}.wav   (e.g. "wabbit", "wion")

  python -m speech.record --speaker martin --device MacBook
  python -m speech.record --speaker martin --sound l --count 5   # 5 random /l/ words
  python -m speech.record --speaker martin --words lion,koala

Clips go to speech/samples/<speaker>/ (git-ignored). Re-running adds new takes.
Then: python -m speech.evaluate speech/samples/<speaker>
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

from .cli import _resolve_device
from .scoring.audio import SAMPLE_RATE
from .scoring.words import WORDS

SAMPLES = Path(__file__).parent / "samples"


def _next_take(folder: Path, word: str, label: str) -> int:
    existing = list(folder.glob(f"{word}__{label}__*.wav"))
    return len(existing) + 1


def _record(seconds: float, device) -> np.ndarray:
    import sounddevice as sd

    clip = sd.rec(int(seconds * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype="float32", device=device)
    sd.wait()
    return clip[:, 0]


def main() -> None:
    import soundfile as sf

    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--speaker", required=True, help="folder name for this person's clips")
    p.add_argument("--device", help="mic index or name fragment, e.g. MacBook")
    p.add_argument("--sound", choices=["r", "l"])
    p.add_argument("--count", type=int, help="only record this many words (picked at random)")
    p.add_argument("--words", help="comma-separated word ids")
    p.add_argument("--seconds", type=float, default=2.5)
    args = p.parse_args()

    words = list(WORDS.values())
    if args.sound:
        words = [w for w in words if w.sound == args.sound]
    if args.words:
        wanted = set(args.words.split(","))
        words = [w for w in words if w.id in wanted]
    if args.count:
        import random

        words = random.sample(words, min(args.count, len(words)))

    folder = SAMPLES / args.speaker
    folder.mkdir(parents=True, exist_ok=True)
    device = _resolve_device(args.device)
    print(f"Saving to {folder}  ({len(words)} words × 2 clips)")
    print("At each prompt: Enter = record, s = skip, q = quit.\n")

    saved = 0
    for i, w in enumerate(words, 1):
        for label, say_this in (("correct", w.id), ("error", w.error_spelling)):
            how = "normally" if label == "correct" else f"WRONG on purpose, like “{say_this}”"
            while True:
                choice = input(f"[{i}/{len(words)}] Say “{w.id}” {how}. ").strip().lower()
                if choice == "q":
                    print(f"\nSaved {saved} clips.")
                    return
                if choice == "s":
                    break
                clip = _record(args.seconds, device)
                peak = float(np.abs(clip).max())
                if peak < 0.02:
                    print(f"   ⚠️  very quiet (peak {peak:.3f}). Let's redo that one.")
                    continue
                path = folder / f"{w.id}__{label}__{_next_take(folder, w.id, label)}.wav"
                sf.write(path, clip, SAMPLE_RATE)
                saved += 1
                print(f"   saved {path.name}")
                break
    rel = folder.relative_to(Path.cwd()) if folder.is_relative_to(Path.cwd()) else folder
    print(f"\nDone. Saved {saved} clips. Next:\n  .venv/bin/python -m speech.evaluate {rel} --show-misses")


if __name__ == "__main__":
    main()
