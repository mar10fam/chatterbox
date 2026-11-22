"""Measure the scorer on labelled clips.

Clips are named {word}__{correct|error}__{anything}.wav (as written by
speech.synth and speech.record). Folders are searched recursively.

  python -m speech.evaluate speech/samples/martin
  python -m speech.evaluate speech/samples --pitch-shift 4    # rough child-voice stand-in
  python -m speech.evaluate speech/samples/synthetic --threshold 0.4 --show-misses

Reports, per sound:
  accepted  % of correct clips judged correct (want high, so kids aren't under-credited)
  caught    % of error clips judged a miss    (want high, so progress is real)
"""

from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path

from .scoring import WORDS, load_audio, score_attempt
from .scoring import score as score_mod
from .scoring.model import get_model


def find_clips(paths: list[Path]) -> list[tuple[Path, str, str]]:
    clips = []
    for root in paths:
        files = [root] if root.is_file() else sorted(root.rglob("*.wav"))
        for f in files:
            parts = f.stem.split("__")
            if len(parts) >= 2 and parts[0] in WORDS and parts[1] in ("correct", "error"):
                clips.append((f, parts[0], parts[1]))
    return clips


def pct(n: int, d: int) -> str:
    return f"{100 * n / d:5.1f}% ({n}/{d})" if d else "    – "


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("paths", nargs="+", type=Path)
    p.add_argument("--pitch-shift", type=float, default=0.0, help="semitones, e.g. 4")
    p.add_argument("--threshold", type=float, help=f"posterior threshold (default {score_mod.POSTERIOR_THRESHOLD})")
    p.add_argument("--show-misses", action="store_true", help="list every misjudged clip")
    p.add_argument("--json", type=Path, help="also write per-clip results here")
    args = p.parse_args()

    if args.threshold is not None:
        score_mod.POSTERIOR_THRESHOLD = args.threshold
    clips = find_clips(args.paths)
    if not clips:
        raise SystemExit("No clips named {word}__{correct|error}__*.wav found.")

    model = get_model()
    rows = []
    for path, word_id, label in clips:
        w = WORDS[word_id]
        audio = load_audio(path)
        if args.pitch_shift:
            import librosa

            audio = librosa.effects.pitch_shift(audio, sr=16_000, n_steps=args.pitch_shift)
        r = score_attempt(audio, w.id, list(w.phonemes), w.sound, model=model)
        expected = label == "correct"
        rows.append({"file": str(path), "word": word_id, "sound": w.sound, "label": label, **r,
                     "right": (not r["no_speech"]) and r["target_sound_correct"] == expected})

    print(f"\n{len(rows)} clips · pitch shift {args.pitch_shift:+g} · threshold {score_mod.POSTERIOR_THRESHOLD}\n")

    # Per sound
    print(f"{'sound':6} {'accepted (correct clips)':>26} {'caught (error clips)':>24} {'no speech':>10}")
    for sound in ("r", "th"):
        s = [r for r in rows if r["sound"] == sound]
        if not s:
            continue
        cor = [r for r in s if r["label"] == "correct" and not r["no_speech"]]
        err = [r for r in s if r["label"] == "error" and not r["no_speech"]]
        print(f"/{sound}/   {pct(sum(r['target_sound_correct'] for r in cor), len(cor)):>26} "
              f"{pct(sum(not r['target_sound_correct'] for r in err), len(err)):>24} "
              f"{sum(r['no_speech'] for r in s):>10}")

    # Per word
    print(f"\n{'word':10} {'accepted':>16} {'caught':>16}   target sound heard as (correct | error clips)")
    by_word = defaultdict(list)
    for r in rows:
        by_word[r["word"]].append(r)
    for word_id in WORDS:
        s = by_word.get(word_id)
        if not s:
            continue
        cor = [r for r in s if r["label"] == "correct" and not r["no_speech"]]
        err = [r for r in s if r["label"] == "error" and not r["no_speech"]]
        heard = {lab: Counter(c["heard"] or "∅" for r in s if r["label"] == lab for c in r["checks"])
                 for lab in ("correct", "error")}
        fmt = lambda c: " ".join(f"{k}×{v}" for k, v in c.most_common(4)) or "-"
        print(f"{word_id:10} {pct(sum(r['target_sound_correct'] for r in cor), len(cor)):>16} "
              f"{pct(sum(not r['target_sound_correct'] for r in err), len(err)):>16}   "
              f"{fmt(heard['correct'])} | {fmt(heard['error'])}")

    lat = [r["latency_ms"] for r in rows if not r["no_speech"]]
    if lat:
        print(f"\nlatency: median {statistics.median(lat):.0f} ms, max {max(lat)} ms")
    scores = [r["score"] for r in rows if r["label"] == "correct" and not r["no_speech"]]
    if scores:
        print(f"score on correct clips: median {statistics.median(scores):.0f}")

    misses = [r for r in rows if not r["right"]]
    print(f"overall right: {pct(len(rows) - len(misses), len(rows))}")
    if args.show_misses and misses:
        print("\nMisjudged clips:")
        for r in misses:
            why = "no speech" if r["no_speech"] else ("rejected" if r["label"] == "correct" else "accepted")
            confs = ", ".join(f"/{c['target']}/→{c['heard'] or '∅'} {c['confidence']:.2f}" for c in r["checks"])
            print(f"  {Path(r['file']).name:40} {why:9} heard {' '.join(r['heard_phonemes']):20} {confs}")

    if args.json:
        args.json.write_text(json.dumps(rows, ensure_ascii=False, indent=2))
        print(f"\nWrote {args.json}")


if __name__ == "__main__":
    main()
