import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: insightId } = await params
    if (!insightId) {
      return NextResponse.json({ error: "Insight ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .select("id, insight_type, title, description, action, is_read, created_at")
      .eq("id", insightId)
      .eq("user_id", session.user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Insight not found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ insight: data })
  } catch (error) {
    console.error("[mindful-ai] Failed to load AI insight", error)
    return NextResponse.json({ error: "Failed to load AI insight" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: insightId } = await params
    if (!insightId) {
      return NextResponse.json({ error: "Insight ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { isRead } = body

    if (typeof isRead !== "boolean") {
      return NextResponse.json({ error: "isRead must be a boolean" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .update({ is_read: isRead })
      .eq("id", insightId)
      .eq("user_id", session.user.id)
      .select("id, is_read")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Insight not found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, insight: data })
  } catch (error) {
    console.error("[mindful-ai] Failed to update AI insight", error)
    return NextResponse.json({ error: "Failed to update AI insight" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: insightId } = await params
    if (!insightId) {
      return NextResponse.json({ error: "Insight ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("ai_insights")
      .delete()
      .eq("id", insightId)
      .eq("user_id", session.user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[mindful-ai] Failed to delete AI insight", error)
    return NextResponse.json({ error: "Failed to delete AI insight" }, { status: 500 })
  }
}
