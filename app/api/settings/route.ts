import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z, ZodError } from "zod"
import { authOptions } from "@/lib/auth"
import { tryCreateAdminClient } from "@/lib/supabase/admin"

const updateSettingsSchema = z
  .object({
    timezone: z.string().trim().max(120).optional(),
    preferredLanguage: z.string().trim().max(10).optional(),
    notifyEmail: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
    notifySms: z.boolean().optional(),
    dailyReminder: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
    reminderTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Reminder time must be in HH:MM format")
      .optional(),
    themePreference: z.enum(["light", "dark", "system"]).optional(),
    soundEnabled: z.boolean().optional(),
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
        "timezone,preferred_language,notify_email,notify_push,notify_sms,daily_reminder,weekly_summary,reminder_time,theme_preference,sound_enabled",
      )
      .eq("id", session.user.id)
      .maybeSingle()

    if (error) {
      console.error("[mindful-ai] settings fetch error:", error)
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
    }

    return NextResponse.json({
      settings: {
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
    console.error("[mindful-ai] settings route GET error:", error)
    return NextResponse.json({ error: "Unable to load settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSettingsSchema.parse(body)

    const supabase = ensureSupabaseConfigured()

    const updates: Record<string, string | boolean | null> = {}

    if (typeof parsed.timezone === "string") updates.timezone = parsed.timezone.length > 0 ? parsed.timezone : null
    if (typeof parsed.preferredLanguage === "string")
      updates.preferred_language = parsed.preferredLanguage.length > 0 ? parsed.preferredLanguage : "en"
    if (typeof parsed.notifyEmail === "boolean") updates.notify_email = parsed.notifyEmail
    if (typeof parsed.notifyPush === "boolean") updates.notify_push = parsed.notifyPush
    if (typeof parsed.notifySms === "boolean") updates.notify_sms = parsed.notifySms
    if (typeof parsed.dailyReminder === "boolean") updates.daily_reminder = parsed.dailyReminder
    if (typeof parsed.weeklySummary === "boolean") updates.weekly_summary = parsed.weeklySummary
    if (typeof parsed.reminderTime === "string") updates.reminder_time = parsed.reminderTime
    if (typeof parsed.themePreference === "string") updates.theme_preference = parsed.themePreference
    if (typeof parsed.soundEnabled === "boolean") updates.sound_enabled = parsed.soundEnabled

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", session.user.id)

    if (error) {
      console.error("[mindful-ai] settings update error:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid settings data",
          details: error.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[mindful-ai] settings route PATCH error:", error)
    return NextResponse.json({ error: "Unable to update settings" }, { status: 500 })
  }
}
