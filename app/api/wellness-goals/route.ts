import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { getServerSession } from "next-auth"
import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

const goalSchema = z.object({
  goal: z.string().min(3).max(120),
  targetValue: z.number().positive(),
  unit: z.string().min(1).max(32),
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("wellness_goals")
      .select("id, goal, target_value, current_value, unit, progress, is_active")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ goals: data ?? [] })
  } catch (error) {
    console.error("[mindful-ai] Failed to load wellness goals", error)
    return NextResponse.json({ error: "Failed to load wellness goals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const payload = goalSchema.parse(body)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("wellness_goals")
      .insert({
        user_id: session.user.id,
        goal: payload.goal,
        target_value: payload.targetValue,
        current_value: 0,
        unit: payload.unit,
        progress: 0,
        is_active: true,
      })
      .select("id")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, id: data?.id })
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

    console.error("[mindful-ai] Failed to create wellness goal", error)
    return NextResponse.json({ error: "Failed to create wellness goal" }, { status: 500 })
  }
}
