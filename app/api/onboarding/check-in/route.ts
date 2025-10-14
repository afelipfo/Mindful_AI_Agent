import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { getServerSession } from "next-auth"
import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

const metadataSchema = z
  .object({
    emoji: z.string().optional(),
    label: z.string().optional(),
    note: z.string().optional(),
    value: z.number().optional(),
    audioUrl: z.string().url().optional(),
    photoUrl: z.string().url().optional(),
    energy: z.number().optional(),
  })
  .catchall(z.unknown())

const responseSchema = z.object({
  step: z.number().int().min(1),
  stepTitle: z.string().min(1),
  response: z.string(),
  metadata: metadataSchema.optional(),
})

const moodEntrySchema = z.object({
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  emotions: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  coping: z.array(z.string()).default([]),
  entryType: z.enum(["text", "voice", "emoji", "photo", "unknown"]).default("text"),
  note: z.string().optional(),
  audioUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
})

const summarySchema = z
  .object({
    analysisSummary: z.string().optional(),
    confidence: z.number().min(0).max(100).optional(),
    detectedMood: z.string().optional(),
  })
  .optional()

const payloadSchema = z.object({
  responses: z.array(responseSchema).default([]),
  moodEntry: moodEntrySchema,
  summary: summarySchema,
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const payload = payloadSchema.parse(await request.json())

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = createAdminClient()

    const filteredResponses = payload.responses.filter((response) => response.response.trim().length > 0)

    if (filteredResponses.length > 0) {
      const { error: responsesError } = await supabase.from("onboarding_responses").insert(
        filteredResponses.map((response) => ({
          user_id: userId,
          step: response.step,
          step_title: response.stepTitle,
          response: response.response,
          metadata: response.metadata ?? null,
        })),
      )

      if (responsesError) {
        throw responsesError
      }
    }

    const {
      moodScore,
      energyLevel,
      emotions,
      triggers,
      coping,
      entryType,
      note,
      audioUrl,
      photoUrl,
    } = payload.moodEntry

    const { error: moodError } = await supabase.from("mood_entries").insert({
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      mood_score: Math.round(moodScore),
      energy_level: Math.round(energyLevel),
      emotions,
      triggers,
      coping_strategies: coping,
      entry_type: entryType === "voice" || entryType === "emoji" || entryType === "photo" ? entryType : "text",
      note: note ?? null,
      audio_url: audioUrl ?? null,
      photo_url: photoUrl ?? null,
    })

    if (moodError) {
      throw moodError
    }

    if (payload.summary?.analysisSummary) {
      await supabase.from("ai_insights").insert({
        user_id: userId,
        insight_type: "recommendation",
        title: `Mood insight${payload.summary.detectedMood ? `: ${payload.summary.detectedMood}` : ""}`,
        description: payload.summary.analysisSummary,
        action: "Review recommendations",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] Error saving onboarding check-in:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
