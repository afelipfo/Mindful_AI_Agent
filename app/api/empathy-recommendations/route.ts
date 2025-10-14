import { type NextRequest, NextResponse } from "next/server"
import { generateEmpathyRecommendations, detectMoodCategory } from "@/lib/empathy-agent"
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
    const { mood, context, moodScore, emotions, energyLevel } = validatedData

    let detectedMood: string
    let score: number
    let emotionsList: string[]

    // Handle different input formats
    if (mood && typeof mood === "string") {
      // Simple mood string from onboarding
      detectedMood = mood
      score = 5 // Default neutral score
      emotionsList = [mood]
    } else if (typeof moodScore === "number" && Array.isArray(emotions)) {
      // Detailed format
      detectedMood = detectMoodCategory(emotions, moodScore)
      score = moodScore
      emotionsList = emotions
    } else {
      return NextResponse.json({ error: "Invalid input format" }, { status: 400 })
    }

    // Generate recommendations
    const recommendations = await generateEmpathyRecommendations({
      moodScore: score,
      detectedMood: detectedMood as any,
      emotions: emotionsList,
      energyLevel: energyLevel || 5,
      context,
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
