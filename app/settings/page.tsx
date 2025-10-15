import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Header } from "@/components/layout/header"
import { SettingsForm } from "@/components/settings/settings-form"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

function MissingConfiguration() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="rounded-xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-text-primary">Settings unavailable</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Supabase environment variables are missing. Add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to manage settings.
          </p>
        </div>
      </main>
    </div>
  )
}

export default async function SettingsPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return <MissingConfiguration />
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=%2Fsettings")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "timezone,preferred_language,notify_email,notify_push,notify_sms,daily_reminder,weekly_summary,reminder_time,theme_preference,sound_enabled",
    )
    .eq("id", session.user.id)
    .maybeSingle()

  if (error) {
    console.error("[mindful-ai] settings page fetch error:", error)
  }

  const initialSettings = {
    timezone: data?.timezone ?? "",
    preferredLanguage: data?.preferred_language ?? "en",
    notifyEmail: data?.notify_email ?? true,
    notifyPush: data?.notify_push ?? false,
    notifySms: data?.notify_sms ?? false,
    dailyReminder: data?.daily_reminder ?? true,
    weeklySummary: data?.weekly_summary ?? true,
    reminderTime: data?.reminder_time ?? "09:00",
    themePreference: (data?.theme_preference as "light" | "dark" | "system") ?? "system",
    soundEnabled: data?.sound_enabled ?? true,
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Personalize notifications, reminders, and how Mindful AI feels on your devices.
          </p>
        </div>
        <SettingsForm initialSettings={initialSettings} />
      </main>
    </div>
  )
}
