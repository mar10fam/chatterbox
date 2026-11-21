# ChatterBox

A group project that will help parents see the progress of their child's speech patterns. We have an AI listening to the speech of the child's voice as they pronounce the picture of the animal that they will be shown during a session. We are hoping our app will capture the responses(if the child said the name of the animal right or wrong) and log them in a supabase database(later to be fetched by supabase as a JSON payload and displayed as a graph to show how they are progressing in a specific letter.). An example of a session can be viewed as this:

How a session goes:

1. Session 1 is with Client Adam
2. Picture of a Rabbit is displayed 
3. Child pronounces it 
4. AI judges it and logs
5. Parents can view the progress of that session and see if there needs to be a change or more practice. 

**At-home speech practice for kids, with progress parents can actually see.**

Children working on speech sounds often see a speech-language pathologist (SLP) for as little as 30 minutes a week. Real progress depends on practicing at home, but parents usually can't tell whether a sound was produced correctly. ChatterBox makes that practice time count.

A child sees a picture, says what's in it, and ChatterBox listens at the level of individual speech sounds (phonemes). It tells them whether they hit their target sound, like /r/ or "th", and gives a simple, encouraging tip when they don't. Each correct sound adds an ingredient to their potion, so practice feels like a game, not homework.

## How it works
1. **Parent signs in** and opens the dashboard.
2. **Start a session**: choose a target sound (currently /r/ and /θ/ "th"). The child works through 10 picture prompts.
3. **The child says each word**, and ChatterBox records and scores it.
4. **Instant feedback**: we compare the sounds the child actually produced against the expected pronunciation and catch common substitutions, such as "wabbit" for *rabbit* or "fum" for *thumb*.
5. **View progress**: parents see accuracy over time for each sound and the words that are hardest for their child.

## Why phonemes, not speech-to-text
Standard speech recognition is built to understand words, so it quietly "autocorrects" mispronunciations. It hears "wabbit" and writes "rabbit." That's great for dictation and useless for speech practice. ChatterBox uses a phoneme recognition model (`facebook/wav2vec2-lv-60-espeak-cv-ft`) that outputs the sounds actually spoken. We then align them against the target pronunciation (generated with espeak-ng) to pinpoint exactly which sound was substituted, dropped, or added.

## Tech stack
- **Frontend:** Next.js, browser audio recording (16 kHz WAV)
- **Backend:** Next.js routes, Hugging Face Transformers (wav2vec2 phoneme model), phonemizer / espeak-ng
- **Auth & data:** Supabase

## Privacy
We never store children's audio. Recordings are scored and then discarded, and only the results (phonemes and scores) are saved to track progress.

## Important note
ChatterBox is a **practice companion**, not a diagnostic tool. It's designed to support the work children do with their speech-language pathologist, not replace it.

## What's next
- Fine-tuning on child speech for better accuracy with young voices
- More target sounds, and practice in the middle and end of words
- A shareable progress report for the child's SLP

## Setup (macOS)

### 1. System dependencies

Requires [Homebrew](https://brew.sh).

```bash
brew install python@3.11 espeak-ng portaudio
```

- `python@3.11`: a stable version for torch and transformers
- `espeak-ng`: needed by `phonemizer` to phonemize target words
- `portaudio`: needed by `sounddevice` for mic recording

### 2. Point phonemizer at espeak-ng

```bash
echo "export PHONEMIZER_ESPEAK_LIBRARY=$(brew --prefix)/lib/libespeak-ng.dylib" >> ~/.zshrc
source ~/.zshrc
ls $PHONEMIZER_ESPEAK_LIBRARY   # should print the path
```

### 3. Python environment

```bash
$(brew --prefix)/bin/python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Download the model (~1.2 GB, optional)

The [`facebook/wav2vec2-lv-60-espeak-cv-ft`](https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft)
model downloads automatically on first use and is cached in
`~/.cache/huggingface/` (not in this repo). To fetch it ahead of time:

```bash
hf download facebook/wav2vec2-lv-60-espeak-cv-ft
```

### Notes

- The first time you record, macOS asks to let your terminal use the
  microphone. Allow it, or recordings will be silent.
- If you change dependencies, run `pip freeze > requirements.txt`.
