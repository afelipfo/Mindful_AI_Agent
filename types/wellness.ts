export type MoodEntryType = "text" | "voice" | "emoji" | "photo"

export interface MoodEntry {
  id?: string
  date: string
  mood: number
  energy: number
  emotions: string[]
  triggers: string[]
  coping: string[]
  type: MoodEntryType
  note?: string
  audioUrl?: string
  photoUrl?: string
  createdAt?: string
}

export interface WellnessGoal {
  goal: string
  target: number
  current: number
  unit: string
  progress: number
}

export type AIInsightType = "pattern" | "recommendation" | "alert"

export interface AIInsight {
  type: AIInsightType
  title: string
  description: string
  action?: string
}

export interface WellnessSnapshot {
  moodEntries: MoodEntry[]
  triggerFrequency: Record<string, number>
  copingEffectiveness: Record<string, number>
  wellnessGoals: WellnessGoal[]
  aiInsights: AIInsight[]
}
