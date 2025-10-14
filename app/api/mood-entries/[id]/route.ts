import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { getServerSession } from "next-auth"
import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

const updateSchema = z.object({
  moodScore: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  note: z.string().max(2000).optional().nullable(),
  emotions: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  coping: z.array(z.string()).optional(),
  date: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const payload = updateSchema.parse(body)

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    const updatePayload: Record<string, unknown> = {}
    if (typeof payload.moodScore === "number") {
      updatePayload.mood_score = Math.round(payload.moodScore)
    }
    if (typeof payload.energyLevel === "number") {
      updatePayload.energy_level = Math.round(payload.energyLevel)
    }
    if (payload.note !== undefined) {
      updatePayload.note = payload.note ? payload.note.trim() : null
    }
    if (payload.emotions) {
      updatePayload.emotions = payload.emotions.filter((item) => item.trim().length > 0)
    }
    if (payload.triggers) {
      updatePayload.triggers = payload.triggers.filter((item) => item.trim().length > 0)
    }
    if (payload.coping) {
      updatePayload.coping_strategies = payload.coping.filter((item) => item.trim().length > 0)
    }
    if (payload.date) {
      updatePayload.date = payload.date
    }

    const { error } = await supabase
      .from("mood_entries")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      throw error
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

    console.error("[mindful-ai] Failed to update mood entry", error)
    return NextResponse.json({ error: "Failed to update mood entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())
    const { error } = await supabase
      .from("mood_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[mindful-ai] Failed to delete mood entry", error)
    return NextResponse.json({ error: "Failed to delete mood entry" }, { status: 500 })
  }
}
