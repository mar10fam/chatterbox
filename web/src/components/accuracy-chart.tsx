"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type SessionPoint = { date: string; r?: number; l?: number }

const chartConfig = {
  r: { label: "/r/", color: "#3b82f6" },
  l: { label: "/l/", color: "#f97316" },
} satisfies ChartConfig

export function AccuracyChart({
  data,
  sound,
}: {
  data: SessionPoint[]
  sound: "all" | "r" | "l"
}) {
  const keys = sound === "all" ? (["r", "l"] as const) : ([sound] as const)

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {keys.map((k) => (
          <Line
            key={k}
            dataKey={k}
            type="monotone"
            stroke={`var(--color-${k})`}
            strokeWidth={2}
            dot
            connectNulls
          />
        ))}
        {sound === "all" && <ChartLegend content={<ChartLegendContent />} />}
      </LineChart>
    </ChartContainer>
  )
}