// Sample data for the wellness app

import type { AIInsight, MoodEntry, WellnessGoal } from "@/types/wellness"

export interface EmpathyRecommendation {
  empathyMessage: string
  recommendation: {
    title: string
    description: string
    actionLabel: string
    actionType: "breathing" | "journal" | "timer" | "contact"
  }
  quote: {
    text: string
    author: string
  }
  music: {
    title: string
    artist: string
    reason: string
    spotifyUrl: string
    appleMusicUrl: string
  }
  book: {
    title: string
    author: string
    relevance: string
    amazonUrl: string
  }
  place: {
    type: string
    reason: string
    benefits: string
  }
}

export const moodEntries: MoodEntry[] = [
  {
    date: "2024-10-13",
    mood: 7,
    energy: 6,
    emotions: ["hopeful", "tired"],
    triggers: ["work deadline"],
    coping: ["walk outside"],
    type: "text",
  },
  {
    date: "2024-10-12",
    mood: 5,
    energy: 4,
    emotions: ["anxious", "overwhelmed"],
    triggers: ["poor sleep", "social event"],
    coping: ["deep breathing"],
    type: "voice",
  },
  {
    date: "2024-10-11",
    mood: 8,
    energy: 8,
    emotions: ["calm", "focused"],
    triggers: ["exercise", "good sleep"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-10-10",
    mood: 6,
    energy: 5,
    emotions: ["neutral", "tired"],
    triggers: ["work deadline"],
    coping: ["walk outside"],
    type: "text",
  },
  {
    date: "2024-10-09",
    mood: 7,
    energy: 7,
    emotions: ["happy", "energetic"],
    triggers: ["good sleep", "exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-10-08",
    mood: 4,
    energy: 3,
    emotions: ["sad", "lonely"],
    triggers: ["poor sleep", "conflict"],
    coping: ["call friend"],
    type: "text",
  },
  {
    date: "2024-10-07",
    mood: 8,
    energy: 8,
    emotions: ["joyful", "content"],
    triggers: ["social event", "exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-10-06",
    mood: 6,
    energy: 6,
    emotions: ["calm", "focused"],
    triggers: ["good sleep"],
    coping: ["deep breathing"],
    type: "text",
  },
  {
    date: "2024-10-05",
    mood: 5,
    energy: 4,
    emotions: ["anxious", "stressed"],
    triggers: ["work deadline"],
    coping: ["walk outside"],
    type: "voice",
  },
  {
    date: "2024-10-04",
    mood: 7,
    energy: 7,
    emotions: ["hopeful", "motivated"],
    triggers: ["exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-10-03",
    mood: 6,
    energy: 5,
    emotions: ["neutral", "tired"],
    triggers: ["poor sleep"],
    coping: ["deep breathing"],
    type: "text",
  },
  {
    date: "2024-10-02",
    mood: 8,
    energy: 8,
    emotions: ["happy", "energetic"],
    triggers: ["good sleep", "social event"],
    coping: ["exercise"],
    type: "emoji",
  },
  {
    date: "2024-10-01",
    mood: 5,
    energy: 4,
    emotions: ["overwhelmed", "anxious"],
    triggers: ["work deadline"],
    coping: ["walk outside"],
    type: "voice",
  },
  {
    date: "2024-09-30",
    mood: 7,
    energy: 6,
    emotions: ["calm", "content"],
    triggers: ["exercise"],
    coping: ["meditation"],
    type: "text",
  },
  {
    date: "2024-09-29",
    mood: 6,
    energy: 6,
    emotions: ["neutral", "focused"],
    triggers: ["good sleep"],
    coping: ["deep breathing"],
    type: "emoji",
  },
  {
    date: "2024-09-28",
    mood: 4,
    energy: 3,
    emotions: ["sad", "tired"],
    triggers: ["poor sleep", "conflict"],
    coping: ["call friend"],
    type: "text",
  },
  {
    date: "2024-09-27",
    mood: 8,
    energy: 8,
    emotions: ["joyful", "energetic"],
    triggers: ["exercise", "social event"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-09-26",
    mood: 7,
    energy: 7,
    emotions: ["hopeful", "motivated"],
    triggers: ["good sleep"],
    coping: ["walk outside"],
    type: "text",
  },
  {
    date: "2024-09-25",
    mood: 5,
    energy: 4,
    emotions: ["anxious", "stressed"],
    triggers: ["work deadline"],
    coping: ["deep breathing"],
    type: "voice",
  },
  {
    date: "2024-09-24",
    mood: 6,
    energy: 6,
    emotions: ["calm", "focused"],
    triggers: ["exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-09-23",
    mood: 7,
    energy: 7,
    emotions: ["happy", "content"],
    triggers: ["good sleep", "social event"],
    coping: ["walk outside"],
    type: "text",
  },
  {
    date: "2024-09-22",
    mood: 5,
    energy: 4,
    emotions: ["overwhelmed", "tired"],
    triggers: ["poor sleep"],
    coping: ["deep breathing"],
    type: "voice",
  },
  {
    date: "2024-09-21",
    mood: 8,
    energy: 8,
    emotions: ["joyful", "energetic"],
    triggers: ["exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-09-20",
    mood: 6,
    energy: 5,
    emotions: ["neutral", "calm"],
    triggers: ["good sleep"],
    coping: ["walk outside"],
    type: "text",
  },
  {
    date: "2024-09-19",
    mood: 7,
    energy: 7,
    emotions: ["hopeful", "motivated"],
    triggers: ["exercise", "social event"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-09-18",
    mood: 4,
    energy: 3,
    emotions: ["sad", "lonely"],
    triggers: ["poor sleep", "conflict"],
    coping: ["call friend"],
    type: "text",
  },
  {
    date: "2024-09-17",
    mood: 8,
    energy: 8,
    emotions: ["happy", "energetic"],
    triggers: ["good sleep", "exercise"],
    coping: ["meditation"],
    type: "emoji",
  },
  {
    date: "2024-09-16",
    mood: 6,
    energy: 6,
    emotions: ["calm", "focused"],
    triggers: ["exercise"],
    coping: ["deep breathing"],
    type: "text",
  },
  {
    date: "2024-09-15",
    mood: 7,
    energy: 7,
    emotions: ["hopeful", "content"],
    triggers: ["good sleep"],
    coping: ["walk outside"],
    type: "emoji",
  },
  {
    date: "2024-09-14",
    mood: 5,
    energy: 4,
    emotions: ["anxious", "stressed"],
    triggers: ["work deadline"],
    coping: ["deep breathing"],
    type: "voice",
  },
]

export const triggerFrequency: Record<string, number> = {
  "work deadline": 12,
  "poor sleep": 8,
  "social event": 6,
  exercise: 5,
  conflict: 4,
  "good sleep": 10,
}

export const copingEffectiveness: Record<string, number> = {
  "deep breathing": 6.5,
  "walk outside": 7.2,
  "call friend": 7.8,
  meditation: 8.1,
  exercise: 8.3,
}

export const wellnessGoals: WellnessGoal[] = [
  { goal: "Sleep 7+ hours", target: 7, current: 6.2, unit: "hours", progress: 89 },
  { goal: "Daily movement", target: 30, current: 22, unit: "minutes", progress: 73 },
  { goal: "Reduce anxiety", target: 5, current: 6.5, unit: "score", progress: 45 },
]

export const aiInsights: AIInsight[] = [
  {
    type: "pattern",
    title: "Monday Energy Dips",
    description:
      "Your energy consistently drops on Mondays after 2pm, especially following meetings. Consider scheduling lighter tasks in the afternoon.",
    action: "Block focus time",
  },
  {
    type: "recommendation",
    title: "Walking Boosts Mood",
    description:
      "Walking outside improves your mood by an average of 2 points. You've done this 5 times with consistent positive results.",
    action: "Set daily reminder",
  },
  {
    type: "alert",
    title: "Sleep Impact",
    description:
      "You've logged less than 6 hours of sleep for 4 consecutive days. Sleep quality strongly correlates with your mood scores.",
    action: "View sleep tips",
  },
]

export const emojiMoods = [
  { emoji: "😊", label: "Happy", value: 8 },
  { emoji: "😐", label: "Neutral", value: 5 },
  { emoji: "😔", label: "Sad", value: 3 },
  { emoji: "😡", label: "Angry", value: 2 },
  { emoji: "😰", label: "Anxious", value: 4 },
  { emoji: "😌", label: "Calm", value: 7 },
]

export const empathyRecommendations: EmpathyRecommendation[] = [
  {
    empathyMessage: "I understand how tough it can be when you're feeling overwhelmed.",
    recommendation: {
      title: "Try Deep Breathing",
      description: "Deep breathing exercises can help calm your mind and reduce anxiety.",
      actionLabel: "Start Breathing",
      actionType: "breathing",
    },
    quote: {
      text: "The greatest weapon against stress is our ability to choose one thought over another.",
      author: "William James",
    },
    music: {
      title: "Weightless",
      artist: "Marconi Union",
      reason: "Helps reduce anxiety and promote relaxation.",
      spotifyUrl: "https://open.spotify.com/track/6rqhFgmcJRFnvn55YQnQfP",
      appleMusicUrl: "https://music.apple.com/us/album/weightless-single/1440748978?i=1440748979",
    },
    book: {
      title: "The Power of Now",
      author: "Eckhart Tolle",
      relevance: "Teaches mindfulness and being present.",
      amazonUrl: "https://www.amazon.com/Power-Now-Eckhart-Tolle/dp/0345477138",
    },
    place: {
      type: "park",
      reason: "Nature can be very soothing and help clear your mind.",
      benefits: "Improves mood, reduces stress, and increases energy levels.",
    },
  },
]
