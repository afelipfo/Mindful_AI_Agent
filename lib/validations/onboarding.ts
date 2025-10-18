import { z } from "zod"

export const onboardingMetadataSchema = z
  .object({
    emoji: z.string().optional(),
    label: z.string().optional(),
    note: z.string().optional(),
    value: z.number().optional(),
    audioUrl: z.string().url().optional(),
    photoUrl: z.string().url().optional(),
    energy: z.number().optional(),
    // New fields for therapeutic questionnaire
    symptomRatings: z
      .object({
        anxiety: z.number().min(0).max(5).optional(),
        sadness: z.number().min(0).max(5).optional(),
        stress: z.number().min(0).max(5).optional(),
        loneliness: z.number().min(0).max(5).optional(),
        suicideTrends: z.number().min(0).max(5).optional(),
      })
      .optional(),
    therapyHistory: z
      .object({
        hasPreviousTherapy: z.boolean().optional(),
        duration: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
    likertScore: z.number().min(1).max(5).optional(), // For questions 4 & 5
  })
  .catchall(z.unknown())

export const onboardingResponseSchema = z.object({
  step: z.number().int().min(1),
  stepTitle: z.string().trim().min(1),
  response: z.string().trim().min(1),
  metadata: onboardingMetadataSchema.optional(),
})

export const onboardingMoodEntrySchema = z.object({
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  emotions: z.array(z.string().trim()).default([]),
  triggers: z.array(z.string().trim()).default([]),
  coping: z.array(z.string().trim()).default([]),
  entryType: z.enum(["text", "voice", "emoji", "photo"]).default("text"),
  note: z.string().max(1000).optional(),
  audioUrl: z.string().url().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  date: z.string().optional(),
  timestamp: z.string().optional(),
  // New therapeutic data fields
  symptomRatings: z
    .object({
      anxiety: z.number().min(0).max(5).optional(),
      sadness: z.number().min(0).max(5).optional(),
      stress: z.number().min(0).max(5).optional(),
      loneliness: z.number().min(0).max(5).optional(),
      suicideTrends: z.number().min(0).max(5).optional(),
    })
    .optional(),
  therapyHistory: z
    .object({
      hasPreviousTherapy: z.boolean().optional(),
      duration: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
  therapeuticRelationshipImportance: z.number().min(1).max(5).optional(),
  patientReadiness: z.number().min(1).max(5).optional(),
})

export const onboardingSummarySchema = z
  .object({
    analysisSummary: z.string().trim().max(2000).optional(),
    confidence: z.number().min(0).max(100).optional(),
    detectedMood: z.string().trim().max(100).optional(),
  })
  .optional()

export const onboardingRequestSchema = z.object({
  responses: z.array(onboardingResponseSchema).optional(),
  moodEntry: onboardingMoodEntrySchema,
  summary: onboardingSummarySchema,
})
