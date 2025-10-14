import { type NextRequest, NextResponse } from "next/server"
import { generateEmpathyRecommendations, detectMoodCategory } from "@/lib/empathy-agent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mood, context, moodScore, emotions, energyLevel, triggers, recentMoods } = body

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
    console.error("[v0] Error in empathy recommendations API:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
