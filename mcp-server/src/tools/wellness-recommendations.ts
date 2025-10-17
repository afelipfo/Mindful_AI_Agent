import { z } from "zod";

// Schema for wellness recommendations input
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

// Schema for wellness recommendation output
export const WellnessRecommendationSchema = z.object({
  type: z.enum(["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]),
  title: z.string(),
  description: z.string(),
  duration: z.number().describe("Duration in minutes"),
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  benefits: z.array(z.string()),
  instructions: z.array(z.string()),
});

export const WellnessRecommendationsOutputSchema = z.object({
  immediate: z.array(WellnessRecommendationSchema),
  shortTerm: z.array(WellnessRecommendationSchema),
  longTerm: z.array(WellnessRecommendationSchema),
});

export type WellnessRecommendation = z.infer<typeof WellnessRecommendationSchema>;
export type WellnessRecommendationsOutput = z.infer<typeof WellnessRecommendationsOutputSchema>;

/**
 * Generates personalized wellness recommendations based on user's current state
 */
export async function generateWellnessRecommendations(
  input: WellnessRecommendationsInput
): Promise<WellnessRecommendationsOutput> {
  const timeAvailable = input.preferences?.timeAvailable || 30;
  const activityLevel = input.preferences?.activityLevel || "moderate";
  const environment = input.preferences?.environment || "any";

  // Generate immediate actions (0-5 minutes)
  const immediate = generateImmediateRecommendations(input, timeAvailable, activityLevel);

  // Generate short-term actions (5-30 minutes)
  const shortTerm = generateShortTermRecommendations(input, timeAvailable, activityLevel, environment);

  // Generate long-term practices (ongoing)
  const longTerm = generateLongTermRecommendations(input, activityLevel);

  return {
    immediate: immediate.slice(0, 2),
    shortTerm: shortTerm.slice(0, 3),
    longTerm: longTerm.slice(0, 2),
  };
}

function generateImmediateRecommendations(
  input: WellnessRecommendationsInput,
  timeAvailable: number,
  activityLevel: string
): WellnessRecommendation[] {
  const recommendations: WellnessRecommendation[] = [];

  if (input.mood === "anxious") {
    recommendations.push({
      type: "breathing",
      title: "Box Breathing Technique",
      description: "A quick breathing exercise to calm your nervous system immediately",
      duration: 3,
      difficulty: "easy",
      benefits: ["Reduces anxiety", "Lowers heart rate", "Clears mind"],
      instructions: [
        "Inhale through your nose for 4 counts",
        "Hold your breath for 4 counts",
        "Exhale through your mouth for 4 counts",
        "Hold empty lungs for 4 counts",
        "Repeat 4 times",
      ],
    });

    recommendations.push({
      type: "grounding",
      title: "5-4-3-2-1 Grounding Exercise",
      description: "Use your senses to anchor yourself in the present moment",
      duration: 5,
      difficulty: "easy",
      benefits: ["Reduces anxiety", "Increases present-moment awareness", "Stops panic spirals"],
      instructions: [
        "Name 5 things you can see around you",
        "Name 4 things you can touch",
        "Name 3 things you can hear",
        "Name 2 things you can smell",
        "Name 1 thing you can taste",
      ],
    });
  }

  if (input.mood === "stressed") {
    recommendations.push({
      type: "breathing",
      title: "4-7-8 Relaxation Breath",
      description: "Activates your body's relaxation response",
      duration: 4,
      difficulty: "easy",
      benefits: ["Reduces stress hormones", "Promotes relaxation", "Improves focus"],
      instructions: [
        "Exhale completely through your mouth",
        "Inhale quietly through your nose for 4 counts",
        "Hold your breath for 7 counts",
        "Exhale forcefully through your mouth for 8 counts",
        "Repeat 3-4 times",
      ],
    });

    recommendations.push({
      type: "rest",
      title: "Micro-Break Reset",
      description: "Quick mental reset to break stress cycle",
      duration: 2,
      difficulty: "easy",
      benefits: ["Breaks stress cycle", "Refreshes mind", "Improves productivity"],
      instructions: [
        "Close your eyes",
        "Take three deep breaths",
        "Roll your shoulders back",
        "Stretch your neck gently",
        "Open your eyes and refocus",
      ],
    });
  }

  if (input.mood === "sad") {
    recommendations.push({
      type: "social",
      title: "Reach Out to Someone",
      description: "Connect with a trusted friend or family member",
      duration: 5,
      difficulty: "easy",
      benefits: ["Reduces isolation", "Provides emotional support", "Improves mood"],
      instructions: [
        "Choose someone you trust",
        "Send a text or make a call",
        "Share how you're feeling (if comfortable)",
        "Or simply have a friendly chat",
      ],
    });
  }

  if (input.mood === "tired") {
    recommendations.push({
      type: "rest",
      title: "Power Posture Break",
      description: "Quick postural reset to boost energy",
      duration: 3,
      difficulty: "easy",
      benefits: ["Increases energy", "Improves circulation", "Reduces fatigue"],
      instructions: [
        "Stand up and stretch your arms overhead",
        "Take 5 deep breaths",
        "Do 10 shoulder rolls (5 forward, 5 back)",
        "Shake out your hands and feet",
        "Splash cold water on your face if possible",
      ],
    });
  }

  return recommendations;
}

function generateShortTermRecommendations(
  input: WellnessRecommendationsInput,
  timeAvailable: number,
  activityLevel: string,
  environment: string
): WellnessRecommendation[] {
  const recommendations: WellnessRecommendation[] = [];

  if (input.mood === "anxious" || input.mood === "stressed") {
    recommendations.push({
      type: "meditation",
      title: "Guided Body Scan Meditation",
      description: "Progressive relaxation through body awareness",
      duration: 15,
      difficulty: "easy",
      benefits: ["Releases physical tension", "Calms mind", "Improves body awareness"],
      instructions: [
        "Find a comfortable seated or lying position",
        "Close your eyes and take deep breaths",
        "Systematically focus on each body part from toes to head",
        "Notice sensations without judgment",
        "Release tension as you exhale",
      ],
    });

    if (activityLevel !== "low" && environment !== "work") {
      recommendations.push({
        type: "exercise",
        title: "Gentle Walk in Nature",
        description: "Light physical activity with mindful awareness",
        duration: 20,
        difficulty: "easy",
        benefits: ["Reduces cortisol", "Improves mood", "Provides fresh perspective"],
        instructions: [
          "Put on comfortable shoes",
          "Find a park or quiet street",
          "Walk at a comfortable pace",
          "Focus on your breath and surroundings",
          "Notice nature elements around you",
        ],
      });
    }
  }

  if (input.mood === "sad") {
    recommendations.push({
      type: "creative",
      title: "Expressive Journaling",
      description: "Write freely about your thoughts and feelings",
      duration: 15,
      difficulty: "easy",
      benefits: ["Emotional release", "Clarity", "Self-understanding"],
      instructions: [
        "Find a quiet space with paper or digital device",
        "Set a timer for 15 minutes",
        "Write continuously without editing",
        "Express whatever comes to mind",
        "Don't worry about grammar or structure",
      ],
    });

    recommendations.push({
      type: "social",
      title: "Meaningful Connection",
      description: "Have a genuine conversation with someone supportive",
      duration: 20,
      difficulty: "moderate",
      benefits: ["Reduces loneliness", "Provides support", "Improves perspective"],
      instructions: [
        "Call a trusted friend or family member",
        "Share authentically if you feel safe",
        "Practice active listening",
        "Allow yourself to be vulnerable",
        "Express gratitude for their time",
      ],
    });
  }

  if (input.mood === "tired") {
    if (timeAvailable >= 20) {
      recommendations.push({
        type: "rest",
        title: "Power Nap",
        description: "Brief sleep to restore energy and alertness",
        duration: 20,
        difficulty: "easy",
        benefits: ["Restores energy", "Improves cognition", "Enhances mood"],
        instructions: [
          "Find a quiet, dark space",
          "Set alarm for exactly 20 minutes",
          "Lie down in comfortable position",
          "Close eyes and relax body",
          "Don't worry if you don't fully sleep",
        ],
      });
    }

    recommendations.push({
      type: "nutrition",
      title: "Energizing Snack Break",
      description: "Nourish your body with healthy fuel",
      duration: 10,
      difficulty: "easy",
      benefits: ["Stabilizes blood sugar", "Increases energy", "Improves focus"],
      instructions: [
        "Choose protein and complex carbs",
        "Options: nuts, fruit, yogurt, whole grain",
        "Drink a full glass of water",
        "Eat mindfully and slowly",
        "Avoid high-sugar options",
      ],
    });
  }

  if (input.mood === "excited" || input.mood === "happy") {
    recommendations.push({
      type: "creative",
      title: "Gratitude Practice",
      description: "Capture and amplify positive moments",
      duration: 10,
      difficulty: "easy",
      benefits: ["Enhances happiness", "Builds resilience", "Creates positive memories"],
      instructions: [
        "Write down 3-5 things you're grateful for today",
        "Be specific about why each matters",
        "Notice how your body feels as you write",
        "Take a photo of something beautiful",
        "Share gratitude with someone who helped you",
      ],
    });

    if (activityLevel === "high") {
      recommendations.push({
        type: "exercise",
        title: "Energetic Movement",
        description: "Channel positive energy into physical activity",
        duration: 25,
        difficulty: "moderate",
        benefits: ["Amplifies positive energy", "Releases endorphins", "Improves fitness"],
        instructions: [
          "Choose an activity you enjoy",
          "Options: dancing, jogging, sports, cycling",
          "Move at an intensity that feels good",
          "Focus on the joy of movement",
          "Cool down with gentle stretching",
        ],
      });
    }
  }

  return recommendations;
}

function generateLongTermRecommendations(
  input: WellnessRecommendationsInput,
  activityLevel: string
): WellnessRecommendation[] {
  const recommendations: WellnessRecommendation[] = [];

  // Universal recommendations
  recommendations.push({
    type: "meditation",
    title: "Daily Mindfulness Practice",
    description: "Build a consistent meditation habit",
    duration: 10,
    difficulty: "moderate",
    benefits: [
      "Reduces baseline anxiety",
      "Improves emotional regulation",
      "Enhances self-awareness",
      "Builds resilience",
    ],
    instructions: [
      "Choose same time each day (morning ideal)",
      "Start with 5-10 minutes",
      "Use a meditation app if helpful",
      "Focus on breath or body sensations",
      "Be patient and consistent",
    ],
  });

  if (input.mood === "anxious" || input.mood === "stressed") {
    recommendations.push({
      type: "exercise",
      title: "Regular Physical Exercise Routine",
      description: "Build sustainable exercise habit",
      duration: 30,
      difficulty: activityLevel === "high" ? "moderate" : "challenging",
      benefits: [
        "Reduces stress hormones long-term",
        "Improves sleep quality",
        "Boosts mood naturally",
        "Increases resilience",
      ],
      instructions: [
        "Aim for 3-4 sessions per week",
        "Mix cardio and strength training",
        "Choose activities you enjoy",
        "Start small and build gradually",
        "Consider joining a class or finding a workout buddy",
      ],
    });
  }

  if (input.mood === "sad") {
    recommendations.push({
      type: "social",
      title: "Build Support Network",
      description: "Cultivate meaningful relationships",
      duration: 60,
      difficulty: "challenging",
      benefits: [
        "Reduces isolation",
        "Provides emotional support",
        "Improves overall wellbeing",
        "Creates sense of belonging",
      ],
      instructions: [
        "Schedule regular check-ins with friends/family",
        "Join a support group or community",
        "Consider therapy or counseling",
        "Volunteer for causes you care about",
        "Be intentional about quality time with loved ones",
      ],
    });
  }

  recommendations.push({
    type: "rest",
    title: "Sleep Hygiene Optimization",
    description: "Establish healthy sleep patterns",
    duration: 480,
    difficulty: "moderate",
    benefits: [
      "Improves mood regulation",
      "Increases energy levels",
      "Enhances cognitive function",
      "Supports overall health",
    ],
    instructions: [
      "Maintain consistent sleep schedule",
      "Create calming bedtime routine",
      "Limit screen time before bed",
      "Keep bedroom cool and dark",
      "Avoid caffeine after 2pm",
    ],
  });

  return recommendations;
}
