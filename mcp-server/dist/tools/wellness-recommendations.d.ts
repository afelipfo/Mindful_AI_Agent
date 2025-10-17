import { z } from "zod";
export declare const WellnessRecommendationsInputSchema: z.ZodObject<{
    mood: z.ZodEnum<["anxious", "happy", "sad", "tired", "stressed", "excited"]>;
    moodScore: z.ZodNumber;
    energyLevel: z.ZodNumber;
    triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferences: z.ZodOptional<z.ZodObject<{
        activityLevel: z.ZodOptional<z.ZodEnum<["low", "moderate", "high"]>>;
        timeAvailable: z.ZodOptional<z.ZodNumber>;
        environment: z.ZodOptional<z.ZodEnum<["home", "work", "outdoor", "any"]>>;
    }, "strip", z.ZodTypeAny, {
        activityLevel?: "low" | "moderate" | "high" | undefined;
        timeAvailable?: number | undefined;
        environment?: "work" | "home" | "outdoor" | "any" | undefined;
    }, {
        activityLevel?: "low" | "moderate" | "high" | undefined;
        timeAvailable?: number | undefined;
        environment?: "work" | "home" | "outdoor" | "any" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    moodScore: number;
    energyLevel: number;
    mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
    triggers?: string[] | undefined;
    preferences?: {
        activityLevel?: "low" | "moderate" | "high" | undefined;
        timeAvailable?: number | undefined;
        environment?: "work" | "home" | "outdoor" | "any" | undefined;
    } | undefined;
}, {
    moodScore: number;
    energyLevel: number;
    mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
    triggers?: string[] | undefined;
    preferences?: {
        activityLevel?: "low" | "moderate" | "high" | undefined;
        timeAvailable?: number | undefined;
        environment?: "work" | "home" | "outdoor" | "any" | undefined;
    } | undefined;
}>;
export type WellnessRecommendationsInput = z.infer<typeof WellnessRecommendationsInputSchema>;
export declare const WellnessRecommendationSchema: z.ZodObject<{
    type: z.ZodEnum<["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]>;
    title: z.ZodString;
    description: z.ZodString;
    duration: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "moderate", "challenging"]>;
    benefits: z.ZodArray<z.ZodString, "many">;
    instructions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
    title: string;
    description: string;
    duration: number;
    difficulty: "moderate" | "easy" | "challenging";
    benefits: string[];
    instructions: string[];
}, {
    type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
    title: string;
    description: string;
    duration: number;
    difficulty: "moderate" | "easy" | "challenging";
    benefits: string[];
    instructions: string[];
}>;
export declare const WellnessRecommendationsOutputSchema: z.ZodObject<{
    immediate: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]>;
        title: z.ZodString;
        description: z.ZodString;
        duration: z.ZodNumber;
        difficulty: z.ZodEnum<["easy", "moderate", "challenging"]>;
        benefits: z.ZodArray<z.ZodString, "many">;
        instructions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }>, "many">;
    shortTerm: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]>;
        title: z.ZodString;
        description: z.ZodString;
        duration: z.ZodNumber;
        difficulty: z.ZodEnum<["easy", "moderate", "challenging"]>;
        benefits: z.ZodArray<z.ZodString, "many">;
        instructions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }>, "many">;
    longTerm: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["breathing", "meditation", "exercise", "social", "creative", "rest", "nutrition", "grounding"]>;
        title: z.ZodString;
        description: z.ZodString;
        duration: z.ZodNumber;
        difficulty: z.ZodEnum<["easy", "moderate", "challenging"]>;
        benefits: z.ZodArray<z.ZodString, "many">;
        instructions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }, {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    immediate: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
    shortTerm: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
    longTerm: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
}, {
    immediate: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
    shortTerm: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
    longTerm: {
        type: "social" | "breathing" | "meditation" | "exercise" | "creative" | "rest" | "nutrition" | "grounding";
        title: string;
        description: string;
        duration: number;
        difficulty: "moderate" | "easy" | "challenging";
        benefits: string[];
        instructions: string[];
    }[];
}>;
export type WellnessRecommendation = z.infer<typeof WellnessRecommendationSchema>;
export type WellnessRecommendationsOutput = z.infer<typeof WellnessRecommendationsOutputSchema>;
/**
 * Generates personalized wellness recommendations based on user's current state
 */
export declare function generateWellnessRecommendations(input: WellnessRecommendationsInput): Promise<WellnessRecommendationsOutput>;
//# sourceMappingURL=wellness-recommendations.d.ts.map