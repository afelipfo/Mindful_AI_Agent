import type { EnergyBucket, MoodEntry } from "@/types/wellness"

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

export function normalizeTriggerFrequency(entries: MoodEntry[]): Record<string, number> {
  const frequency: Record<string, number> = {}
  entries.forEach((entry) => {
    entry.triggers?.forEach((trigger) => {
      const key = trigger.trim()
      if (!key) return
      frequency[key] = (frequency[key] ?? 0) + 1
    })
  })
  return frequency
}

export function normalizeCopingEffectiveness(entries: MoodEntry[]): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {}

  entries.forEach((entry) => {
    if (!entry.coping?.length) return
    entry.coping.forEach((strategy) => {
      const key = strategy.trim()
      if (!key) return
      if (!totals[key]) {
        totals[key] = { sum: 0, count: 0 }
      }
      totals[key].sum += entry.mood
      totals[key].count += 1
    })
  })

  return Object.fromEntries(
    Object.entries(totals).map(([strategy, stats]) => [
      strategy,
      Number((stats.sum / Math.max(stats.count, 1)).toFixed(1)),
    ]),
  )
}

export function bucketHour(hourValue: number): number {
  if (hourValue >= 5 && hourValue <= 11) return 8
  if (hourValue >= 12 && hourValue <= 17) return 14
  return 20
}

export function aggregateEnergyByEntries(entries: MoodEntry[]): EnergyBucket[] {
  const accumulator = new Map<string, { day: string; hour: number; total: number; count: number }>()

  entries.forEach((entry) => {
    if (typeof entry.energy !== "number") return
    const timestamp = entry.createdAt ? new Date(entry.createdAt) : new Date(entry.date)
    if (Number.isNaN(timestamp.getTime())) return
    const day = DAY_LABELS[timestamp.getUTCDay()]
    const hour = bucketHour(timestamp.getUTCHours())
    const key = `${day}-${hour}`
    const current = accumulator.get(key) ?? { day, hour, total: 0, count: 0 }
    current.total += entry.energy
    current.count += 1
    accumulator.set(key, current)
  })

  return Array.from(accumulator.values()).map((bucket) => ({
    day: bucket.day,
    hour: bucket.hour,
    energy: Number((bucket.total / Math.max(bucket.count, 1)).toFixed(1)),
  }))
}
