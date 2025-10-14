import type { WellnessSnapshot } from "@/types/wellness"

export const EMPTY_WELLNESS_SNAPSHOT: WellnessSnapshot = {
  moodEntries: [],
  triggerFrequency: {},
  copingEffectiveness: {},
  wellnessGoals: [],
  aiInsights: [],
}

export function getEmptyWellnessSnapshot(): WellnessSnapshot {
  return {
    moodEntries: [],
    triggerFrequency: {},
    copingEffectiveness: {},
    wellnessGoals: [],
    aiInsights: [],
  }
}

