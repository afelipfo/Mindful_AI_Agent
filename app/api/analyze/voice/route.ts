import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { withRateLimit } from "@/lib/api-middleware"
import { inferMoodFromText } from "@/lib/empathy-agent"

export const runtime = "nodejs"

const requestSchema = z.object({
  audioUrl: z.string().url(),
})

interface VoiceAnalysis {
  transcript: string
  moodLabel: string
  moodScore: number
  energyLevel: number
  emotions: string[]
  summary: string
}

async function transcribeAudio(url: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const audioResponse = await fetch(url)
  if (!audioResponse.ok) {
    throw new Error("Failed to retrieve audio file")
  }

  const arrayBuffer = await audioResponse.arrayBuffer()
  const contentType = audioResponse.headers.get("content-type") ?? "audio/wav"
  const blob = new Blob([arrayBuffer], { type: contentType })
  const file = new File([blob], "voice-note.wav", { type: contentType })

  const formData = new FormData()
  formData.append("model", "gpt-4o-mini-transcribe")
  formData.append("file", file)

  const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!transcriptionResponse.ok) {
    const errorBody = await transcriptionResponse.json().catch(() => ({}))
    throw new Error(errorBody.error?.message || "OpenAI transcription failed")
  }

  const transcriptionData = await transcriptionResponse.json()
  const transcript = transcriptionData.text

  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcription returned no text")
  }

  return transcript.trim()
}

async function classifyTranscript(transcript: string): Promise<VoiceAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const classificationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            "You analyze a short wellbeing voice note and return JSON with fields: moodLabel (anxious, happy, sad, tired, stressed, excited), moodScore (1-10), energyLevel (1-10), emotions (array of up to 5 lowercase descriptors), summary (<=120 characters, empathetic tone).",
        },
        {
          role: "user",
          content: `Here is the transcript of the voice check-in:\n"""${transcript}"""`,
        },
      ],
    }),
  })

  if (!classificationResponse.ok) {
    const inference = inferMoodFromText(transcript)
    return {
      transcript,
      moodLabel: inference.mood,
      moodScore: inference.score,
      energyLevel: 5,
      emotions: inference.emotions,
      summary: "Voice note captured and ready for review.",
    }
  }

  const payload = await classificationResponse.json()
  let parsed: Partial<VoiceAnalysis> = {}
  try {
    parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}")
  } catch {
    parsed = {}
  }

  const fallback = inferMoodFromText(transcript)

  return {
    transcript,
    moodLabel: typeof parsed.moodLabel === "string" ? parsed.moodLabel : fallback.mood,
    moodScore:
      typeof parsed.moodScore === "number" && !Number.isNaN(parsed.moodScore) ? parsed.moodScore : fallback.score,
    energyLevel:
      typeof parsed.energyLevel === "number" && !Number.isNaN(parsed.energyLevel) ? parsed.energyLevel : 5,
    emotions: Array.isArray(parsed.emotions) ? parsed.emotions : fallback.emotions,
    summary: typeof parsed.summary === "string" ? parsed.summary : "Voice note captured and ready for review.",
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = requestSchema.parse(await request.json())
    const transcript = await transcribeAudio(body.audioUrl)
    const analysis = await classifyTranscript(transcript)

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

    console.error("[mindful-ai] Voice analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze voice recording" }, { status: 500 })
  }
}
