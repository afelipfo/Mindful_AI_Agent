import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { tryCreateAdminClient } from "@/lib/supabase/admin"

const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(120, "Name is too long")
      .optional(),
    bio: z
      .string()
      .trim()
      .max(500, "Bio should be under 500 characters")
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .url("Avatar must be a valid URL")
      .or(z.literal(""))
      .optional(),
  })
  .strict()

function ensureSupabaseConfigured() {
  const client = tryCreateAdminClient()
  if (!client) {
    throw new Error("Supabase configuration missing")
  }
  return client
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = ensureSupabaseConfigured()
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,email,full_name,avatar_url,bio,created_at,timezone,preferred_language,notify_email,notify_push,notify_sms,daily_reminder,weekly_summary,reminder_time,theme_preference,sound_enabled",
      )
      .eq("id", session.user.id)
      .maybeSingle()

    if (error) {
      console.error("[mindful-ai] profile fetch error:", error)
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
    }

    return NextResponse.json({
      profile: {
        id: data?.id ?? session.user.id,
        email: data?.email ?? session.user.email ?? "",
        fullName: data?.full_name ?? session.user.name ?? "",
        avatarUrl: data?.avatar_url ?? null,
        bio: data?.bio ?? "",
        createdAt: data?.created_at ?? null,
        timezone: data?.timezone ?? "",
        preferredLanguage: data?.preferred_language ?? "en",
        notifyEmail: data?.notify_email ?? true,
        notifyPush: data?.notify_push ?? false,
        notifySms: data?.notify_sms ?? false,
        dailyReminder: data?.daily_reminder ?? true,
        weeklySummary: data?.weekly_summary ?? true,
        reminderTime: data?.reminder_time ?? "09:00",
        themePreference: data?.theme_preference ?? "system",
        soundEnabled: data?.sound_enabled ?? true,
      },
    })
  } catch (error) {
    console.error("[mindful-ai] profile route GET error:", error)
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.parse(body)

    const supabase = ensureSupabaseConfigured()

    const updates: Record<string, string | null> = {}
    if (typeof parsed.fullName === "string") {
      updates.full_name = parsed.fullName
    }
    if (typeof parsed.bio === "string") {
      updates.bio = parsed.bio.length > 0 ? parsed.bio : null
    }
    if (typeof parsed.avatarUrl === "string") {
      updates.avatar_url = parsed.avatarUrl.length > 0 ? parsed.avatarUrl : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", session.user.id)

    if (error) {
      console.error("[mindful-ai] profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid profile data",
          details: error.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] profile route PATCH error:", error)
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
  }
}
