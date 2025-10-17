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
    console.log("[mindful-ai] Empathy API received body:", JSON.stringify(body, null, 2))

    // Validate input
    const validatedData = empathyRecommendationSchema.parse(body)
    const { mood, context, moodScore, emotions, energyLevel, recentMoods, voiceInsights, imageInsights } = validatedData

    const normalizedVoiceMood =
      typeof voiceInsights?.moodLabel === "string" ? voiceInsights.moodLabel.toLowerCase() : undefined
    const normalizedImageMood =
      typeof imageInsights?.moodLabel === "string" ? imageInsights.moodLabel.toLowerCase() : undefined

    let detectedMood: string | undefined = typeof mood === "string" ? mood : undefined
    let score: number | undefined = typeof moodScore === "number" ? moodScore : undefined
    let inferredEnergy: number | undefined = typeof energyLevel === "number" ? energyLevel : undefined
    let emotionsList: string[] = Array.isArray(emotions) ? emotions.map((e) => e.toLowerCase()) : []

    if (normalizedVoiceMood && !detectedMood) {
      detectedMood = normalizedVoiceMood
    }

    if (normalizedImageMood && !detectedMood) {
      detectedMood = normalizedImageMood
    }

    if (typeof voiceInsights?.moodScore === "number" && !score) {
      score = voiceInsights.moodScore
    }

    if (typeof voiceInsights?.energyLevel === "number" && !inferredEnergy) {
      inferredEnergy = voiceInsights.energyLevel
    }

    if (Array.isArray(voiceInsights?.emotions)) {
      emotionsList.push(...voiceInsights.emotions.map((emotion) => emotion.toLowerCase()))
    }

    if (Array.isArray(imageInsights?.emotions)) {
      emotionsList.push(...imageInsights.emotions.map((emotion) => emotion.toLowerCase()))
    }

    const contextSegments: string[] = []
    if (typeof context === "string" && context.trim().length > 0) {
      contextSegments.push(context.trim())
    }
    if (voiceInsights?.summary) {
      contextSegments.push(`Voice insight: ${voiceInsights.summary}`)
    } else if (voiceInsights?.transcript) {
      contextSegments.push(`Voice transcript: ${voiceInsights.transcript}`)
    }
    if (imageInsights?.summary) {
      contextSegments.push(`Image insight: ${imageInsights.summary}`)
    }

    const combinedContext = contextSegments.join("\n")
    console.log("[mindful-ai] Combined context:", combinedContext)
    console.log("[mindful-ai] Detected mood before inference:", detectedMood)
    console.log("[mindful-ai] Emotions list:", emotionsList)
    console.log("[mindful-ai] Score:", score)

    if (!detectedMood) {
      if (typeof score === "number" && emotionsList.length > 0) {
        detectedMood = detectMoodCategory(emotionsList, score)
        console.log("[mindful-ai] Detected mood from emotions+score:", detectedMood)
      } else if (combinedContext.trim().length > 0) {
        const inference = inferMoodFromText(combinedContext)
        detectedMood = inference.mood
        score = score ?? inference.score
        if (inference.emotions.length > 0) {
          emotionsList = Array.from(new Set([...emotionsList, ...inference.emotions]))
        }
        console.log("[mindful-ai] Detected mood from text inference:", detectedMood)
      }
    }

    if (!detectedMood) {
      console.error("[mindful-ai] Unable to determine mood - all detection methods failed")
      console.error("[mindful-ai] Payload received:", JSON.stringify(validatedData, null, 2))
      // Default to "tired" as a neutral mood instead of failing
      detectedMood = "tired"
      console.log("[mindful-ai] Defaulting to 'tired' mood")
    }

    if (typeof score !== "number") {
      if (Array.isArray(recentMoods) && recentMoods.length > 0) {
        const average = recentMoods.reduce((acc, value) => acc + value, 0) / recentMoods.length
        score = Math.round(average)
      } else {
        score = 5
      }
    }

    if (typeof inferredEnergy !== "number") {
      inferredEnergy = 5
    }

    const uniqueEmotions = Array.from(new Set(emotionsList.filter((emotion) => emotion.trim().length > 0)))

    const sanitizedContext = combinedContext.length > 0 ? combinedContext.slice(-2000) : uniqueEmotions.join(", ")

    // Generate recommendations
    const recommendations = await generateEmpathyRecommendations({
      moodScore: score,
      detectedMood: detectedMood as MoodCategory,
      emotions: uniqueEmotions,
      energyLevel: inferredEnergy,
      context: sanitizedContext,
      voiceTranscript: voiceInsights?.transcript,
      imageMood: imageInsights?.moodLabel,
      imageConfidence: imageInsights?.confidence,
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
