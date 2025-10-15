import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { withRateLimit } from "@/lib/api-middleware"
import { inferMoodFromText } from "@/lib/empathy-agent"

export const runtime = "nodejs"

const requestSchema = z.object({
  imageUrl: z.string().url(),
})

interface ImageAnalysis {
  moodLabel: string
  confidence: number
  emotions: string[]
  summary: string
}

const allowedMoods = new Set(["anxious", "happy", "sad", "tired", "stressed", "excited"])

const moodAliasMap: Record<string, string> = {
  nervous: "anxious",
  worried: "anxious",
  uneasy: "anxious",
  overwhelmed: "anxious",
  tense: "anxious",
  calm: "happy",
  relaxed: "happy",
  neutral: "tired",
  peaceful: "happy",
  content: "happy",
  joyful: "happy",
  smiling: "happy",
  delighted: "happy",
  serene: "happy",
  gloomy: "sad",
  melancholic: "sad",
  blue: "sad",
  downcast: "sad",
  exhausted: "tired",
  sleepy: "tired",
  drained: "tired",
  fatigued: "tired",
  burnedout: "tired",
  angry: "stressed",
  frustrated: "stressed",
  irritated: "stressed",
  pressured: "stressed",
  hyped: "excited",
  energized: "excited",
  thrilled: "excited",
  excited: "excited",
  playful: "excited",
  bored: "tired",
}

function normalizeMoodLabel(rawLabel: unknown, context?: string): string {
  if (typeof rawLabel === "string") {
    const lowered = rawLabel.toLowerCase().trim()
    if (allowedMoods.has(lowered)) {
      return lowered
    }

    const aliasKey = lowered.replace(/[\s-]/g, "")
    if (moodAliasMap[aliasKey]) {
      return moodAliasMap[aliasKey]
    }
  }

  if (typeof context === "string" && context.trim().length > 0) {
    const inference = inferMoodFromText(context)
    return inference.mood
  }

  return "tired"
}

function normalizeEmotions(emotions: unknown): string[] {
  if (!Array.isArray(emotions)) {
    return []
  }
  const cleaned = emotions
    .map((emotion) => (typeof emotion === "string" ? emotion.toLowerCase().trim() : null))
    .filter((emotion): emotion is string => !!emotion && emotion.length > 0)
  return Array.from(new Set(cleaned)).slice(0, 6)
}

async function analyzeImage(url: string): Promise<ImageAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze a user's selfie or mood snapshot. Always output strict JSON with keys: moodLabel (choose exactly from anxious, happy, sad, tired, stressed, excited), confidence (0-100 number), emotions (array of <=5 lowercase descriptors), summary (<= 120 characters, compassionate tone). Focus on emotional cues from facial expression, posture, and lighting. Avoid appearance commentary. If unsure, select tired as the closest calm baseline.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Assess the emotional tone in this image." },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error?.message || "OpenAI vision analysis failed")
  }

  const payload = await response.json()
  let parsed: Partial<ImageAnalysis> = {}
  try {
    parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}")
  } catch {
    parsed = {}
  }

  const normalizedLabel = normalizeMoodLabel(parsed.moodLabel, parsed.summary)
  const normalizedEmotions = normalizeEmotions(parsed.emotions)
  const summaryText =
    typeof parsed.summary === "string"
      ? parsed.summary
      : "Image captured. We'll consider it alongside your reflections."

  return {
    moodLabel: normalizedLabel,
    confidence:
      typeof parsed.confidence === "number" && !Number.isNaN(parsed.confidence)
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 55,
    emotions: normalizedEmotions,
    summary: summaryText,
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = requestSchema.parse(await request.json())
    const analysis = await analyzeImage(body.imageUrl)

    return NextResponse.json(analysis)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] Image analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
