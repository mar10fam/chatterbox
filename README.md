# chatterbox

A group project that will help parents see the progress of their child's speech patterns. We have an AI listening to the speech of the child's voice as they pronounce the picture of the animal that they will be shown during a session. We are hoping our app will capture the responses(if the child said the name of the animal right or wrong) and log them in a supabase database(later to be fetched by supabase as a JSON payload and displayed as a graph to show how they are progressing in a specific letter.). An example of a session can be viewed as this:

How a session goes:

1. Session 1 is with Client Adam
2. Picture of a Rabbit is displayed 
3. Child pronounces it 
4. AI judges it and logs
5. Parents can view the progress of that session and see if there needs to be a change or more practice. 
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
