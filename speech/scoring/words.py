"""Local copy of the word list for testing.

Source of truth is the `words` table (web/supabase/migrations/…_progress_schema.sql).
In the app, the client sends target phonemes with each request, so the server
never reads this. `error_spelling` is a phonetic spelling of a typical
substitution, used to synthesise "mispronounced" test audio.

The second practice sound is /l/. It was /th/, but the model couldn't
reliably hear /θ/ vs /f/ (migration 20261122012912_replace_th_with_l.sql).
"""

from __future__ import annotations

from dataclasses import dataclass

from .phonemes import Sound


@dataclass(frozen=True)
class Word:
    id: str
    sound: Sound
    phonemes: tuple[str, ...]
    error_spelling: str  # r → w, l → w


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
        Word("lion", "l", ("l", "aɪə", "n"), "wion"),
        Word("lamb", "l", ("l", "æ", "m"), "wamb"),
        Word("leopard", "l", ("l", "ɛ", "p", "ɚ", "d"), "weppard"),
        Word("llama", "l", ("l", "ɑː", "m", "ə"), "wahma"),
        Word("lizard", "l", ("l", "ɪ", "z", "ɚ", "d"), "wizzard"),
        Word("lobster", "l", ("l", "ɑː", "b", "s", "t", "ɚ"), "wobster"),
        Word("ladybug", "l", ("l", "eɪ", "d", "ɪ", "b", "ʌ", "ɡ"), "waydybug"),
        Word("lemur", "l", ("l", "iː", "m", "ɚ"), "weemer"),
        Word("koala", "l", ("k", "oʊ", "ɑː", "l", "ə"), "koawa"),
        Word("flamingo", "l", ("f", "l", "ɐ", "m", "ɪ", "ŋ", "ɡ", "oʊ"), "fwamingo"),
    ]
}
