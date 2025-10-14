import { type NextRequest, NextResponse } from "next/server"
import {
  generateEmpathyRecommendations,
  detectMoodCategory,
  inferMoodFromText,
  type MoodCategory,
} from "@/lib/empathy-agent"
import { empathyRecommendationSchema } from "@/lib/validations/empathy"
import { ZodError } from "zod"
import { withRateLimit } from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (AI tier - 5 requests per minute)
    const rateLimitResult = await withRateLimit(request, 'ai')
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await request.json()

    // Validate input
    const validatedData = empathyRecommendationSchema.parse(body)
    const { mood, context, moodScore, emotions, energyLevel, recentMoods } = validatedData

    let detectedMood: string | undefined = typeof mood === "string" ? mood : undefined
    let score: number | undefined = typeof moodScore === "number" ? moodScore : undefined
    let emotionsList: string[] = Array.isArray(emotions) ? emotions.map((e) => e.toLowerCase()) : []

    if (!detectedMood) {
      if (typeof score === "number" && emotionsList.length > 0) {
        detectedMood = detectMoodCategory(emotionsList, score)
      } else if (typeof context === "string" && context.trim().length > 0) {
        const inference = inferMoodFromText(context)
        detectedMood = inference.mood
        score = score ?? inference.score
        if (inference.emotions.length > 0) {
          emotionsList = Array.from(new Set([...emotionsList, ...inference.emotions]))
        }
      }
    }

    if (!detectedMood) {
      return NextResponse.json({ error: "Unable to determine mood from input" }, { status: 400 })
    }

    if (typeof score !== "number") {
      if (Array.isArray(recentMoods) && recentMoods.length > 0) {
        const average = recentMoods.reduce((acc, value) => acc + value, 0) / recentMoods.length
        score = Math.round(average)
      } else {
        score = 5
      }
    }

    const sanitizedContext =
      typeof context === "string" && context.length > 0 ? context.slice(-1000) : emotionsList.join(", ")

    // Generate recommendations
    const recommendations = await generateEmpathyRecommendations({
      moodScore: score,
      detectedMood: detectedMood as MoodCategory,
      emotions: emotionsList,
      energyLevel: energyLevel || 5,
      context: sanitizedContext,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle other errors
    console.error("[v0] Error in empathy recommendations API:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
