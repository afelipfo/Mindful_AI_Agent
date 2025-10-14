import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { withRateLimit } from "@/lib/api-middleware"
import { inferMoodFromText } from "@/lib/empathy-agent"

export const runtime = "nodejs"

const requestSchema = z.object({
  text: z.string().min(1).max(4000),
})

interface TextAnalysis {
  moodLabel: string
  moodScore: number
  energyLevel: number
  emotions: string[]
  summary: string
  confidence: number
}

const MOOD_LABELS = ["anxious", "happy", "sad", "tired", "stressed", "excited"] as const

async function classifyText(text: string): Promise<TextAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const trimmed = text.trim()

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
            "You analyze how someone is feeling from a short text reflection. Return JSON with fields: moodLabel (one of anxious, happy, sad, tired, stressed, excited), moodScore (1-10), energyLevel (1-10), emotions (array of up to 5 lowercase descriptors), summary (<=120 characters, empathetic tone), confidence (0-100).",
        },
        {
          role: "user",
          content: `Reflect on this text and classify the emotional state:\n"""${trimmed}"""`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error("OpenAI text analysis failed")
  }

  const payload = await response.json()
  const raw = payload.choices?.[0]?.message?.content ?? "{}"

  let parsed: Partial<TextAnalysis> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }

  const fallback = inferMoodFromText(trimmed)

  const normalizedLabel = typeof parsed.moodLabel === "string" ? parsed.moodLabel.toLowerCase() : ""
  const moodLabel = MOOD_LABELS.includes(normalizedLabel as (typeof MOOD_LABELS)[number])
    ? normalizedLabel
    : fallback.mood

  return {
    moodLabel,
    moodScore:
      typeof parsed.moodScore === "number" && !Number.isNaN(parsed.moodScore) ? parsed.moodScore : fallback.score,
    energyLevel:
      typeof parsed.energyLevel === "number" && !Number.isNaN(parsed.energyLevel) ? parsed.energyLevel : 5,
    emotions: Array.isArray(parsed.emotions) ? parsed.emotions.map((emotion: string) => emotion.toLowerCase()) : fallback.emotions,
    summary:
      typeof parsed.summary === "string" && parsed.summary.length > 0
        ? parsed.summary
        : "We captured your reflection and will tailor recommendations accordingly.",
    confidence:
      typeof parsed.confidence === "number" && !Number.isNaN(parsed.confidence)
        ? Math.max(40, Math.min(100, Math.round(parsed.confidence)))
        : 60,
  }
}

function buildFallback(text: string): TextAnalysis {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return {
      moodLabel: "tired",
      moodScore: 5,
      energyLevel: 5,
      emotions: [],
      summary: "You shared a quick update. We'll keep checking in as you add more detail.",
      confidence: 50,
    }
  }

  const inference = inferMoodFromText(trimmed)
  return {
    moodLabel: inference.mood,
    moodScore: inference.score,
    energyLevel: 5,
    emotions: inference.emotions,
    summary: "Captured your note and added it to your check-in history.",
    confidence: 55,
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { text } = requestSchema.parse(await request.json())

    if (text.trim().length < 3) {
      return NextResponse.json(buildFallback(text))
    }

    try {
      const analysis = await classifyText(text)
      return NextResponse.json(analysis)
    } catch (error) {
      console.error("[mindful-ai] Primary text analysis failed, using fallback:", error)
      return NextResponse.json(buildFallback(text))
    }
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

    console.error("[mindful-ai] Text analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze text" }, { status: 500 })
  }
}
