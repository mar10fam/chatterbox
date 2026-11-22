"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { session: "Session 1", accuracy: 40 },
  { session: "Session 2", accuracy: 55 },
  { session: "Session 3", accuracy: 60 },
  { session: "Session 4", accuracy: 75 },
  { session: "Session 5", accuracy: 85 },
]

const chartConfig = {
  accuracy: { label: "Accuracy (%)", color: "#3b82f6" },
}

export default function ChartTest() {
  return (
    <Card className="max-w-3xl m-6">
      <CardHeader>
        <CardTitle>Adam's progress: "R" sound</CardTitle>
        <CardDescription>Accuracy per session</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="session" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}