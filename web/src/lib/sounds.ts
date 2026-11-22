import type { Sound } from "@/types/session";

/** Display info for each target sound. Ids match the `sound` enum in Supabase. */
export type SoundInfo = {
  id: Sound;
  /** IPA shown large, e.g. "/θ/" */
  ipa: string;
  /** Short label for chips and filters */
  label: string;
  /** "as in" / "“th” as in" */
  examplePrefix: string;
  exampleWord: string;
};

export const SOUNDS: Record<Sound, SoundInfo> = {
  r: { id: "r", ipa: "/r/", label: "/r/", examplePrefix: "as in", exampleWord: "rabbit" },
  th: { id: "th", ipa: "/θ/", label: "/θ/ “th”", examplePrefix: "“th” as in", exampleWord: "thumb" },
};

export const SOUND_LIST: SoundInfo[] = Object.values(SOUNDS);

export function isSound(value: string): value is Sound {
  return value in SOUNDS;
}

/** Pictures per practice session. */
export const SESSION_LENGTH = 10;
