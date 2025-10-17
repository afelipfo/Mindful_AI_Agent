import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { getServerSession } from "next-auth"

import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

const updateSchema = z
  .object({
    goal: z.string().trim().min(3).max(120).optional(),
    targetValue: z.number().positive().optional(),
    currentValue: z.number().min(0).optional(),
    unit: z.string().trim().min(1).max(32).optional(),
    progress: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

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
    const payload = updateSchema.parse(await request.json())

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    const updates: Record<string, unknown> = {}
    if (typeof payload.goal === "string") {
      updates.goal = payload.goal
    }
    if (typeof payload.targetValue === "number") {
      updates.target_value = payload.targetValue
    }
    if (typeof payload.currentValue === "number") {
      updates.current_value = payload.currentValue
    }
    if (typeof payload.unit === "string") {
      updates.unit = payload.unit
    }
    if (typeof payload.progress === "number") {
      updates.progress = Math.round(payload.progress)
    }
    if (typeof payload.isActive === "boolean") {
      updates.is_active = payload.isActive
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase
      .from("wellness_goals")
      .update(updates)
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
          error: "Invalid goal update data",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] Failed to update wellness goal", error)
    return NextResponse.json({ error: "Failed to update wellness goal" }, { status: 500 })
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
      .from("wellness_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[mindful-ai] Failed to delete wellness goal", error)
    return NextResponse.json({ error: "Failed to delete wellness goal" }, { status: 500 })
  }
}
