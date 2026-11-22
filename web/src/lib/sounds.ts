import type { Sound } from "@/types/session";

/** Display info for each target sound. Ids match the `sound` enum in Supabase. */
export type SoundInfo = {
  id: Sound;
  /** Shown large on cards and badges, e.g. "/l/" */
  ipa: string;
  /** Short label for chips and filters */
  label: string;
  /** Text before the example word, e.g. "as in" */
  examplePrefix: string;
  exampleWord: string;
};

export const SOUNDS: Record<Sound, SoundInfo> = {
  r: { id: "r", ipa: "/r/", label: "/r/", examplePrefix: "as in", exampleWord: "rabbit" },
  l: { id: "l", ipa: "/l/", label: "/l/", examplePrefix: "as in", exampleWord: "lion" },
};

export const SOUND_LIST: SoundInfo[] = Object.values(SOUNDS);

export function isSound(value: string): value is Sound {
  return value in SOUNDS;
}

/** Pictures per practice session. */
export const SESSION_LENGTH = 10;
