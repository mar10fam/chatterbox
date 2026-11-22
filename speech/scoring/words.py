"""Local copy of the word list for testing.

Source of truth is the `words` table (web/supabase/migrations/…_progress_schema.sql).
In the app, the client sends target phonemes with each request, so the server
never reads this. `error_spelling` is a phonetic spelling of a typical
substitution, used to synthesise "mispronounced" test audio.
"""

from __future__ import annotations

from dataclasses import dataclass

from .phonemes import Sound


@dataclass(frozen=True)
class Word:
    id: str
    sound: Sound
    phonemes: tuple[str, ...]
    error_spelling: str  # r → w, th → f/t


WORDS: dict[str, Word] = {
    w.id: w
    for w in [
        Word("rabbit", "r", ("ɹ", "æ", "b", "ɪ", "t"), "wabbit"),
        Word("raccoon", "r", ("ɹ", "æ", "k", "uː", "n"), "waccoon"),
        Word("rooster", "r", ("ɹ", "uː", "s", "t", "ɚ"), "wooster"),
        Word("rhino", "r", ("ɹ", "aɪ", "n", "oʊ"), "why no"),
        Word("reindeer", "r", ("ɹ", "eɪ", "n", "d", "ɪɹ"), "waindeer"),
        Word("robin", "r", ("ɹ", "ɑː", "b", "ɪ", "n"), "wobbin"),
        Word("rat", "r", ("ɹ", "æ", "t"), "wat"),
        Word("frog", "r", ("f", "ɹ", "ɑː", "ɡ"), "fwog"),
        Word("parrot", "r", ("p", "æ", "ɹ", "ə", "t"), "pawwot"),
        Word("crab", "r", ("k", "ɹ", "æ", "b"), "cwab"),
        Word("moth", "th", ("m", "ɑː", "θ"), "moff"),
        Word("sloth", "th", ("s", "l", "ɑː", "θ"), "sloff"),
        Word("panther", "th", ("p", "æ", "n", "θ", "ɚ"), "panfer"),
        Word("python", "th", ("p", "aɪ", "θ", "ə", "n"), "pyfon"),
        Word("mammoth", "th", ("m", "æ", "m", "ə", "θ"), "mammoff"),
        Word("thrush", "th", ("θ", "ɹ", "ʌ", "ʃ"), "frush"),
        Word("thumb", "th", ("θ", "ʌ", "m"), "fumb"),
        Word("three", "th", ("θ", "ɹ", "iː"), "free"),
        Word("teeth", "th", ("t", "iː", "θ"), "teef"),
        Word("bath", "th", ("b", "æ", "θ"), "baff"),
    ]
}
