import { TextAlignStart } from "lucide-react"
import { EmptyState } from "@/components/dashboard-card"
import { createClient } from "@/lib/supabase/server"

const MIN_ATTEMPTS = 3 // ignore words tried too few times to judge
const MAX_WORDS = 5

export async function HardestWords({ sound }: { sound: "all" | "r" | "l" }) {
  const supabase = await createClient()

  // Same child lookup as the chart, so both cards always show the same kid.
  const { data: kids, error: kidsError } = await supabase
    .from("children")
    .select("id")
    .order("name")

  if (kidsError) {
    console.error("children query failed:", kidsError.code, kidsError.message)
    return <p>Couldn&apos;t load words. Please try again.</p>
  }

  const child = kids?.[0]

  const empty = (
    <EmptyState
      icon={TextAlignStart}
      title="Nothing to show yet"
      description="Words your child finds tricky will be listed here."
      className="h-[150px] lg:h-auto lg:min-h-70"
    />
  )
  if (!child) return empty

  let query = supabase
    .from("word_difficulty")
    .select("word_id, sound, attempts, misses")
    .eq("child_id", child.id)
  // TODO: remove the cast once src/types/database.ts is regenerated
  if (sound !== "all") query = query.eq("sound", sound as "r" | "th")

  const { data, error } = await query

  if (error) {
    console.error("word_difficulty query failed:", {
      sound,
      code: error.code,
      message: error.message,
    })
    return <p>Couldn&apos;t load words. Please try again.</p>
  }

  const words = (data ?? [])
    .filter((r) => r.word_id && r.attempts != null && r.misses != null && r.attempts >= MIN_ATTEMPTS)
    .map((r) => ({
      word: r.word_id as string,
      attempts: r.attempts as number,
      misses: r.misses as number,
      rate: (r.misses as number) / (r.attempts as number),
    }))
    .filter((w) => w.misses > 0)
    .sort((a, b) => b.rate - a.rate || b.attempts - a.attempts)
    .slice(0, MAX_WORDS)

  if (words.length === 0) return empty

  return (
    <ol className="flex flex-col gap-4">
      {words.map((w, i) => (
        <li key={w.word} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold capitalize">
              {i + 1}. {w.word}
            </span>
            <span className="text-sm text-muted-foreground">
              missed {w.misses} of {w.attempts}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.round(w.rate * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}