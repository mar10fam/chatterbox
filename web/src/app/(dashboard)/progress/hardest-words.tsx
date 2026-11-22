import { PartyPopper, TextAlignStart } from "lucide-react";
import { EmptyState } from "@/components/dashboard-card";
import type { Child } from "@/lib/child";
import { SOUNDS } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/server";
import type { Sound } from "@/types/session";

const MAX_WORDS = 5;

/**
 * Words the child misses most, from the word_difficulty view
 * (one row per child per word: attempts, misses, miss_rate).
 */
export async function HardestWords({ sound, child }: { sound: "all" | Sound; child: Child }) {
  const supabase = await createClient();

  let query = supabase
    .from("word_difficulty")
    .select("word_id, sound, attempts, misses, miss_rate")
    .eq("child_id", child.id)
    .gt("misses", 0)
    .order("miss_rate", { ascending: false })
    .order("misses", { ascending: false })
    .limit(MAX_WORDS);
  if (sound !== "all") query = query.eq("sound", sound);

  const [{ data: rows, error }, { data: words }] = await Promise.all([
    query,
    supabase.from("words").select("id, label"),
  ]);
  if (error) {
    console.error("word_difficulty query failed:", error.code, error.message);
    return <p className="text-sm text-muted-foreground">Couldn’t load hardest words. Please try again.</p>;
  }

  const labels = new Map((words ?? []).map((w) => [w.id, w.label]));
  const items = (rows ?? []).filter((r) => r.word_id && r.sound);

  if (items.length === 0) {
    // Distinguish "no practice yet" from "practiced, and nothing was missed".
    let practiced = supabase
      .from("word_difficulty")
      .select("word_id", { count: "exact", head: true })
      .eq("child_id", child.id);
    if (sound !== "all") practiced = practiced.eq("sound", sound);
    const { count } = await practiced;

    return (count ?? 0) > 0 ? (
      <EmptyState
        icon={PartyPopper}
        title="No tricky words right now"
        description={`${child.name} has been saying every word just right. Keep it up!`}
        className="h-[150px] lg:h-auto lg:min-h-70"
      />
    ) : (
      <EmptyState
        icon={TextAlignStart}
        title="Nothing to show yet"
        description="Words your child finds tricky will be listed here."
        className="h-[150px] lg:h-auto lg:min-h-70"
      />
    );
  }

  return (
    <ol className="flex flex-1 flex-col gap-2 rounded-2xl bg-card p-3 lg:rounded-[18px] lg:p-4" aria-label="Hardest words">
      {items.map((r) => {
        const missRate = Math.round(r.miss_rate ?? 0);
        return (
          <li key={r.word_id} className="flex flex-col gap-1.5 rounded-xl px-2 py-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-baseline gap-2">
                <span className="font-bold">{labels.get(r.word_id!) ?? r.word_id}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 font-heading text-xs font-semibold">
                  {SOUNDS[r.sound as Sound].ipa}
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums">{missRate}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-secondary"
              role="img"
              aria-label={`Missed ${missRate}% of the time`}
            >
              <div className="h-full rounded-full bg-[#e5689a]" style={{ width: `${Math.max(missRate, 4)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">
              Missed {r.misses} of {r.attempts} {r.attempts === 1 ? "try" : "tries"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
