"""Generate synthetic test clips with macOS `say`.

For every word, one "correct" clip and one "error" clip (a typical childhood
substitution spelled phonetically: rabbit → "wabbit", thumb → "fumb"), in
several voices. Output: speech/samples/synthetic/{word}__{correct|error}__{voice}.wav

  python -m speech.synth                 # 4 voices
  python -m speech.synth --voices 6

Synthetic speech is a smoke test, not a verdict, especially for /θ/.
Real recordings (python -m speech.record) are the real test.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
from pathlib import Path

from .scoring.words import WORDS

OUT = Path(__file__).parent / "samples" / "synthetic"
PREFERRED = ["Samantha", "Daniel", "Karen", "Moira", "Tessa", "Alex", "Fred", "Rishi"]


def english_voices() -> list[str]:
    listing = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, check=True).stdout
    voices = []
    for line in listing.splitlines():
        m = re.match(r"^(.+?)\s+(en_[A-Z]{2})\s", line)
        if m and "(" not in m.group(1):  # skip variants like "Eddy (English (UK))"
            voices.append(m.group(1).strip())
    ordered = [v for v in PREFERRED if v in voices] + [v for v in voices if v not in PREFERRED]
    return ordered


def synth(text: str, voice: str, out: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".aiff") as tmp:
        subprocess.run(["say", "-v", voice, "-o", tmp.name, text], check=True)
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", tmp.name, str(out)], check=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voices", type=int, default=4)
    p.add_argument("--out", type=Path, default=OUT)
    args = p.parse_args()

    voices = english_voices()[: args.voices]
    if not voices:
        raise SystemExit("No English `say` voices found.")
    args.out.mkdir(parents=True, exist_ok=True)
    print(f"Voices: {', '.join(voices)}")
    n = 0
    for w in WORDS.values():
        for voice in voices:
            tag = voice.replace(" ", "")
            synth(w.id, voice, args.out / f"{w.id}__correct__{tag}.wav")
            synth(w.error_spelling, voice, args.out / f"{w.id}__error__{tag}.wav")
            n += 2
    print(f"Wrote {n} clips to {args.out}")


if __name__ == "__main__":
    main()
