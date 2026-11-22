"""Try the scorer from the terminal.

  python -m speech.cli transcribe clip.wav           # what phonemes does the model hear?
  python -m speech.cli score clip.wav --word rabbit  # full judgement for a word
  python -m speech.cli record --word rabbit          # record from the mic, then score
  python -m speech.cli record --word rabbit --device MacBook   # pick a mic by name or index
  python -m speech.cli devices                       # list microphones
  python -m speech.cli words                         # list word ids

Run from the repo root with the venv: .venv/bin/python -m speech.cli …
"""

from __future__ import annotations

import argparse
import json
import sys
import time

from .scoring import WORDS, load_audio, score_attempt
from .scoring.audio import SAMPLE_RATE, prepare


def _word(word_id: str):
    if word_id not in WORDS:
        sys.exit(f"Unknown word '{word_id}'. Try: {', '.join(WORDS)}")
    return WORDS[word_id]


def print_result(r: dict) -> None:
    if r["no_speech"]:
        print("\n  🔇 No speech detected (would ask the child to try again; not a miss)")
        print(f"     latency {r['latency_ms']} ms\n")
        return
    verdict = "✅ target sound correct" if r["target_sound_correct"] else "❌ target sound missed"
    print(f"\n  word      {r['word_id']}  (/{r['sound']}/)")
    print(f"  target    {' '.join(r['target_phonemes'])}")
    print(f"  heard     {' '.join(r['heard_phonemes'])}")
    print(f"  verdict   {verdict}")
    print(f"  score     {r['score']}")
    for c in r["checks"]:
        conf = "n/a" if c["confidence"] is None else f"{c['confidence']:.2f}"
        how = "aligned" if c["aligned_ok"] else ("posterior" if c["correct"] else "")
        print(
            f"    /{c['target']}/ at {c['position']}: heard {c['heard'] or '∅':>3}  "
            f"confidence {conf}  → {'ok' if c['correct'] else 'miss'} {how}"
        )
    print(f"  latency   {r['latency_ms']} ms\n")


def cmd_transcribe(args) -> None:
    from .scoring.model import get_model

    audio = prepare(load_audio(args.file))
    t = time.perf_counter()
    tr = get_model().transcribe(audio.samples)
    print(f"{' '.join(tr.phones) or '(nothing)'}   [{(time.perf_counter() - t) * 1000:.0f} ms]")


def cmd_score(args) -> None:
    w = _word(args.word)
    r = score_attempt(load_audio(args.file), w.id, list(w.phonemes), w.sound)
    print(json.dumps(r, ensure_ascii=False, indent=2)) if args.json else print_result(r)


def _resolve_device(spec: str | None):
    """Device index from an index or a case-insensitive name fragment."""
    import sounddevice as sd

    if spec is None:
        return None
    if spec.isdigit():
        return int(spec)
    for i, d in enumerate(sd.query_devices()):
        if d["max_input_channels"] > 0 and spec.lower() in d["name"].lower():
            return i
    sys.exit(f"No input device matching '{spec}'. Run: python -m speech.cli devices")


def cmd_devices(_args) -> None:
    import sounddevice as sd

    default_in = sd.default.device[0]
    for i, d in enumerate(sd.query_devices()):
        if d["max_input_channels"] > 0:
            mark = "  ← default" if i == default_in else ""
            print(f"  [{i}] {d['name']}{mark}")


def cmd_record(args) -> None:
    import numpy as np
    import sounddevice as sd
    import soundfile as sf

    from .scoring.model import get_model

    w = _word(args.word)
    device = _resolve_device(args.device)
    dev_name = sd.query_devices(device if device is not None else sd.default.device[0])["name"]
    print(f"Mic: {dev_name}   (change with --device; list with: python -m speech.cli devices)")
    print("Loading model…", end=" ", flush=True)
    get_model()
    print("ready.")
    while True:
        input(f"\nPress Enter, then say “{w.id}” ({args.seconds:.1f}s)… ")
        clip = sd.rec(
            int(args.seconds * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype="float32", device=device
        )
        sd.wait()
        clip = clip[:, 0]
        peak = float(np.abs(clip).max())
        print(f"  input level: peak {peak:.3f}", end="")
        print("  ⚠️  very quiet: is this the right mic, and is it unmuted?" if peak < 0.02 else "")
        if args.save:
            sf.write(args.save, clip, SAMPLE_RATE)
            print(f"  saved {args.save}")
        print_result(score_attempt(clip, w.id, list(w.phonemes), w.sound))
        if not args.loop:
            break


def main() -> None:
    p = argparse.ArgumentParser(prog="speech.cli", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("transcribe", help="print the phonemes the model hears")
    t.add_argument("file")
    t.set_defaults(fn=cmd_transcribe)

    s = sub.add_parser("score", help="score a clip for a word")
    s.add_argument("file")
    s.add_argument("--word", required=True)
    s.add_argument("--json", action="store_true", help="print raw JSON")
    s.set_defaults(fn=cmd_score)

    r = sub.add_parser("record", help="record from the mic and score")
    r.add_argument("--word", required=True)
    r.add_argument("--seconds", type=float, default=2.5)
    r.add_argument("--save", help="also save the clip to this WAV path")
    r.add_argument("--loop", action="store_true", help="keep recording until Ctrl+C")
    r.add_argument("--device", help="mic index or name fragment, e.g. MacBook")
    r.set_defaults(fn=cmd_record)

    d = sub.add_parser("devices", help="list microphones")
    d.set_defaults(fn=cmd_devices)

    w = sub.add_parser("words", help="list word ids")
    w.set_defaults(fn=lambda _: print("\n".join(f"{x.id:9s} /{x.sound}/  {' '.join(x.phonemes)}" for x in WORDS.values())))

    args = p.parse_args()
    try:
        args.fn(args)
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
