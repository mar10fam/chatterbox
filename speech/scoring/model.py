"""wav2vec2 phoneme recogniser, restricted to English phones."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from .audio import SAMPLE_RATE
from .phonemes import ENGLISH_PHONES

MODEL_ID = os.environ.get("CHATTERBOX_MODEL", "facebook/wav2vec2-lv-60-espeak-cv-ft")


@dataclass
class Transcription:
    phones: list[str]  # greedy CTC output, English phones only
    spans: list[tuple[int, int]]  # [start, end) frame range of each phone
    probs: np.ndarray  # (frames, vocab) probabilities over the allowed English vocab
    vocab: dict[str, int]


class PhonemeModel:
    def __init__(self, model_id: str = MODEL_ID, device: str | None = None):
        import torch
        from transformers import AutoModelForCTC, AutoProcessor

        self.torch = torch
        self.device = device or os.environ.get("CHATTERBOX_DEVICE", "cpu")
        self.processor = AutoProcessor.from_pretrained(model_id)
        self.model = AutoModelForCTC.from_pretrained(model_id).to(self.device).eval()

        self.vocab: dict[str, int] = self.processor.tokenizer.get_vocab()
        self.id_to_token = {i: t for t, i in self.vocab.items()}
        self.blank_id = self.processor.tokenizer.pad_token_id
        allowed = [self.vocab[p] for p in ENGLISH_PHONES if p in self.vocab] + [self.blank_id]
        mask = torch.full((len(self.vocab),), float("-inf"))
        mask[allowed] = 0.0
        self.mask = mask.to(self.device)

    def transcribe(self, samples: np.ndarray) -> Transcription:
        torch = self.torch
        inputs = self.processor(samples, sampling_rate=SAMPLE_RATE, return_tensors="pt").input_values
        with torch.inference_mode():
            logits = self.model(inputs.to(self.device)).logits[0]  # (frames, vocab)
            probs = torch.softmax(logits + self.mask, dim=-1).cpu().numpy()

        best = probs.argmax(axis=-1)
        phones: list[str] = []
        spans: list[tuple[int, int]] = []
        prev = None
        for t, idx in enumerate(best):
            idx = int(idx)
            if idx != prev and idx != self.blank_id:
                phones.append(self.id_to_token[idx])
                spans.append((t, t + 1))
            elif idx == prev and idx != self.blank_id:
                spans[-1] = (spans[-1][0], t + 1)
            prev = idx
        return Transcription(phones, spans, probs, self.vocab)

    def warmup(self) -> None:
        self.transcribe(np.zeros(SAMPLE_RATE, dtype=np.float32))


@lru_cache(maxsize=1)
def get_model() -> PhonemeModel:
    """Load once per process (~1.2 GB) and warm up."""
    m = PhonemeModel()
    m.warmup()
    return m
