import { z } from "zod";

// Schema for user insights input
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

// Schema for pattern detection
export const PatternSchema = z.object({
  type: z.enum(["temporal", "trigger", "mood", "energy"]),
  description: z.string(),
  frequency: z.number().describe("How often this pattern occurs (percentage)"),
  confidence: z.number().min(0).max(100),
  recommendation: z.string(),
});

export type Pattern = z.infer<typeof PatternSchema>;

// Schema for user insights output
export const UserInsightsOutputSchema = z.object({
  summary: z.object({
    averageMood: z.number(),
    averageEnergy: z.number(),
    mostCommonMood: z.string(),
    moodStability: z.number().describe("Variance in mood scores, 0-100"),
    improvementTrend: z.enum(["improving", "declining", "stable"]),
  }),
  patterns: z.array(PatternSchema),
  triggers: z.array(
    z.object({
      trigger: z.string(),
      frequency: z.number(),
      impact: z.enum(["positive", "negative", "neutral"]),
    })
  ),
  recommendations: z.array(z.string()),
  insights: z.array(z.string()),
});

export type UserInsightsOutput = z.infer<typeof UserInsightsOutputSchema>;

/**
 * Analyzes user's historical data to generate insights and patterns
 */
export async function generateUserInsights(input: UserInsightsInput): Promise<UserInsightsOutput> {
  const { moodHistory } = input;

  if (moodHistory.length === 0) {
    return getEmptyInsights();
  }

  // Calculate summary statistics
  const summary = calculateSummary(moodHistory);

  // Detect patterns
  const patterns = detectPatterns(moodHistory);

  // Analyze triggers
  const triggers = analyzeTriggers(moodHistory);

  // Generate personalized recommendations
  const recommendations = generateRecommendations(summary, patterns, triggers);

  // Generate insights
  const insights = generateInsights(summary, patterns, triggers, moodHistory);

  return {
    summary,
    patterns,
    triggers,
    recommendations,
    insights,
  };
}

function calculateSummary(moodHistory: UserInsightsInput["moodHistory"]) {
  const moodScores = moodHistory.map((entry) => entry.moodScore);
  const energyLevels = moodHistory.map((entry) => entry.energyLevel);

  const averageMood = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;
  const averageEnergy = energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length;

  // Calculate mood frequency
  const moodCounts: Record<string, number> = {};
  moodHistory.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Calculate mood stability (lower variance = more stable)
  const meanMood = averageMood;
  const variance =
    moodScores.reduce((sum, score) => sum + Math.pow(score - meanMood, 2), 0) / moodScores.length;
  const moodStability = Math.max(0, Math.min(100, 100 - variance * 10));

  // Determine trend
  const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
  const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

  let improvementTrend: "improving" | "declining" | "stable" = "stable";
  if (secondHalfAvg - firstHalfAvg > 0.5) improvementTrend = "improving";
  else if (firstHalfAvg - secondHalfAvg > 0.5) improvementTrend = "declining";

  return {
    averageMood: Number(averageMood.toFixed(1)),
    averageEnergy: Number(averageEnergy.toFixed(1)),
    mostCommonMood,
    moodStability: Number(moodStability.toFixed(0)),
    improvementTrend,
  };
}

function detectPatterns(moodHistory: UserInsightsInput["moodHistory"]): Pattern[] {
  const patterns: Pattern[] = [];

  // Temporal patterns
  const temporalPattern = detectTemporalPatterns(moodHistory);
  if (temporalPattern) patterns.push(temporalPattern);

  // Mood cycles
  const moodCyclePattern = detectMoodCycles(moodHistory);
  if (moodCyclePattern) patterns.push(moodCyclePattern);

  // Energy patterns
  const energyPattern = detectEnergyPatterns(moodHistory);
  if (energyPattern) patterns.push(energyPattern);

  // Trigger patterns
  const triggerPattern = detectTriggerPatterns(moodHistory);
  if (triggerPattern) patterns.push(triggerPattern);

  return patterns;
}

function detectTemporalPatterns(moodHistory: UserInsightsInput["moodHistory"]): Pattern | null {
  // Group by day of week
  const dayOfWeekMoods: Record<string, number[]> = {
    Sun: [],
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
  };

  moodHistory.forEach((entry) => {
    const date = new Date(entry.date);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    dayOfWeekMoods[dayName].push(entry.moodScore);
  });

  // Find days with significantly lower mood
  const dayAverages: Record<string, number> = {};
  for (const [day, scores] of Object.entries(dayOfWeekMoods)) {
    if (scores.length > 0) {
      dayAverages[day] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  }

  const avgMood = Object.values(dayAverages).reduce((sum, avg) => sum + avg, 0) / Object.values(dayAverages).length;

  const lowDays = Object.entries(dayAverages)
    .filter(([_, avg]) => avg < avgMood - 1)
    .map(([day]) => day);

  if (lowDays.length > 0) {
    return {
      type: "temporal",
      description: `Your mood tends to be lower on ${lowDays.join(", ")}`,
      frequency: (lowDays.length / 7) * 100,
      confidence: 75,
      recommendation: `Plan self-care activities or lighter schedules on ${lowDays.join(", ")} to support yourself`,
    };
  }

  return null;
}

function detectMoodCycles(moodHistory: UserInsightsInput["moodHistory"]): Pattern | null {
  if (moodHistory.length < 7) return null;

  // Check for mood swings (high variance in consecutive days)
  let swingCount = 0;
  for (let i = 1; i < moodHistory.length; i++) {
    const diff = Math.abs(moodHistory[i].moodScore - moodHistory[i - 1].moodScore);
    if (diff >= 3) swingCount++;
  }

  const swingFrequency = (swingCount / (moodHistory.length - 1)) * 100;

  if (swingFrequency > 30) {
    return {
      type: "mood",
      description: "You experience frequent mood fluctuations",
      frequency: swingFrequency,
      confidence: 80,
      recommendation:
        "Consider establishing daily routines and stability practices like regular sleep schedules and meditation",
    };
  }

  // Check for extended low periods
  let lowPeriods = 0;
  let consecutiveLow = 0;

  for (const entry of moodHistory) {
    if (entry.moodScore <= 4) {
      consecutiveLow++;
      if (consecutiveLow >= 3) lowPeriods++;
    } else {
      consecutiveLow = 0;
    }
  }

  if (lowPeriods > 0) {
    return {
      type: "mood",
      description: "You've experienced extended periods of low mood",
      frequency: (lowPeriods / moodHistory.length) * 100,
      confidence: 85,
      recommendation:
        "Consider reaching out to a mental health professional for additional support during these periods",
    };
  }

  return null;
}

function detectEnergyPatterns(moodHistory: UserInsightsInput["moodHistory"]): Pattern | null {
  const avgEnergy =
    moodHistory.reduce((sum, entry) => sum + entry.energyLevel, 0) / moodHistory.length;

  if (avgEnergy < 4) {
    return {
      type: "energy",
      description: "Your energy levels have been consistently low",
      frequency: 100,
      confidence: 90,
      recommendation:
        "Focus on sleep quality, nutrition, hydration, and consider checking in with a doctor about persistent fatigue",
    };
  }

  // Check for energy-mood correlation
  let correlationCount = 0;
  for (const entry of moodHistory) {
    if (Math.abs(entry.energyLevel - entry.moodScore) <= 2) {
      correlationCount++;
    }
  }

  const correlation = (correlationCount / moodHistory.length) * 100;

  if (correlation > 70) {
    return {
      type: "energy",
      description: "Your mood closely tracks your energy levels",
      frequency: correlation,
      confidence: 85,
      recommendation:
        "Focus on energy management: regular exercise, consistent sleep, and balanced nutrition will help improve mood",
    };
  }

  return null;
}

function detectTriggerPatterns(moodHistory: UserInsightsInput["moodHistory"]): Pattern | null {
  const triggerCounts: Record<string, { count: number; avgMoodChange: number }> = {};

  moodHistory.forEach((entry, index) => {
    if (entry.triggers && entry.triggers.length > 0) {
      entry.triggers.forEach((trigger) => {
        if (!triggerCounts[trigger]) {
          triggerCounts[trigger] = { count: 0, avgMoodChange: 0 };
        }
        triggerCounts[trigger].count++;

        // Calculate mood change if possible
        if (index > 0) {
          const moodChange = entry.moodScore - moodHistory[index - 1].moodScore;
          triggerCounts[trigger].avgMoodChange += moodChange;
        }
      });
    }
  });

  // Find most impactful trigger
  let mostImpactfulTrigger: string | null = null;
  let maxImpact = 0;

  for (const [trigger, data] of Object.entries(triggerCounts)) {
    if (data.count >= 2) {
      const avgChange = Math.abs(data.avgMoodChange / data.count);
      if (avgChange > maxImpact) {
        maxImpact = avgChange;
        mostImpactfulTrigger = trigger;
      }
    }
  }

  if (mostImpactfulTrigger && maxImpact > 1) {
    const triggerData = triggerCounts[mostImpactfulTrigger];
    return {
      type: "trigger",
      description: `"${mostImpactfulTrigger}" appears as a recurring trigger`,
      frequency: (triggerData.count / moodHistory.length) * 100,
      confidence: 80,
      recommendation: `Develop coping strategies specifically for ${mostImpactfulTrigger}-related stress`,
    };
  }

  return null;
}

function analyzeTriggers(moodHistory: UserInsightsInput["moodHistory"]) {
  const triggerStats: Record<
    string,
    { count: number; totalMoodScore: number; avgMood: number }
  > = {};

  moodHistory.forEach((entry) => {
    if (entry.triggers) {
      entry.triggers.forEach((trigger) => {
        if (!triggerStats[trigger]) {
          triggerStats[trigger] = { count: 0, totalMoodScore: 0, avgMood: 0 };
        }
        triggerStats[trigger].count++;
        triggerStats[trigger].totalMoodScore += entry.moodScore;
      });
    }
  });

  // Calculate averages and determine impact
  const triggers = Object.entries(triggerStats)
    .map(([trigger, stats]) => {
      const avgMood = stats.totalMoodScore / stats.count;
      const frequency = (stats.count / moodHistory.length) * 100;

      let impact: "positive" | "negative" | "neutral" = "neutral";
      if (avgMood >= 7) impact = "positive";
      else if (avgMood <= 4) impact = "negative";

      return {
        trigger,
        frequency: Number(frequency.toFixed(1)),
        impact,
      };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return triggers;
}

function generateRecommendations(
  summary: ReturnType<typeof calculateSummary>,
  patterns: Pattern[],
  triggers: ReturnType<typeof analyzeTriggers>
): string[] {
  const recommendations: string[] = [];

  // Trend-based recommendations
  if (summary.improvementTrend === "declining") {
    recommendations.push(
      "Your mood has been declining recently. Consider reaching out to a mental health professional for support."
    );
    recommendations.push(
      "Increase self-care activities and ensure you're getting adequate sleep, nutrition, and social connection."
    );
  } else if (summary.improvementTrend === "improving") {
    recommendations.push(
      "Your mood is improving! Keep up the practices that are working for you."
    );
  }

  // Mood stability recommendations
  if (summary.moodStability < 50) {
    recommendations.push(
      "Your mood varies significantly. Establishing daily routines can help create more stability."
    );
  }

  // Energy recommendations
  if (summary.averageEnergy < 5) {
    recommendations.push(
      "Your energy levels are low. Prioritize sleep, regular movement, and balanced nutrition."
    );
  }

  // Pattern-based recommendations
  patterns.forEach((pattern) => {
    if (recommendations.length < 5) {
      recommendations.push(pattern.recommendation);
    }
  });

  // Trigger-based recommendations
  const negativeTriggers = triggers.filter((t) => t.impact === "negative");
  if (negativeTriggers.length > 0 && recommendations.length < 5) {
    recommendations.push(
      `Develop coping strategies for recurring stressors: ${negativeTriggers.map((t) => t.trigger).join(", ")}`
    );
  }

  return recommendations.slice(0, 5);
}

function generateInsights(
  summary: ReturnType<typeof calculateSummary>,
  patterns: Pattern[],
  triggers: ReturnType<typeof analyzeTriggers>,
  moodHistory: UserInsightsInput["moodHistory"]
): string[] {
  const insights: string[] = [];

  // Summary insights
  insights.push(
    `Over the analyzed period, your average mood was ${summary.averageMood}/10 with an average energy level of ${summary.averageEnergy}/10.`
  );

  insights.push(`Your most common emotional state has been "${summary.mostCommonMood}".`);

  if (summary.moodStability >= 70) {
    insights.push(
      "Your mood has been relatively stable, which is a positive indicator of emotional regulation."
    );
  } else if (summary.moodStability < 50) {
    insights.push(
      "Your mood fluctuates significantly, which may indicate external stressors or need for more stability practices."
    );
  }

  // Pattern insights
  if (patterns.length > 0) {
    insights.push(
      `Key pattern identified: ${patterns[0].description.toLowerCase()}`
    );
  }

  // Trigger insights
  if (triggers.length > 0) {
    const topTrigger = triggers[0];
    insights.push(
      `Your most frequent trigger is "${topTrigger.trigger}" (${topTrigger.frequency.toFixed(0)}% of entries).`
    );
  }

  // Best and worst days
  const sortedByMood = [...moodHistory].sort((a, b) => b.moodScore - a.moodScore);
  if (sortedByMood.length >= 2) {
    const bestDay = sortedByMood[0];
    insights.push(
      `Your best day was ${new Date(bestDay.date).toLocaleDateString()} with a mood score of ${bestDay.moodScore}/10.`
    );
  }

  return insights.slice(0, 6);
}

function getEmptyInsights(): UserInsightsOutput {
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
