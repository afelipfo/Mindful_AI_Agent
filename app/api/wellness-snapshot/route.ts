import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withRateLimit } from "@/lib/api-middleware"
import type { WellnessSnapshot } from "@/types/wellness"

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const [{ data: moodEntriesData }, { data: wellnessGoalsData }, { data: insightsData }] = await Promise.all([
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
        .select("goal, target_value, current_value, unit, progress, is_active")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("ai_insights")
        .select("insight_type, title, description, action")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
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

    const triggerFrequency: Record<string, number> = {}
    mappedMoodEntries.forEach((entry) => {
      entry.triggers.forEach((trigger) => {
        const key = trigger.trim()
        if (!key) return
        triggerFrequency[key] = (triggerFrequency[key] ?? 0) + 1
      })
    })

    const copingTotals: Record<string, { sum: number; count: number }> = {}
    mappedMoodEntries.forEach((entry) => {
      if (!entry.coping || entry.coping.length === 0) return
      entry.coping.forEach((strategy) => {
        const key = strategy.trim()
        if (!key) return
        if (!copingTotals[key]) {
          copingTotals[key] = { sum: 0, count: 0 }
        }
        copingTotals[key].sum += entry.mood
        copingTotals[key].count += 1
      })
    })

    const copingEffectiveness = Object.fromEntries(
      Object.entries(copingTotals).map(([strategy, stats]) => [
        strategy,
        Number((stats.sum / Math.max(stats.count, 1)).toFixed(1)),
      ]),
    )

    const mappedGoals =
      wellnessGoalsData?.map((goal) => ({
        goal: goal.goal,
        target: Number(goal.target_value ?? 0),
        current: Number(goal.current_value ?? 0),
        unit: goal.unit ?? "",
        progress: goal.progress ?? 0,
      })) ?? []

    const mappedInsights =
      insightsData?.map((insight) => ({
        type:
          insight.insight_type === "alert" || insight.insight_type === "pattern"
            ? insight.insight_type
            : "recommendation",
        title: insight.title ?? "Insight",
        description: insight.description ?? "",
        action: insight.action ?? undefined,
      })) ?? []

    const response: WellnessSnapshot = {
      moodEntries: mappedMoodEntries,
      triggerFrequency,
      copingEffectiveness,
      wellnessGoals: mappedGoals,
      aiInsights: mappedInsights,
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
