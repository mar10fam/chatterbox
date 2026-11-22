import { ChartLine } from "lucide-react"
import { EmptyState } from "@/components/dashboard-card"
import { createClient } from "@/lib/supabase/server"
import { AccuracyChart, type SessionPoint } from "@/components/accuracy-chart"

type Sound = "r" | "l"

export async function ProgressChart({ sound }: { sound: "all" | Sound }) {
  const supabase = await createClient()

  const { data: kids, error: kidsError } = await supabase
    .from("children")
    .select("id, name")
    .order("created_at")
    .limit(1)

  if (kidsError) {
    console.error("children query failed:", kidsError.code, kidsError.message)
    return <p>Couldn&apos;t load progress. Please try again.</p>
  }

  const child = kids?.[0] // one child per parent for now
  if (!child) {
    return (
      <EmptyState
        icon={ChartLine}
        title="No children yet"
        description="Add a child to start tracking progress."
        className="h-[190px] lg:h-auto lg:min-h-70"
      />
    )
  }

  let query = supabase
    .from("session_progress")
    .select("session_id, child_id, sound, completed_at, accuracy")
    .eq("child_id", child.id)
    .order("completed_at")
  if (sound !== "all") query = query.eq("sound", sound)

  const { data, error } = await query

  if (error) {
    console.error("session_progress query failed:", {
      sound,
      code: error.code,
      message: error.message,
    })
    return <p>Couldn&apos;t load progress. Please try again.</p>
  }

  // One point per day per sound: average sessions that share a date.
  const byDate = new Map<string, Record<string, { total: number; n: number }>>()
  for (const row of data ?? []) {
    if (!row.completed_at || !row.sound || row.accuracy == null) continue
    const date = new Date(row.completed_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const day = byDate.get(date) ?? {}
    const acc = day[row.sound] ?? { total: 0, n: 0 }
    acc.total += row.accuracy
    acc.n += 1
    day[row.sound] = acc
    byDate.set(date, day)
  }

  const points: SessionPoint[] = [...byDate.entries()].map(([date, sounds]) => {
    const point: SessionPoint = { date }
    for (const s of ["r", "l"] as const) {
      const acc = sounds[s]
      if (acc) point[s] = Math.round(acc.total / acc.n)
    }
    return point
  })

  if (points.length === 0) {
    return (
      <EmptyState
        icon={ChartLine}
        title="No practice sessions yet"
        description={
          sound === "all"
            ? "Accuracy for each sound will show up here after the first session."
            : "No sessions for this sound yet."
        }
        className="h-[190px] lg:h-auto lg:min-h-70"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Showing progress for{" "}
        <span className="font-semibold text-foreground">{child.name}</span>
      </p>
      <AccuracyChart data={points} sound={sound} />
    </div>
  )
}