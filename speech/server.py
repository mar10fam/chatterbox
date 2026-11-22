"""Scoring service.

  .venv/bin/uvicorn speech.server:app --port 8000          # from the repo root
  curl -F audio=@clip.wav -F word_id=rabbit \\
       -F 'target_phonemes=["ɹ","æ","b","ɪ","t"]' localhost:8000/score

POST /score    multipart: audio (WAV), word_id, target_phonemes (JSON array), sound (optional)
               → AttemptResult fields (minus item_index) + no_speech, latency_ms, checks
GET  /health   → {"ok": true, "model_loaded": bool}

The web app calls this through its own /api/score route (which checks the user
is signed in), so this service doesn't need CORS or auth of its own. Don't
expose it publicly as-is.
"""

from __future__ import annotations

import io
import json
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from .scoring import load_audio, score_attempt
from .scoring.model import get_model

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # ~2.5 min of 16 kHz WAV; real clips are ~100 KB
_lock = threading.Lock()  # one inference at a time; the model isn't shared-state safe
_state = {"model_loaded": False}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_model()  # load + warm up before accepting requests
    _state["model_loaded"] = True
    yield


app = FastAPI(title="Chatterbox scorer", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"ok": True, **_state}


@app.post("/score")
def score(
    audio: UploadFile = File(...),
    word_id: str = Form(...),
    target_phonemes: str = Form(..., description='JSON array, e.g. ["ɹ","æ","b","ɪ","t"]'),
    sound: str | None = Form(None),
) -> dict:
    try:
        target = json.loads(target_phonemes)
        if not (isinstance(target, list) and target and all(isinstance(p, str) for p in target)):
            raise ValueError
    except ValueError:
        raise HTTPException(422, "target_phonemes must be a non-empty JSON array of strings")
    if sound not in (None, "", "r", "l"):
        raise HTTPException(422, "sound must be 'r' or 'l'")

    data = audio.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "audio too large")
    try:
        samples = load_audio(io.BytesIO(data))
    except Exception:
        raise HTTPException(415, "audio must be a WAV (16-bit PCM or float) file")

    try:
        with _lock:
            return score_attempt(samples, word_id, target, sound or None)
    except ValueError as e:  # e.g. target has no /r/ or /l/
        raise HTTPException(422, str(e))
