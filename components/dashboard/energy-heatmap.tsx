"use client"

import { cn } from "@/lib/utils"

interface EnergyHeatmapProps {
  data: { day: string; hour: number; energy: number }[]
}

export function EnergyHeatmap({ data }: EnergyHeatmapProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const hours = ["Morning", "Afternoon", "Evening"]

  const getEnergyForDayAndHour = (day: string, hourLabel: string) => {
    const hourMap: Record<string, number> = {
      Morning: 8,
      Afternoon: 14,
      Evening: 20,
    }
    const entry = data.find((d) => d.day === day && d.hour === hourMap[hourLabel])
    return entry?.energy || 0
  }

  const getColor = (energy: number) => {
    if (energy >= 8) return "bg-success"
    if (energy >= 6) return "bg-primary"
    if (energy >= 4) return "bg-warning"
    if (energy >= 2) return "bg-danger/60"
    return "bg-muted"
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-2 text-xs">
        <div />
        {days.map((day) => (
          <div key={day} className="text-center font-medium text-text-muted">
            {day}
          </div>
        ))}
      </div>
      {hours.map((hour) => (
        <div key={hour} className="grid grid-cols-8 gap-2">
          <div className="flex items-center text-xs font-medium text-text-muted">{hour}</div>
          {days.map((day) => {
            const energy = getEnergyForDayAndHour(day, hour)
            return (
              <div
                key={`${day}-${hour}`}
                className={cn(
                  "aspect-square rounded-md transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-primary cursor-pointer",
                  getColor(energy),
                )}
                role="button"
                aria-label={`${day} ${hour}: energy ${energy} out of 10`}
                title={`${day} ${hour}: ${energy}/10`}
              />
            )
          })}
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-text-muted">
        <span>Low</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <div className="h-3 w-3 rounded-sm bg-danger/60" />
          <div className="h-3 w-3 rounded-sm bg-warning" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <div className="h-3 w-3 rounded-sm bg-success" />
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
