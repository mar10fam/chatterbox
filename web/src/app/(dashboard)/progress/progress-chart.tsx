import { createClient } from "@/lib/supabase/server"
import { AccuracyChart, type SessionPoint } from "@/components/accuracy-chart"
import { ChartLine } from "lucide-react";
import { EmptyState } from "@/components/dashboard-card";

export async function ProgressChart({
  sound,
}: {
  sound: "all" | "r" | "th"
}) {
  const supabase = await createClient()

  let query = supabase
    .from("session_progress")
    .select("session_id, sound, completed_at, accuracy")
    .order("completed_at")
  if (sound !== "all") query = query.eq("sound", sound)

  const { data, error } = await query

  if (error) {
    return <p>Couldn't load progress. Please try again.</p>
  }

  const points: SessionPoint[] = []
  for (const row of data ?? []) {
    // skip rows with missing values (view columns can be null)
    if (!row.completed_at || !row.sound || row.accuracy == null) continue
    points.push({
      date: new Date(row.completed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      [row.sound as "r" | "th"]: row.accuracy,
    })
  }

  if (points.length === 0) {
  return (
    <EmptyState
      icon={ChartLine}
      title="No practice sessions yet"
      description="Accuracy for each sound will show up here after the first session."
      className="h-[190px] lg:h-auto lg:min-h-70"
    />
  );
}

  return <AccuracyChart data={points} sound={sound} />
}