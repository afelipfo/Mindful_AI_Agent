import { z } from "zod";
export declare const UserInsightsInputSchema: z.ZodObject<{
    userId: z.ZodString;
    moodHistory: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        mood: z.ZodEnum<["anxious", "happy", "sad", "tired", "stressed", "excited"]>;
        moodScore: z.ZodNumber;
        energyLevel: z.ZodNumber;
        triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        moodScore: number;
        energyLevel: number;
        date: string;
        mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
        emotions?: string[] | undefined;
        triggers?: string[] | undefined;
    }, {
        moodScore: number;
        energyLevel: number;
        date: string;
        mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
        emotions?: string[] | undefined;
        triggers?: string[] | undefined;
    }>, "many">;
    timeframe: z.ZodOptional<z.ZodEnum<["week", "month", "quarter", "year"]>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    moodHistory: {
        moodScore: number;
        energyLevel: number;
        date: string;
        mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
        emotions?: string[] | undefined;
        triggers?: string[] | undefined;
    }[];
    timeframe?: "week" | "month" | "quarter" | "year" | undefined;
}, {
    userId: string;
    moodHistory: {
        moodScore: number;
        energyLevel: number;
        date: string;
        mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
        emotions?: string[] | undefined;
        triggers?: string[] | undefined;
    }[];
    timeframe?: "week" | "month" | "quarter" | "year" | undefined;
}>;
export type UserInsightsInput = z.infer<typeof UserInsightsInputSchema>;
export declare const PatternSchema: z.ZodObject<{
    type: z.ZodEnum<["temporal", "trigger", "mood", "energy"]>;
    description: z.ZodString;
    frequency: z.ZodNumber;
    confidence: z.ZodNumber;
    recommendation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "mood" | "trigger" | "temporal" | "energy";
    confidence: number;
    description: string;
    frequency: number;
    recommendation: string;
}, {
    type: "mood" | "trigger" | "temporal" | "energy";
    confidence: number;
    description: string;
    frequency: number;
    recommendation: string;
}>;
export type Pattern = z.infer<typeof PatternSchema>;
export declare const UserInsightsOutputSchema: z.ZodObject<{
    summary: z.ZodObject<{
        averageMood: z.ZodNumber;
        averageEnergy: z.ZodNumber;
        mostCommonMood: z.ZodString;
        moodStability: z.ZodNumber;
        improvementTrend: z.ZodEnum<["improving", "declining", "stable"]>;
    }, "strip", z.ZodTypeAny, {
        averageMood: number;
        averageEnergy: number;
        mostCommonMood: string;
        moodStability: number;
        improvementTrend: "improving" | "declining" | "stable";
    }, {
        averageMood: number;
        averageEnergy: number;
        mostCommonMood: string;
        moodStability: number;
        improvementTrend: "improving" | "declining" | "stable";
    }>;
    patterns: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["temporal", "trigger", "mood", "energy"]>;
        description: z.ZodString;
        frequency: z.ZodNumber;
        confidence: z.ZodNumber;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "mood" | "trigger" | "temporal" | "energy";
        confidence: number;
        description: string;
        frequency: number;
        recommendation: string;
    }, {
        type: "mood" | "trigger" | "temporal" | "energy";
        confidence: number;
        description: string;
        frequency: number;
        recommendation: string;
    }>, "many">;
    triggers: z.ZodArray<z.ZodObject<{
        trigger: z.ZodString;
        frequency: z.ZodNumber;
        impact: z.ZodEnum<["positive", "negative", "neutral"]>;
    }, "strip", z.ZodTypeAny, {
        trigger: string;
        frequency: number;
        impact: "positive" | "negative" | "neutral";
    }, {
        trigger: string;
        frequency: number;
        impact: "positive" | "negative" | "neutral";
    }>, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
    insights: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    triggers: {
        trigger: string;
        frequency: number;
        impact: "positive" | "negative" | "neutral";
    }[];
    recommendations: string[];
    summary: {
        averageMood: number;
        averageEnergy: number;
        mostCommonMood: string;
        moodStability: number;
        improvementTrend: "improving" | "declining" | "stable";
    };
    patterns: {
        type: "mood" | "trigger" | "temporal" | "energy";
        confidence: number;
        description: string;
        frequency: number;
        recommendation: string;
    }[];
    insights: string[];
}, {
    triggers: {
        trigger: string;
        frequency: number;
        impact: "positive" | "negative" | "neutral";
    }[];
    recommendations: string[];
    summary: {
        averageMood: number;
        averageEnergy: number;
        mostCommonMood: string;
        moodStability: number;
        improvementTrend: "improving" | "declining" | "stable";
    };
    patterns: {
        type: "mood" | "trigger" | "temporal" | "energy";
        confidence: number;
        description: string;
        frequency: number;
        recommendation: string;
    }[];
    insights: string[];
}>;
export type UserInsightsOutput = z.infer<typeof UserInsightsOutputSchema>;
/**
 * Analyzes user's historical data to generate insights and patterns
 */
export declare function generateUserInsights(input: UserInsightsInput): Promise<UserInsightsOutput>;
//# sourceMappingURL=user-insights.d.ts.map