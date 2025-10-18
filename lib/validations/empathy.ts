import { z } from 'zod'

export const empathyRecommendationSchema = z.object({
  mood: z.string().min(1).max(50).optional(),
  context: z.string().max(2000).optional(),
  moodScore: z.number().min(1).max(10).optional(),
  emotions: z.array(z.string().max(50)).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  triggers: z.array(z.string().max(100)).max(20).optional(),
  recentMoods: z.array(z.number().min(1).max(10)).max(30).optional(),
  voiceInsights: z
    .object({
      transcript: z.string().max(2000),
      moodLabel: z.string().max(50).optional(),
      moodScore: z.number().min(1).max(10).optional(),
      energyLevel: z.number().min(1).max(10).optional(),
      emotions: z.array(z.string().max(50)).max(10).optional(),
      summary: z.string().max(500).optional(),
    })
    .optional(),
  imageInsights: z
    .object({
      moodLabel: z.string().max(50).optional(),
      confidence: z.number().min(0).max(100).optional(),
      emotions: z.array(z.string().max(50)).max(10).optional(),
      summary: z.string().max(500).optional(),
    })
    .optional(),
  // Therapeutic questionnaire data
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
      duration: z.string().max(200).optional(),
      type: z.string().max(200).optional(),
    })
    .optional(),
  therapeuticRelationshipImportance: z.number().min(1).max(5).optional(),
  patientReadiness: z.number().min(1).max(5).optional(),
  presentingProblem: z.string().max(1000).optional(),
})

export type EmpathyRecommendationInput = z.infer<typeof empathyRecommendationSchema>
