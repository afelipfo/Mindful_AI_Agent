"use client"

import { cn } from "@/lib/utils"

interface TriggerCloudProps {
  triggers: Record<string, number>
}

export function TriggerCloud({ triggers }: TriggerCloudProps) {
  const maxFrequency = Math.max(...Object.values(triggers))
  const minFrequency = Math.min(...Object.values(triggers))
  const range = maxFrequency - minFrequency

  const getFontSize = (frequency: number) => {
    if (range === 0) return 16
    const normalized = (frequency - minFrequency) / range
    return 14 + normalized * 20 // 14px to 34px
  }

  const getColor = (frequency: number) => {
    if (range === 0) return "text-text-primary"
    const normalized = (frequency - minFrequency) / range
    if (normalized > 0.7) return "text-danger"
    if (normalized > 0.4) return "text-warning"
    return "text-text-secondary"
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-4">
      {Object.entries(triggers)
        .sort(([, a], [, b]) => b - a)
        .map(([trigger, frequency]) => (
          <button
            key={trigger}
            className={cn(
              "transition-all duration-200 hover:scale-110 hover:opacity-100 font-medium",
              getColor(frequency),
            )}
            style={{ fontSize: `${getFontSize(frequency)}px` }}
            title={`${frequency} occurrences`}
          >
            {trigger}
          </button>
        ))}
    </div>
  )
}
