# Speech scoring service

Turns a recording of a child saying a word into the fields the app saves for
each picture (`AttemptResult` in `web/src/types/session.ts`): the phonemes
heard, whether the **target sound** was right, and a 0–100 score.

All commands run from the **repo root** with the project venv
(`.venv/bin/python …`). Setup is in the [root README](../README.md#getting-started-macos).

## The service

```bash
.venv/bin/uvicorn speech.server:app --port 8000
```

The model (~1.2 GB) loads and warms up before the server accepts requests
(~20 s on first start). After that a word takes roughly 100–300 ms.

| Endpoint | Request | Response |
|---|---|---|
| `POST /score` | multipart form: `audio` (WAV, any rate; resampled to 16 kHz mono), `word_id`, `target_phonemes` (JSON array, e.g. `["ɹ","æ","b","ɪ","t"]`), optional `sound` (`r` or `l`; inferred if omitted) | `word_id`, `target_phonemes`, `heard_phonemes`, `target_sound_correct`, `score`, plus `no_speech`, `latency_ms`, `checks` (per judged sound: what was heard and the model's confidence) |
| `GET /health` | | `{"ok": true, "model_loaded": true}` |

```bash
curl -F audio=@clip.wav -F word_id=rabbit \
     -F 'target_phonemes=["ɹ","æ","b","ɪ","t"]' localhost:8000/score
```

The web app never calls this directly from the browser. It goes through
`web/src/app/api/score/route.ts`, which checks the user is signed in. The
service has no auth of its own, so don't expose it publicly as-is. It's
stateless: the client sends the target phonemes (from the `words` table), so
the service never touches the database.

## How scoring works

Code: `scoring/score.py` and `scoring/phonemes.py`.

1. **Clean up the audio** (`scoring/audio.py`): mono, 16 kHz, trim silence,
   normalise loudness. If less than 0.2 s of sound remains or it's very quiet,
   the result is **`no_speech`**. The app asks the child to try again, and it
   never counts as a miss.
2. **Recognise phonemes** with `facebook/wav2vec2-lv-60-espeak-cv-ft`. The
   model knows ~390 symbols across many languages; decoding is **restricted to
   English (espeak en-us) phones** so English speech can't come out as foreign
   symbols.
3. **Normalise** target and heard: drop stress and tone marks, unify variants
   (`r`→`ɹ`, dark `ɫ`→`l`), split combined vowels (`ɪɹ` → `ɪ ɹ`).
4. **Align** target with heard using a weighted edit distance.
5. **Judge only the target sound.**
   - /r/: each `ɹ` **followed by a vowel** (*rabbit*, *frog*, *parrot*). That's
     where the classic w-for-r swap happens. Syllable-final r (*reindeer*,
     *rooster*) is skipped because many accents don't pronounce it.
   - /l/: each `l` followed by a vowel (*lion*, *flamingo*, *koala*).
   - A position is correct if the aligned phone is accepted (`ɹ`/`ɚ` for r,
     `l`/`ɫ` for l). If the model's top guess was something else, the scorer
     also compares the model's confidence for the accepted sound against the
     typical errors (`w`, `j`, …) in those frames, and accepts if it's at least
     as likely (`POSTERIOR_THRESHOLD = 0.5`).
   - The word counts as correct only if every judged position is correct.
6. **Score (0–100)** = `100 × (1 − alignment cost ÷ target length)`. Vowel
   differences cost 0.3, voicing slips like t/d cost 0.5, anything else 1. The
   score never affects right or wrong.

Tunable knobs: `POSTERIOR_THRESHOLD` (`score.py`), `MIN_SPEECH_SECONDS` and
`MIN_RMS` (`audio.py`), and the accepted/error sets in `TARGET_RULES`
(`phonemes.py`).

## Trying it from the terminal

```bash
.venv/bin/python -m speech.cli devices                          # list microphones
.venv/bin/python -m speech.cli record --word rabbit --loop      # Enter, say the word, see the verdict
.venv/bin/python -m speech.cli record --word lion --device MacBook
.venv/bin/python -m speech.cli score clip.wav --word koala      # score a saved clip
.venv/bin/python -m speech.cli transcribe clip.wav              # just the phonemes heard
.venv/bin/python -m speech.cli words                            # word ids and phonemes
```

If nothing is picked up, the recorder prints the input level and warns when
it's near silent. That usually means the wrong mic (e.g. Bluetooth headphones);
pick one with `--device`.

## Measuring accuracy

Clips are named `{word}__{correct|error}__{anything}.wav` and live in
`speech/samples/` (git-ignored, so voices stay on your machine).

```bash
# Record yourself: each word normally, then wrong on purpose ("wabbit", "wion")
.venv/bin/python -m speech.record --speaker <name> --device MacBook --sound l --count 5

# Synthetic clips from macOS voices (a smoke test, not a verdict)
.venv/bin/python -m speech.synth --voices 4

# Report: per sound and per word
.venv/bin/python -m speech.evaluate speech/samples/<name> --show-misses
.venv/bin/python -m speech.evaluate speech/samples --pitch-shift 4    # rough child-voice stand-in
.venv/bin/python -m speech.evaluate speech/samples/<name> --threshold 0.4
```

The report shows, per sound, **accepted** (correct clips judged correct, so
kids aren't under-credited) and **caught** (error clips judged a miss, so
progress means something), plus what the target sound was heard as.

### Results so far

| Sound | Clips | Correct accepted | Mistakes caught |
|---|---|---|---|
| /r/ | real voice, 10 + 10 | 100% | 100% |
| /r/ | synthetic, 40 + 40 | 87.5% (misses were voice glitches) | 100% |
| /l/ | synthetic, 40 + 40 | 97.5% | 100% |
| /th/ (dropped) | real voice, 10 + 10 | **10%** | 100% |

/th/ was replaced by /l/ because the model hears a real /θ/ as [f], [t] or [s].
See `web/supabase/migrations/20261122012912_replace_th_with_l.sql`. The model
was trained on adult speech; adults faking errors (and pitch-shifting) only
approximate children, so treat results with real kids as calibration.

## Tests

```bash
.venv/bin/python -m pytest speech/tests
```

These cover the pure logic (normalisation, alignment, which positions are
judged, accept/miss decisions) and run without loading the model.

## Words

`scoring/words.py` is a local copy of the `words` table for the CLI and
evaluation tools (the app reads the table itself). If you add words, add them
to a migration and here. Each word needs its target sound right before a
vowel, phonemes from espeak-ng (`phonemize(..., language="en-us",
backend="espeak")`), and a phonetic "error" spelling for synthetic tests.
