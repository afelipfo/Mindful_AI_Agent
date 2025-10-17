import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ZodError } from "zod"

import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { onboardingRequestSchema } from "@/lib/validations/onboarding"

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

    const payload = onboardingRequestSchema.parse(await request.json())

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    const responses = payload.responses
      ?.filter((item) => item.response.trim().length > 0)
      .map((item) => ({
        step: item.step,
        stepTitle: item.stepTitle,
        response: item.response,
        metadata: item.metadata ?? null,
      })) ?? []

    const sanitizedEmotions = (payload.moodEntry.emotions ?? []).map((value) => value.trim()).filter(Boolean)
    const sanitizedTriggers = (payload.moodEntry.triggers ?? []).map((value) => value.trim()).filter(Boolean)
    const sanitizedCoping = (payload.moodEntry.coping ?? []).map((value) => value.trim()).filter(Boolean)

    const { data, error } = await supabase.rpc("process_onboarding_check_in", {
      p_user_id: session.user.id,
      p_responses: responses.length > 0 ? responses : null,
      p_mood_entry: {
        ...payload.moodEntry,
        emotions: sanitizedEmotions,
        triggers: sanitizedTriggers,
        coping: sanitizedCoping,
      },
      p_summary: payload.summary ?? null,
    })

    if (error) {
      console.error("[mindful-ai] onboarding check-in RPC error:", error)
      return NextResponse.json({ error: "Failed to save onboarding check-in" }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", session.user.id)

    if (profileError) {
      console.error("[mindful-ai] onboarding profile update error:", profileError)
    }

    return NextResponse.json(
      {
        success: true,
        moodEntryId: data ?? null,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid onboarding payload",
          details: error.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] onboarding check-in handler error:", error)
    return NextResponse.json({ error: "Failed to save onboarding check-in" }, { status: 500 })
  }
}
