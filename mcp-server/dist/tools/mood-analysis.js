import { z } from "zod";
// Schema for mood analysis input
export const MoodAnalysisInputSchema = z.object({
    text: z.string().describe("User's text input describing their feelings or situation"),
    emotions: z.array(z.string()).optional().describe("List of detected emotions"),
    moodScore: z.number().min(1).max(10).optional().describe("Mood score from 1-10"),
    energyLevel: z.number().min(1).max(10).optional().describe("Energy level from 1-10"),
    context: z.string().optional().describe("Additional context about the user's situation"),
});
// Schema for mood analysis output
export const MoodAnalysisOutputSchema = z.object({
    detectedMood: z.enum(["anxious", "happy", "sad", "tired", "stressed", "excited"]),
    confidence: z.number().min(0).max(100),
    emotions: z.array(z.string()),
    triggers: z.array(z.string()),
    severity: z.enum(["low", "moderate", "high"]),
    analysis: z.string(),
    recommendations: z.array(z.string()),
});
// Mood detection keywords
const moodKeywords = {
    anxious: ["anxious", "worried", "nervous", "uneasy", "panic", "overwhelmed", "scared", "afraid"],
    happy: ["happy", "grateful", "calm", "content", "peaceful", "joyful", "good", "great"],
    sad: ["sad", "down", "depressed", "lonely", "upset", "heartbroken", "miserable", "hopeless"],
    tired: ["tired", "exhausted", "fatigued", "drained", "sleepy", "worn out", "burned out"],
    stressed: ["stressed", "pressure", "tense", "frustrated", "irritated", "rushed", "overwhelmed"],
    excited: ["excited", "energized", "pumped", "thrilled", "motivated", "inspired", "enthusiastic"],
};
/**
 * Analyzes text to detect mood and emotional state
 */
export async function analyzeMood(input) {
    const text = input.text.toLowerCase();
    // Detect mood from keywords
    let bestMood = "tired";
    let maxMatches = 0;
    const detectedEmotions = new Set(input.emotions || []);
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
            bestMood = mood;
        }
    }
    // Detect triggers
    const triggers = [];
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
    // Calculate confidence
    let confidence = 60;
    if (maxMatches > 0)
        confidence += Math.min(20, maxMatches * 5);
    if (input.moodScore)
        confidence += 10;
    if (input.energyLevel)
        confidence += 5;
    if (input.context)
        confidence += 5;
    confidence = Math.min(95, confidence);
    // Determine severity
    let severity = "moderate";
    if (input.moodScore) {
        if (["anxious", "sad", "stressed"].includes(bestMood)) {
            if (input.moodScore <= 3)
                severity = "high";
            else if (input.moodScore <= 5)
                severity = "moderate";
            else
                severity = "low";
        }
        else {
            severity = "low";
        }
    }
    // Generate analysis
    const analysis = generateAnalysis(bestMood, Array.from(detectedEmotions), triggers, input);
    // Generate recommendations
    const recommendations = generateRecommendations(bestMood, severity, triggers);
    return {
        detectedMood: bestMood,
        confidence,
        emotions: Array.from(detectedEmotions).slice(0, 5),
        triggers,
        severity,
        analysis,
        recommendations,
    };
}
function generateAnalysis(mood, emotions, triggers, input) {
    let analysis = `Based on your input, I'm detecting a ${mood} emotional state`;
    if (input.moodScore) {
        analysis += ` with a mood score of ${input.moodScore}/10`;
    }
    if (emotions.length > 0) {
        analysis += `. Key emotions identified: ${emotions.slice(0, 3).join(", ")}`;
    }
    if (triggers.length > 0) {
        analysis += `. Main triggers appear to be related to: ${triggers.join(", ")}`;
    }
    if (input.energyLevel) {
        analysis += `. Your energy level is at ${input.energyLevel}/10`;
    }
    analysis += ".";
    return analysis;
}
function generateRecommendations(mood, severity, triggers) {
    const recommendations = [];
    // Mood-specific recommendations
    const moodRecs = {
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
    recommendations.push(...(moodRecs[mood] || moodRecs.tired).slice(0, 3));
    // High severity additional recommendations
    if (severity === "high") {
        recommendations.push("Consider reaching out to a mental health professional", "Use crisis resources if you're in immediate distress");
    }
    // Trigger-specific recommendations
    if (triggers.includes("work")) {
        recommendations.push("Set clear boundaries between work and personal time");
    }
    if (triggers.includes("sleep")) {
        recommendations.push("Establish a consistent bedtime routine");
    }
    if (triggers.includes("social")) {
        recommendations.push("Reach out to supportive friends or join a community group");
    }
    return recommendations.slice(0, 5);
}
//# sourceMappingURL=mood-analysis.js.map