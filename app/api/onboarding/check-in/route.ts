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
    const supabase = createAdminClient()
    const filteredResponses = payload.responses.filter((response) => response.response.trim().length > 0)

    console.log("[DEBUG] Saving onboarding data for user:", userId)
    console.log("[DEBUG] Filtered responses:", filteredResponses.length)
    console.log("[DEBUG] Mood entry:", {
      ...payload.moodEntry,
      entryType:
        payload.moodEntry.entryType === "voice" ||
        payload.moodEntry.entryType === "emoji" ||
        payload.moodEntry.entryType === "photo"
          ? payload.moodEntry.entryType
          : "text",
      timestamp: new Date().toISOString(),
    })

    const { error: rpcError } = await supabase.rpc("process_onboarding_check_in", {
      p_user_id: userId,
      p_responses: filteredResponses,
      p_mood_entry: {
        ...payload.moodEntry,
        entryType:
          payload.moodEntry.entryType === "voice" ||
          payload.moodEntry.entryType === "emoji" ||
          payload.moodEntry.entryType === "photo"
            ? payload.moodEntry.entryType
            : "text",
        timestamp: new Date().toISOString(),
      },
      p_summary: payload.summary ?? null,
    })

    if (rpcError) {
      console.error("[ERROR] RPC Error:", rpcError)
      throw rpcError
    }

    console.log("[SUCCESS] Onboarding data saved successfully")

    // Mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)

    if (profileError) {
      console.error("[ERROR] Failed to update onboarding status:", profileError)
      // Don't fail the request if profile update fails
    } else {
      console.log("[SUCCESS] Onboarding marked as completed for user:", userId)
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
