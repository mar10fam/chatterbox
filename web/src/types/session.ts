// types/session.ts
// Shared contract between the session flow (writes data) and the analytics pages (reads data).
// Change this file only when BOTH people agree.

export type Sound = "r" | "th";

// ─────────────────────────────────────────────
// WRITE SIDE: produced by the session flow
// ─────────────────────────────────────────────

// One entry per picture. Added to state when /score returns for that picture.
export type AttemptResult = {
  word_id: string;              // "rabbit", must match an id in the word list
  item_index: number;           // 1..10, position in this session
  target_phonemes: string[];    // ["ɹ","æ","b","ɪ","t"]
  heard_phonemes: string[];     // ["w","æ","b","ɪ","t"]
  target_sound_correct: boolean;
  score: number;                // 0..100
};

// What the session flow sends to supabase.rpc("save_session", ...) when the session ends
export type SaveSessionArgs = {
  p_child_id: string;
  p_sound: Sound;
  p_started_at: string;         // ISO timestamp from when the session started
  p_attempts: AttemptResult[];  // exactly one per picture, in order
};

// ─────────────────────────────────────────────
// READ SIDE: rows returned by the analytics views
// ─────────────────────────────────────────────

// from "session_progress": one row per session (per-sound chart)
export type SessionProgressRow = {
  child_id: string;
  session_id: string;
  sound: Sound;
  completed_at: string;
  total_items: number;
  correct_count: number;
  accuracy: number;             // 0..100
};

// from "overall_progress": one row per day, all sounds combined (overall chart)
export type OverallProgressRow = {
  child_id: string;
  day: string;                  // "2026-11-21"
  total_items: number;
  correct_count: number;
  accuracy: number;             // 0..100
};

// from "word_difficulty": one row per word (hardest words list)
export type WordDifficultyRow = {
  child_id: string;
  word_id: string;
  sound: Sound;
  attempts: number;
  misses: number;
  miss_rate: number;            // 0..100
};
