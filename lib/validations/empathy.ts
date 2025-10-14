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
})

export type EmpathyRecommendationInput = z.infer<typeof empathyRecommendationSchema>
