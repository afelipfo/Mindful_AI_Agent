import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { withRateLimit } from "@/lib/api-middleware"

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
            "You analyze a user's selfie or mood snapshot. Return JSON with fields: moodLabel (anxious, happy, sad, tired, stressed, excited, neutral), confidence (0-100), emotions (array of up to 4 descriptors), summary (<= 120 characters, compassionate tone). Focus on emotional cues, not appearance judgments.",
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

  const normalizedLabel =
    typeof parsed.moodLabel === "string" ? parsed.moodLabel.toLowerCase() : "neutral"

  return {
    moodLabel: normalizedLabel,
    confidence:
      typeof parsed.confidence === "number" && !Number.isNaN(parsed.confidence)
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 55,
    emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Image captured. We'll consider it alongside your reflections.",
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
