"""Phoneme inventory, normalisation, alignment and target-sound rules.

Everything here is pure Python (no model), so it's fast to unit-test.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Sound = Literal["r", "th"]

# espeak-ng en-us phones, i.e. everything the word list's target phonemes can
# contain, plus a few close variants. The model's vocabulary has ~390 symbols
# across many languages; decoding is restricted to these so English speech
# can't land on foreign symbols (e.g. "ɑ5", "əɜ").
ENGLISH_PHONES: frozenset[str] = frozenset(
    """
    p b t d k ɡ f v θ ð s z ʃ ʒ h tʃ dʒ m n ŋ n̩ l ɹ w j ʔ ɾ
    i iː ɪ eɪ ɛ æ a aɪ aʊ ɑ ɑː ɔ ɔː ɔɪ oʊ ʊ u uː ʌ ə ɚ ɜ ɜː ɐ ᵻ
    aɪɚ ɑːɹ ɔːɹ ɛɹ ɪɹ ʊɹ əl
    """.split()
)

VOWELS: frozenset[str] = frozenset(
    "i iː ɪ eɪ ɛ æ a aɪ aʊ ɑ ɑː ɔ ɔː ɔɪ oʊ ʊ u uː ʌ ə ɚ ɜ ɜː ɐ ᵻ".split()
)

# Multi-phone espeak tokens split into parts so target and heard line up the
# same way ("ɪɹ" in reindeer is a vowel plus an /r/ to judge).
_SPLIT = {
    "ɑːɹ": ["ɑː", "ɹ"],
    "ɔːɹ": ["ɔː", "ɹ"],
    "ɛɹ": ["ɛ", "ɹ"],
    "ɪɹ": ["ɪ", "ɹ"],
    "ʊɹ": ["ʊ", "ɹ"],
    "aɪɚ": ["aɪ", "ɚ"],
    "əl": ["ə", "l"],
}
_RENAME = {"r": "ɹ", "ɝ": "ɚ", "g": "ɡ", "n̩": "n"}
_STRIP_CHARS = "ˈˌ0123456789"


def normalize(phones: list[str]) -> list[str]:
    """Strip stress/tone marks, unify variants, split rhotic diphthongs."""
    out: list[str] = []
    for raw in phones:
        p = raw.strip().translate({ord(c): None for c in _STRIP_CHARS})
        if not p:
            continue
        p = _RENAME.get(p, p)
        out.extend(_SPLIT.get(p, [p]))
    return out


def base(p: str) -> str:
    """Comparison key: ignore vowel length (iː ≈ i)."""
    return p.replace("ː", "")


# ─── Target-sound rules ────────────────────────────────────────────────────


@dataclass(frozen=True)
class TargetRule:
    accepted: frozenset[str]
    errors: frozenset[str]  # typical childhood substitutions, used by the posterior check


# Which target phonemes count as "the sound" for each practice sound, and what
# we accept / what we treat as the error alternatives.
TARGET_RULES: dict[str, TargetRule] = {
    "ɹ": TargetRule(frozenset({"ɹ", "ɚ"}), frozenset({"w", "l", "ʊ", "j"})),
    "ɚ": TargetRule(frozenset({"ɚ", "ɹ", "ɜ", "ɜː"}), frozenset({"ə", "ʊ", "ɐ", "ʌ"})),
    "θ": TargetRule(frozenset({"θ", "ð"}), frozenset({"f", "t", "s", "d", "v"})),
}

SOUND_TARGETS: dict[Sound, frozenset[str]] = {
    "r": frozenset({"ɹ", "ɚ"}),
    "th": frozenset({"θ"}),
}


def target_positions(target: list[str], sound: Sound) -> list[int]:
    """Indexes in the (normalised) target that we judge.

    /r/: only an /ɹ/ followed by a vowel ("rabbit", "frog", "parrot"). That's
    where the classic w-for-r substitution happens. Syllable-final r
    ("reindeer", "rooster") is skipped: many accents don't pronounce it, so
    judging it would mark correct speech wrong.
    /th/: every /θ/.
    """
    if sound == "th":
        return [i for i, p in enumerate(target) if p == "θ"]
    return [
        i for i, p in enumerate(target)
        if p == "ɹ" and i + 1 < len(target) and target[i + 1] in VOWELS
    ]


def infer_sound(target: list[str]) -> Sound:
    t = set(normalize(target))
    if "θ" in t:
        return "th"
    if t & SOUND_TARGETS["r"]:
        return "r"
    raise ValueError(f"target {target} contains no /r/ or /θ/ sound")


# ─── Alignment ─────────────────────────────────────────────────────────────

Pair = tuple[int | None, int | None]  # (target index, heard index); None = gap


# Consonants differing only in voicing (t/d, s/z…): a small slip, half cost.
_VOICING_PAIRS = {
    frozenset(p)
    for p in [("p", "b"), ("t", "d"), ("k", "ɡ"), ("f", "v"), ("s", "z"), ("ʃ", "ʒ"), ("tʃ", "dʒ"), ("θ", "ð")]
}


def _sub_cost(a: str, b: str) -> float:
    if base(a) == base(b):
        return 0.0
    if a in VOWELS and b in VOWELS:
        return 0.3  # vowel quality varies a lot between speakers/accents; not what we judge
    if frozenset((a, b)) in _VOICING_PAIRS:
        return 0.5
    return 1.0


def align(target: list[str], heard: list[str]) -> tuple[list[Pair], float]:
    """Weighted Levenshtein alignment. Returns (pairs, total cost)."""
    n, m = len(target), len(heard)
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = float(i)
    for j in range(1, m + 1):
        dp[0][j] = float(j)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            dp[i][j] = min(
                dp[i - 1][j - 1] + _sub_cost(target[i - 1], heard[j - 1]),
                dp[i - 1][j] + 1.0,  # deletion (target phone not heard)
                dp[i][j - 1] + 1.0,  # insertion (extra heard phone)
            )
    pairs: list[Pair] = []
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + _sub_cost(target[i - 1], heard[j - 1]):
            pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1.0:
            pairs.append((i - 1, None))
            i -= 1
        else:
            pairs.append((None, j - 1))
            j -= 1
    pairs.reverse()
    return pairs, dp[n][m]
