"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { MoodEntry } from "@/lib/sample-data"
import { format } from "date-fns"

interface MoodTrendChartProps {
  data: MoodEntry[]
}

export function MoodTrendChart({ data }: MoodTrendChartProps) {
  const chartData = data.map((entry) => ({
    date: format(new Date(entry.date), "MMM dd"),
    mood: entry.mood,
    energy: entry.energy,
  }))

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "hsl(var(--text-primary))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--text-secondary))" }}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            name="Mood"
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="hsl(var(--secondary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--secondary))", r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--secondary))" }}
            name="Energy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
