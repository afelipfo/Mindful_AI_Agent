import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { withRateLimit } from "@/lib/api-middleware"
import { authOptions } from "@/lib/auth"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { WellnessSnapshot } from "@/types/wellness"
import {
  DAY_LABELS,
  aggregateEnergyByEntries,
  normalizeCopingEffectiveness,
  normalizeTriggerFrequency,
} from "@/lib/analytics"

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

    const userId = session.user.id
    const adminClient = tryCreateAdminClient()
    const supabase = adminClient ?? (await createServerClient())

    const [
      { data: moodEntriesData },
      { data: wellnessGoalsData },
      { data: insightsData },
      { data: triggerFrequencyData },
      { data: copingStatsData },
      { data: energyStatsData },
    ] = await Promise.all([
      supabase
        .from("mood_entries")
        .select(
          "id, date, mood_score, energy_level, emotions, triggers, coping_strategies, entry_type, note, audio_url, photo_url, created_at",
        )
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(60),
      supabase
        .from("wellness_goals")
        .select("id, goal, target_value, current_value, unit, progress, is_active")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("ai_insights")
        .select("id, insight_type, title, description, action, is_read")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_trigger_frequency")
        .select("trigger, occurrences")
        .eq("user_id", userId),
      supabase
        .from("user_coping_effectiveness")
        .select("strategy, average_mood")
        .eq("user_id", userId),
      supabase
        .from("user_energy_by_hour")
        .select("entry_hour, entry_date, avg_energy")
        .eq("user_id", userId),
    ])

    const mappedMoodEntries =
      moodEntriesData?.map((entry) => ({
        id: entry.id ?? randomUUID(),
        date: entry.date ?? new Date().toISOString().slice(0, 10),
        mood: entry.mood_score ?? 5,
        energy: entry.energy_level ?? 5,
        emotions: Array.isArray(entry.emotions) ? entry.emotions : [],
        triggers: Array.isArray(entry.triggers) ? entry.triggers : [],
        coping: Array.isArray(entry.coping_strategies) ? entry.coping_strategies : [],
        type:
          entry.entry_type === "voice" || entry.entry_type === "emoji" || entry.entry_type === "photo"
            ? entry.entry_type
            : "text",
        note: entry.note ?? undefined,
        audioUrl: entry.audio_url ?? undefined,
        photoUrl: entry.photo_url ?? undefined,
        createdAt: entry.created_at ?? undefined,
      })) ?? []

    const triggerFrequencyFromView: Record<string, number> =
      triggerFrequencyData?.reduce<Record<string, number>>((acc, row) => {
        if (!row || typeof row.trigger !== "string") {
          return acc
        }
        acc[row.trigger] = Number(row.occurrences ?? 0)
        return acc
      }, {}) ?? {}

    const fallbackTriggerFrequency = normalizeTriggerFrequency(mappedMoodEntries)

    const triggerFrequency = Object.keys(triggerFrequencyFromView).length
      ? triggerFrequencyFromView
      : fallbackTriggerFrequency

    const copingEffectivenessFromView: Record<string, number> =
      copingStatsData?.reduce<Record<string, number>>((acc, row) => {
        if (!row || typeof row.strategy !== "string") {
          return acc
        }
        const value = Number(row.average_mood ?? 0)
        if (!Number.isNaN(value)) {
          acc[row.strategy] = value
        }
        return acc
      }, {}) ?? {}

    const fallbackCopingEffectiveness = normalizeCopingEffectiveness(mappedMoodEntries)

    const copingEffectiveness = Object.keys(copingEffectivenessFromView).length
      ? copingEffectivenessFromView
      : fallbackCopingEffectiveness

    const energyBucketAccumulator = new Map<
      string,
      { day: string; hour: number; total: number; count: number }
    >()

    energyStatsData?.forEach((row) => {
      if (!row) return
      const entryDate = typeof row.entry_date === "string" ? row.entry_date : null
      const energy = Number(row.avg_energy ?? 0)
      const hourValue = typeof row.entry_hour === "number" ? row.entry_hour : Number(row.entry_hour)
      if (!entryDate || Number.isNaN(energy) || Number.isNaN(hourValue)) return

      const parsedDate = new Date(`${entryDate}T00:00:00Z`)
      if (Number.isNaN(parsedDate.getTime())) return
      const day = DAY_LABELS[parsedDate.getUTCDay()]
      let representativeHour = 20
      if (hourValue >= 5 && hourValue <= 11) {
        representativeHour = 8
      } else if (hourValue >= 12 && hourValue <= 17) {
        representativeHour = 14
      }

      const key = `${day}-${representativeHour}`
      const existing = energyBucketAccumulator.get(key) ?? { day, hour: representativeHour, total: 0, count: 0 }
      existing.total += energy
      existing.count += 1
      energyBucketAccumulator.set(key, existing)
    })

    let energyBuckets = Array.from(energyBucketAccumulator.values()).map((bucket) => ({
      day: bucket.day,
      hour: bucket.hour,
      energy: Number((bucket.total / Math.max(bucket.count, 1)).toFixed(1)),
    }))

    if (energyBuckets.length === 0 && mappedMoodEntries.length > 0) {
      energyBuckets = aggregateEnergyByEntries(mappedMoodEntries)
    }

    const mappedGoals =
      wellnessGoalsData?.map((goal) => ({
        id: goal.id ?? randomUUID(),
        goal: goal.goal,
        target: Number(goal.target_value ?? 0),
        current: Number(goal.current_value ?? 0),
        unit: goal.unit ?? "",
        progress: Number(goal.progress ?? 0),
      })) ?? []

    const mappedInsights =
      insightsData?.map((insight) => ({
        id: insight.id ?? randomUUID(),
        type:
          insight.insight_type === "alert" || insight.insight_type === "pattern"
            ? insight.insight_type
            : "recommendation",
        title: insight.title ?? "Insight",
        description: insight.description ?? "",
        action: insight.action ?? undefined,
        isRead: Boolean(insight.is_read),
      })) ?? []

    const response: WellnessSnapshot = {
      moodEntries: mappedMoodEntries,
      triggerFrequency,
      copingEffectiveness,
      wellnessGoals: mappedGoals,
      aiInsights: mappedInsights,
      energyBuckets,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[mindful-ai] Error fetching wellness snapshot:", error)
    return NextResponse.json({ error: "Failed to fetch wellness snapshot" }, { status: 500 })
  }
}
