"""Pure-logic tests (no model): normalisation, alignment, target-sound decisions."""

import numpy as np

from speech.scoring.phonemes import align, infer_sound, normalize, target_positions
from speech.scoring.score import judge


def test_normalize_strips_marks_and_splits_rhotics():
    assert normalize(["ˈɹ", "ɑ5", "ɪɹ", "r", "ɝ"]) == ["ɹ", "ɑ", "ɪ", "ɹ", "ɹ", "ɚ"]


def test_infer_sound():
    assert infer_sound(["θ", "ʌ", "m"]) == "th"
    assert infer_sound(["ɹ", "æ", "b", "ɪ", "t"]) == "r"


def test_align_substitution():
    pairs, cost = align(["ɹ", "æ", "b", "ɪ", "t"], ["w", "æ", "b", "ɪ", "t"])
    assert pairs[0] == (0, 0)
    assert cost == 1.0


def test_align_vowel_length_is_free():
    _, cost = align(["m", "ɑː", "θ"], ["m", "ɑ", "θ"])
    assert cost == 0.0


def test_judge_correct_r():
    ok, score, checks = judge(["ɹ", "æ", "b", "ɪ", "t"], ["ɹ", "æ", "b", "ɪ", "t"], "r")
    assert ok and score == 100.0 and checks[0].aligned_ok


def test_judge_wabbit_is_a_miss():
    ok, _, checks = judge(["ɹ", "æ", "b", "ɪ", "t"], ["w", "æ", "b", "ɪ", "t"], "r")
    assert not ok and checks[0].heard == "w"


def test_judge_only_target_sound_matters():
    # /r/ right but the vowel and final consonant wrong → still correct, lower score.
    ok, score, _ = judge(["ɹ", "æ", "b", "ɪ", "t"], ["ɹ", "ɛ", "b", "ɪ", "d"], "r")
    assert ok and score < 100


def test_only_r_before_a_vowel_is_judged():
    # reindeer: final /ɹ/ dropped (non-rhotic accent) is fine; only the initial /ɹ/ counts.
    target = normalize(["ɹ", "eɪ", "n", "d", "ɪɹ"])
    assert target_positions(target, "r") == [0]
    ok, _, checks = judge(target, ["ɹ", "eɪ", "n", "d", "ɪ"], "r")
    assert ok and len(checks) == 1
    # frog / parrot: cluster and between-vowel /ɹ/ are judged.
    assert target_positions(["f", "ɹ", "ɑː", "ɡ"], "r") == [1]
    assert target_positions(["p", "æ", "ɹ", "ə", "t"], "r") == [2]
    assert not judge(["f", "ɹ", "ɑː", "ɡ"], ["f", "w", "ɑ", "ɡ"], "r")[0]


def test_l_rules():
    assert infer_sound(["l", "aɪə", "n"]) == "l"
    assert normalize(["l", "aɪə", "n"]) == ["l", "aɪ", "ə", "n"]
    lion = normalize(["l", "aɪə", "n"])
    assert judge(lion, ["l", "aɪ", "ə", "n"], "l")[0]
    assert not judge(lion, ["w", "aɪ", "ə", "n"], "l")[0]  # "wion"
    assert not judge(lion, ["j", "aɪ", "ə", "n"], "l")[0]  # "yion"
    assert judge(lion, normalize(["ɫ", "aɪ", "ə", "n"]), "l")[0]
    assert target_positions(["k", "oʊ", "ɑː", "l", "ə"], "l") == [3]
    assert target_positions(["f", "l", "ɐ", "m", "ɪ", "ŋ", "ɡ", "oʊ"], "l") == [1]


def test_judge_th_fumb_is_a_miss_and_voiced_th_is_ok():
    assert not judge(["θ", "ʌ", "m"], ["f", "ʌ", "m"], "th")[0]
    assert judge(["θ", "ʌ", "m"], ["ð", "ʌ", "m"], "th")[0]


def test_posterior_rescues_quiet_th():
    # Greedy heard [s], but θ was nearly as likely as s in those frames.
    vocab = {"<pad>": 0, "θ": 1, "s": 2, "ʌ": 3, "m": 4, "f": 5}
    probs = np.zeros((3, 6))
    probs[0, [1, 2]] = [0.45, 0.55]  # frame 0: θ vs s
    probs[1, 3] = 1.0
    probs[2, 4] = 1.0
    spans = [(0, 1), (1, 2), (2, 3)]
    ok, _, checks = judge(["θ", "ʌ", "m"], ["s", "ʌ", "m"], "th", spans, probs, vocab)
    assert not checks[0].aligned_ok
    # 0.45 / (0.45 + 0.55) < 0.5 → still a miss at the default threshold
    assert not ok
    probs[0, [1, 2]] = [0.6, 0.4]
    ok, _, checks = judge(["θ", "ʌ", "m"], ["s", "ʌ", "m"], "th", spans, probs, vocab)
    assert ok and checks[0].confidence > 0.5
