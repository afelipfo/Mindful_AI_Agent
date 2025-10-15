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
  date: z.string().optional(),
  timestamp: z.string().optional(),
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
    const filteredResponses = payload.responses.filter((response) => response.response.trim().length > 0)

    const supabase = createAdminClient()

    if (filteredResponses.length > 0) {
      const { error: responsesError } = await supabase
        .from("onboarding_responses")
        .upsert(
          filteredResponses.map((response) => ({
            user_id: userId,
            step: response.step,
            step_title: response.stepTitle,
            response: response.response,
            metadata: response.metadata ?? null,
          })),
          { onConflict: "user_id,step" },
        )

      if (responsesError) {
        throw responsesError
      }
    }

    const moodScore = Math.max(1, Math.min(10, Math.round(payload.moodEntry.moodScore)))
    const energyLevel = Math.max(1, Math.min(10, Math.round(payload.moodEntry.energyLevel)))
    const entryType =
      payload.moodEntry.entryType === "voice" ||
      payload.moodEntry.entryType === "emoji" ||
      payload.moodEntry.entryType === "photo"
        ? payload.moodEntry.entryType
        : "text"
    const moodDate = payload.moodEntry.date ?? new Date().toISOString().slice(0, 10)
    const timestamp = payload.moodEntry.timestamp ?? new Date().toISOString()

    const { error: moodError } = await supabase.from("mood_entries").insert({
      user_id: userId,
      date: moodDate,
      mood_score: moodScore,
      energy_level: energyLevel,
      emotions: payload.moodEntry.emotions ?? [],
      triggers: payload.moodEntry.triggers ?? [],
      coping_strategies: payload.moodEntry.coping ?? [],
      entry_type: entryType,
      note: payload.moodEntry.note ?? null,
      audio_url: payload.moodEntry.audioUrl ?? null,
      photo_url: payload.moodEntry.photoUrl ?? null,
      entry_timestamp: timestamp,
    })

    if (moodError) {
      throw moodError
    }

    if (payload.summary?.analysisSummary) {
      await supabase
        .from("ai_insights")
        .upsert(
          {
            user_id: userId,
            insight_type: "recommendation",
            title: `Mood insight${payload.summary.detectedMood ? `: ${payload.summary.detectedMood}` : ""}`,
            description: payload.summary.analysisSummary,
            action: "Review recommendations",
          },
          { onConflict: "user_id,description" },
        )
    }

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId)

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
