import { z } from "zod";
export declare const MoodAnalysisInputSchema: z.ZodObject<{
    text: z.ZodString;
    emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    moodScore: z.ZodOptional<z.ZodNumber>;
    energyLevel: z.ZodOptional<z.ZodNumber>;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    emotions?: string[] | undefined;
    moodScore?: number | undefined;
    energyLevel?: number | undefined;
    context?: string | undefined;
}, {
    text: string;
    emotions?: string[] | undefined;
    moodScore?: number | undefined;
    energyLevel?: number | undefined;
    context?: string | undefined;
}>;
export type MoodAnalysisInput = z.infer<typeof MoodAnalysisInputSchema>;
export declare const MoodAnalysisOutputSchema: z.ZodObject<{
    detectedMood: z.ZodEnum<["anxious", "happy", "sad", "tired", "stressed", "excited"]>;
    confidence: z.ZodNumber;
    emotions: z.ZodArray<z.ZodString, "many">;
    triggers: z.ZodArray<z.ZodString, "many">;
    severity: z.ZodEnum<["low", "moderate", "high"]>;
    analysis: z.ZodString;
    recommendations: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    emotions: string[];
    detectedMood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
    confidence: number;
    triggers: string[];
    severity: "low" | "moderate" | "high";
    analysis: string;
    recommendations: string[];
}, {
    emotions: string[];
    detectedMood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
    confidence: number;
    triggers: string[];
    severity: "low" | "moderate" | "high";
    analysis: string;
    recommendations: string[];
}>;
export type MoodAnalysisOutput = z.infer<typeof MoodAnalysisOutputSchema>;
/**
 * Analyzes text to detect mood and emotional state
 */
export declare function analyzeMood(input: MoodAnalysisInput): Promise<MoodAnalysisOutput>;
//# sourceMappingURL=mood-analysis.d.ts.map