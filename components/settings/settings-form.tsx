"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface SettingsFormProps {
  initialSettings: {
    timezone: string
    preferredLanguage: string
    notifyEmail: boolean
    notifyPush: boolean
    notifySms: boolean
    dailyReminder: boolean
    weeklySummary: boolean
    reminderTime: string
    themePreference: "light" | "dark" | "system"
    soundEnabled: boolean
  }
}

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
]

const timezoneOptions = [
  { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "America/Sao_Paulo", label: "(UTC-03:00) São Paulo" },
  { value: "Europe/London", label: "(UTC+00:00) London" },
  { value: "Europe/Madrid", label: "(UTC+01:00) Madrid" },
  { value: "Europe/Berlin", label: "(UTC+01:00) Berlin" },
  { value: "Africa/Johannesburg", label: "(UTC+02:00) Johannesburg" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Dubai" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) India Standard Time" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney" },
]

const themeOptions: Array<{ value: "light" | "dark" | "system"; label: string }> = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { setTheme } = useTheme()

  const [formState, setFormState] = useState(initialSettings)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setTheme(initialSettings.themePreference)
  }, [initialSettings.themePreference, setTheme])

  const handleCheckboxChange = (field: keyof SettingsFormProps["initialSettings"]) => (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: checked,
    }))
  }

  const handleSelectChange =
    (field: keyof SettingsFormProps["initialSettings"]) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))

      if (field === "themePreference") {
        setTheme(event.target.value as "light" | "dark" | "system")
      }
    }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      reminderTime: event.target.value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Unable to update settings")
        }

        toast({
          title: "Settings updated",
          description: "Your preferences are saved.",
        })

        router.refresh()
      } catch (error) {
        console.error("[mindful-ai] settings update failed:", error)
        toast({
          title: "Update failed",
          description:
            error instanceof Error ? error.message : "We couldn't update your settings right now. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formState.timezone}
              onChange={handleSelectChange("timezone")}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select your timezone</option>
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Preferred language</Label>
            <select
              id="language"
              value={formState.preferredLanguage}
              onChange={handleSelectChange("preferredLanguage")}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <p className="text-xs text-text-muted">
              Choose how you want to receive updates, reminders, and mood summaries.
            </p>
          </div>
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.notifyEmail}
                onCheckedChange={(checked) => handleCheckboxChange("notifyEmail")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Email updates</p>
                <p className="text-xs text-text-muted">Receive weekly summaries and important notifications via email.</p>
              </div>
            </label>
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.notifyPush}
                onCheckedChange={(checked) => handleCheckboxChange("notifyPush")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Push notifications</p>
                <p className="text-xs text-text-muted">Get instant updates on your device when insights are ready.</p>
              </div>
            </label>
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.notifySms}
                onCheckedChange={(checked) => handleCheckboxChange("notifySms")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">SMS reminders</p>
                <p className="text-xs text-text-muted">Stay on track with gentle text reminders about check-ins.</p>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Daily rhythm</h3>
            <p className="text-xs text-text-muted">Set when and how often Mindful AI nudges you to reflect.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.dailyReminder}
                onCheckedChange={(checked) => handleCheckboxChange("dailyReminder")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Daily check-in reminder</p>
                <p className="text-xs text-text-muted">A gentle prompt to log your mood once a day.</p>
              </div>
            </label>
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Reminder time</Label>
              <Input
                type="time"
                id="reminderTime"
                value={formState.reminderTime}
                onChange={handleTimeChange}
                disabled={!formState.dailyReminder}
              />
            </div>
            <label className="flex items-start gap-3 md:col-span-2">
              <Checkbox
                checked={formState.weeklySummary}
                onCheckedChange={(checked) => handleCheckboxChange("weeklySummary")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Weekly reflection</p>
                <p className="text-xs text-text-muted">
                  Receive a curated summary of your emotional trends every Sunday evening.
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Experience</h3>
            <p className="text-xs text-text-muted">Fine-tune how the app looks and sounds to you.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={formState.themePreference}
                onChange={handleSelectChange("themePreference")}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.soundEnabled}
                onCheckedChange={(checked) => handleCheckboxChange("soundEnabled")(checked === true)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Sound cues</p>
                <p className="text-xs text-text-muted">Play soft sounds when a recommendation or insight is ready.</p>
              </div>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </form>
  )
}
