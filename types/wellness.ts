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
  id?: string
  goal: string
  target: number
  current: number
  unit: string
  progress: number
}

export type AIInsightType = "pattern" | "recommendation" | "alert"

export interface AIInsight {
  id?: string
  type: AIInsightType
  title: string
  description: string
  action?: string
  isRead?: boolean
}

export interface EnergyBucket {
  day: string
  hour: number
  energy: number
}

export interface WellnessSnapshot {
  moodEntries: MoodEntry[]
  triggerFrequency: Record<string, number>
  copingEffectiveness: Record<string, number>
  wellnessGoals: WellnessGoal[]
  aiInsights: AIInsight[]
  energyBuckets: EnergyBucket[]
}
