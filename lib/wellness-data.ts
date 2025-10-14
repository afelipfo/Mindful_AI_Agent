import {
  moodEntries,
  triggerFrequency,
  copingEffectiveness,
  wellnessGoals,
  aiInsights,
} from "@/lib/sample-data"

import type { MoodEntry, WellnessGoal, AIInsight } from "@/lib/sample-data"

export interface WellnessSnapshot {
  moodEntries: MoodEntry[]
  triggerFrequency: Record<string, number>
  copingEffectiveness: Record<string, number>
  wellnessGoals: WellnessGoal[]
  aiInsights: AIInsight[]
}

export function getDemoWellnessSnapshot(): WellnessSnapshot {
  return {
    moodEntries,
    triggerFrequency,
    copingEffectiveness,
    wellnessGoals,
    aiInsights,
  }
}
