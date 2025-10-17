/**
 * MCP Tools - Standalone implementations for Next.js API routes
 * These are copies of the MCP server tools that can be used directly
 * without requiring the MCP SDK dependencies
 */

import { z } from "zod";

// ============================================================================
// MOOD ANALYSIS TOOL
// ============================================================================

export const MoodAnalysisInputSchema = z.object({
  text: z.string().describe("User's text input describing their feelings or situation"),
  emotions: z.array(z.string()).optional().describe("List of detected emotions"),
  moodScore: z.number().min(1).max(10).optional().describe("Mood score from 1-10"),
  energyLevel: z.number().min(1).max(10).optional().describe("Energy level from 1-10"),
  context: z.string().optional().describe("Additional context about the user's situation"),
});

export type MoodAnalysisInput = z.infer<typeof MoodAnalysisInputSchema>;

export const MoodAnalysisOutputSchema = z.object({
  detectedMood: z.enum(["anxious", "happy", "sad", "tired", "stressed", "excited"]),
  confidence: z.number().min(0).max(100),
  emotions: z.array(z.string()),
  triggers: z.array(z.string()),
  severity: z.enum(["low", "moderate", "high"]),
  analysis: z.string(),
  recommendations: z.array(z.string()),
});

export type MoodAnalysisOutput = z.infer<typeof MoodAnalysisOutputSchema>;

const moodKeywords = {
  anxious: ["anxious", "worried", "nervous", "uneasy", "panic", "overwhelmed", "scared", "afraid"],
  happy: ["happy", "grateful", "calm", "content", "peaceful", "joyful", "good", "great"],
  sad: ["sad", "down", "depressed", "lonely", "upset", "heartbroken", "miserable", "hopeless"],
  tired: ["tired", "exhausted", "fatigued", "drained", "sleepy", "worn out", "burned out"],
  stressed: ["stressed", "pressure", "tense", "frustrated", "irritated", "rushed", "overwhelmed"],
  excited: ["excited", "energized", "pumped", "thrilled", "motivated", "inspired", "enthusiastic"],
} as const;

export async function analyzeMood(input: MoodAnalysisInput): Promise<MoodAnalysisOutput> {
  const text = input.text.toLowerCase();

  let bestMood: keyof typeof moodKeywords = "tired";
  let maxMatches = 0;
  const detectedEmotions = new Set<string>(input.emotions || []);

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        detectedEmotions.add(keyword);
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMood = mood as keyof typeof moodKeywords;
    }
  }

  const triggers: string[] = [];
  const triggerPatterns = [
    { pattern: /work|job|boss|colleague/i, trigger: "work" },
    { pattern: /family|parent|sibling|relative/i, trigger: "family" },
    { pattern: /relationship|partner|spouse|dating/i, trigger: "relationships" },
    { pattern: /money|financial|debt|bills/i, trigger: "finances" },
    { pattern: /health|sick|pain|illness/i, trigger: "health" },
    { pattern: /sleep|insomnia|rest/i, trigger: "sleep" },
    { pattern: /friend|social|lonely|alone/i, trigger: "social" },
  ];

  for (const { pattern, trigger } of triggerPatterns) {
    if (pattern.test(input.text)) {
      triggers.push(trigger);
    }
  }

  let confidence = 60;
  if (maxMatches > 0) confidence += Math.min(20, maxMatches * 5);
  if (input.moodScore) confidence += 10;
  if (input.energyLevel) confidence += 5;
  if (input.context) confidence += 5;
  confidence = Math.min(95, confidence);

  let severity: "low" | "moderate" | "high" = "moderate";
  if (input.moodScore) {
    if (["anxious", "sad", "stressed"].includes(bestMood)) {
      if (input.moodScore <= 3) severity = "high";
      else if (input.moodScore <= 5) severity = "moderate";
      else severity = "low";
    } else {
      severity = "low";
    }
  }

  let analysis = `Based on your input, I'm detecting a ${bestMood} emotional state`;
  if (input.moodScore) analysis += ` with a mood score of ${input.moodScore}/10`;
  if (detectedEmotions.size > 0) analysis += `. Key emotions identified: ${Array.from(detectedEmotions).slice(0, 3).join(", ")}`;
  if (triggers.length > 0) analysis += `. Main triggers appear to be related to: ${triggers.join(", ")}`;
  if (input.energyLevel) analysis += `. Your energy level is at ${input.energyLevel}/10`;
  analysis += ".";

  const moodRecs: Record<string, string[]> = {
    anxious: [
      "Try the 4-7-8 breathing technique: inhale for 4s, hold for 7s, exhale for 8s",
      "Consider a 10-minute guided meditation session",
      "Take a short walk outside if possible",
    ],
    sad: [
      "Reach out to a trusted friend or family member",
      "Write down three things you're grateful for today",
      "Engage in a gentle physical activity like stretching",
    ],
    stressed: [
      "Take a 5-minute break from current tasks",
      "Practice progressive muscle relaxation",
      "Prioritize your tasks and delegate if possible",
    ],
    tired: [
      "Consider a 15-20 minute power nap",
      "Step outside for fresh air and sunlight",
      "Ensure you're staying hydrated throughout the day",
    ],
    happy: [
      "Journal about what's making you feel good",
      "Share your positive energy with others",
      "Set an intention to maintain this momentum",
    ],
    excited: [
      "Channel this energy into a creative project",
      "Physical activity can amplify positive feelings",
      "Document this moment for future reflection",
    ],
  };

  const recommendations: string[] = [...(moodRecs[bestMood] || moodRecs.tired).slice(0, 3)];

  if (severity === "high") {
    recommendations.push(
      "Consider reaching out to a mental health professional",
      "Use crisis resources if you're in immediate distress"
    );
  }

  if (triggers.includes("work")) recommendations.push("Set clear boundaries between work and personal time");
  if (triggers.includes("sleep")) recommendations.push("Establish a consistent bedtime routine");
  if (triggers.includes("social")) recommendations.push("Reach out to supportive friends or join a community group");

  return {
    detectedMood: bestMood,
    confidence,
    emotions: Array.from(detectedEmotions).slice(0, 5),
    triggers,
    severity,
    analysis,
    recommendations: recommendations.slice(0, 5),
  };
}

// ============================================================================
// WELLNESS RECOMMENDATIONS TOOL
// ============================================================================

export const WellnessRecommendationsInputSchema = z.object({
  mood: z.enum(["anxious", "happy", "sad", "tired", "stressed", "excited"]),
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  triggers: z.array(z.string()).optional(),
  preferences: z.object({
    activityLevel: z.enum(["low", "moderate", "high"]).optional(),
    timeAvailable: z.number().optional().describe("Minutes available"),
    environment: z.enum(["home", "work", "outdoor", "any"]).optional(),
  }).optional(),
});

export type WellnessRecommendationsInput = z.infer<typeof WellnessRecommendationsInputSchema>;

export const WellnessRecommendationSchema = z.object({
  type: z.enum(["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]),
  title: z.string(),
  description: z.string(),
  duration: z.number().describe("Duration in minutes"),
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  benefits: z.array(z.string()),
  instructions: z.array(z.string()),
});

export type WellnessRecommendation = z.infer<typeof WellnessRecommendationSchema>;

// Simple placeholder implementation - you can expand this
export async function generateWellnessRecommendations(
  input: WellnessRecommendationsInput
): Promise<{ immediate: WellnessRecommendation[]; shortTerm: WellnessRecommendation[]; longTerm: WellnessRecommendation[] }> {
  // Simplified version - return basic recommendations based on mood
  const immediate: WellnessRecommendation[] = [
    {
      type: "breathing",
      title: "Deep Breathing Exercise",
      description: "Quick breathing to calm your nervous system",
      duration: 3,
      difficulty: "easy",
      benefits: ["Reduces stress", "Calms mind"],
      instructions: ["Breathe in for 4 counts", "Hold for 4", "Breathe out for 4"],
    },
  ];

  const shortTerm: WellnessRecommendation[] = [
    {
      type: "meditation",
      title: "Guided Meditation",
      description: "Short meditation session",
      duration: 10,
      difficulty: "easy",
      benefits: ["Reduces anxiety", "Improves focus"],
      instructions: ["Find quiet space", "Close eyes", "Focus on breath"],
    },
  ];

  const longTerm: WellnessRecommendation[] = [
    {
      type: "exercise",
      title: "Daily Exercise Routine",
      description: "Regular physical activity",
      duration: 30,
      difficulty: "moderate",
      benefits: ["Improves mood", "Boosts energy", "Better sleep"],
      instructions: ["Start with 15 min/day", "Gradually increase", "Find activities you enjoy"],
    },
  ];

  return { immediate, shortTerm, longTerm };
}

// ============================================================================
// USER INSIGHTS TOOL
// ============================================================================

export const UserInsightsInputSchema = z.object({
  userId: z.string(),
  moodHistory: z.array(
    z.object({
      date: z.string(),
      mood: z.enum(["anxious", "happy", "sad", "tired", "stressed", "excited"]),
      moodScore: z.number().min(1).max(10),
      energyLevel: z.number().min(1).max(10),
      triggers: z.array(z.string()).optional(),
      emotions: z.array(z.string()).optional(),
    })
  ),
  timeframe: z.enum(["week", "month", "quarter", "year"]).optional(),
});

export type UserInsightsInput = z.infer<typeof UserInsightsInputSchema>;

// Simplified user insights
export async function generateUserInsights(input: UserInsightsInput): Promise<{
  summary: {
    averageMood: number;
    averageEnergy: number;
    mostCommonMood: string;
    moodStability: number;
    improvementTrend: "improving" | "declining" | "stable";
  };
  patterns: Array<{ type: string; description: string; confidence: number; recommendation: string }>;
  triggers: Array<{ trigger: string; frequency: number; impact: string }>;
  recommendations: string[];
  insights: string[];
}> {
  const { moodHistory } = input;

  if (moodHistory.length === 0) {
    return {
      summary: {
        averageMood: 0,
        averageEnergy: 0,
        mostCommonMood: "neutral",
        moodStability: 0,
        improvementTrend: "stable",
      },
      patterns: [],
      triggers: [],
      recommendations: ["Start tracking your mood regularly to generate personalized insights"],
      insights: ["No data available yet. Begin your wellness journey by logging your first check-in!"],
    };
  }

  const avgMood = moodHistory.reduce((sum, e) => sum + e.moodScore, 0) / moodHistory.length;
  const avgEnergy = moodHistory.reduce((sum, e) => sum + e.energyLevel, 0) / moodHistory.length;

  const moodCounts: Record<string, number> = {};
  moodHistory.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  const firstHalf = moodHistory.slice(0, Math.floor(moodHistory.length / 2));
  const secondHalf = moodHistory.slice(Math.floor(moodHistory.length / 2));
  const firstAvg = firstHalf.reduce((sum, e) => sum + e.moodScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + e.moodScore, 0) / secondHalf.length;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (secondAvg - firstAvg > 0.5) trend = "improving";
  else if (firstAvg - secondAvg > 0.5) trend = "declining";

  return {
    summary: {
      averageMood: Number(avgMood.toFixed(1)),
      averageEnergy: Number(avgEnergy.toFixed(1)),
      mostCommonMood,
      moodStability: 70,
      improvementTrend: trend,
    },
    patterns: [
      {
        type: "temporal",
        description: "Tracking patterns in your mood data",
        confidence: 75,
        recommendation: "Continue logging to identify more patterns",
      },
    ],
    triggers: [],
    recommendations: [
      "Keep tracking your mood daily for better insights",
      "Focus on activities that boost your energy",
    ],
    insights: [
      `Your average mood over this period was ${avgMood.toFixed(1)}/10`,
      `Your mood is ${trend}`,
    ],
  };
}
