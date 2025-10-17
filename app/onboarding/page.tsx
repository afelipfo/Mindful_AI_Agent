"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { ProgressSidebar } from "@/components/onboarding/progress-sidebar"
import { ConversationInterface } from "@/components/onboarding/conversation-interface"
import { OnboardingResults } from "@/components/onboarding/onboarding-results"
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow"
import { useToast } from "@/components/ui/use-toast"
import { getEmptyWellnessSnapshot } from "@/lib/wellness-data"
import { aggregateEnergyByEntries } from "@/lib/analytics"
import type { ConversationMessage, MessageMetadata, MessageType } from "@/types/conversation"
import type { EmpathyResponse } from "@/lib/empathy-agent"
import type { AIInsight, MoodEntry, WellnessGoal, WellnessSnapshot } from "@/types/wellness"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const onboardingQuestions = [
  {
    question:
      "Hi, I'm Mindful—your companion here. Could you walk me through what a typical day feels like for you right now?",
    placeholder: "Tell me about the flow of a usual day...",
  },
  {
    question:
      "Thanks for painting that picture. Checking in at this moment, how would you rate your mood and energy from 1-10? Feel free to mention any physical sensations you notice.",
    placeholder: "Share how your mood and energy feel today...",
  },
  {
    question:
      "Appreciate the reflection. Are there people, places, or situations that reliably lift you up—or weigh you down?",
    placeholder: "Let me know what tends to raise or lower your mood...",
  },
  {
    question:
      "That insight helps a lot. When you need to reset or steady yourself, what habits, practices, or support systems do you lean on?",
    placeholder: "Describe the strategies that help you cope...",
  },
  {
    question:
      "You're doing great. What personal wellness goals feel most important to you at the moment?",
    placeholder: "Share the goals you want to focus on...",
  },
  {
    question:
      "Last step! What types of support usually resonate with you—guided practices, movement, journaling, quiet time, something else?",
    placeholder: "Tell me what kinds of support feel good for you...",
  },
]

const stepTitles = [
  "Personal Context",
  "Current Mood",
  "Triggers",
  "Coping Mechanisms",
  "Wellness Goals",
  "Preferences",
]

const WINDOW_DAYS = 7

export type TrendData = {
  direction: "up" | "down"
  value: string
  isPositive: boolean
}

const computeAverage = (entries: MoodEntry[], key: "mood" | "energy") => {
  if (!entries.length) return 0
  const total = entries.reduce((sum, entry) => sum + entry[key], 0)
  return total / entries.length
}

const buildTrend = (diff: number | null, decimals = 1): TrendData | undefined => {
  if (diff === null) return undefined
  if (!Number.isFinite(diff)) return undefined
  const rounded = Number(diff.toFixed(decimals))
  if (rounded === 0) {
    return {
      direction: "up",
      value: rounded.toFixed(decimals),
      isPositive: true,
    }
  }
  const isPositive = rounded > 0
  return {
    direction: isPositive ? "up" : "down",
    value: `${isPositive ? "+" : ""}${rounded.toFixed(decimals)}`,
    isPositive,
  }
}

const computeStreak = (entries: MoodEntry[]) => {
  if (!entries.length) return 0
  const uniqueDates = Array.from(
    new Set(
      entries
        .map((entry) => entry.date)
        .filter((date): date is string => Boolean(date)),
    ),
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (!uniqueDates.length) return 0

  let streak = 1
  for (let index = 1; index < uniqueDates.length; index++) {
    const previousDate = new Date(uniqueDates[index - 1])
    const currentDate = new Date(uniqueDates[index])
    const diffDays = Math.round((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

const computeEnergyHeatmapData = (entries: MoodEntry[]) => aggregateEnergyByEntries(entries)

interface EmpathyRequestPayload {
  context: string
  emotions: string[]
  triggers: string[]
  recentMoods: number[]
  mood?: string
  moodScore?: number
  energyLevel?: number
  voiceInsights?: {
    transcript: string
    moodLabel?: string
    moodScore?: number
    energyLevel?: number
    emotions?: string[]
    summary?: string
  }
  imageInsights?: {
    moodLabel?: string
    confidence?: number
    emotions?: string[]
    summary?: string
  }
}

const buildEmpathyPayload = (
  conversation: ConversationMessage[],
  latestMetadata?: MessageMetadata,
): EmpathyRequestPayload => {
  console.log("[mindful-ai] Building empathy payload from conversation:", conversation.length, "messages")

  const userMessages = conversation.filter((msg) => msg.role === "user")
  console.log("[mindful-ai] User messages found:", userMessages.length)

  const textualNarrative = userMessages
    .filter((msg) => msg.type !== "emoji")
    .map((msg) => msg.content)
    .join("\n")
  const trimmedNarrative = textualNarrative.slice(-1000)

  console.log("[mindful-ai] Textual narrative length:", textualNarrative.length)

  const emojiMessages = userMessages.filter(
    (msg) => msg.type === "emoji" && msg.metadata && typeof msg.metadata.label === "string",
  )

  const emotionLabels = emojiMessages
    .map((msg) => msg.metadata?.label as string | undefined)
    .filter((label): label is string => Boolean(label))

  const emotionSet = new Set(emotionLabels.map((label) => label.toLowerCase()))

  const moodValues = emojiMessages
    .map((msg) => (typeof msg.metadata?.value === "number" ? msg.metadata.value : null))
    .filter((value): value is number => value !== null)

  // Ensure we ALWAYS have a valid context - critical for empathy generation!
  let finalContext = trimmedNarrative || conversation[conversation.length - 1]?.content || ""

  if (!finalContext && emotionLabels.length) {
    finalContext = `Recent mood tags: ${emotionLabels.join(", ")}`
  }

  if (!finalContext) {
    finalContext = "User completed onboarding questionnaire"
  }

  console.log("[mindful-ai] Final context:", finalContext.substring(0, 100) + "...")

  const payload: EmpathyRequestPayload = {
    context: finalContext,
    emotions: Array.from(emotionSet),
    triggers: [],
    recentMoods: moodValues,
  }

  const moodLabel =
    (typeof latestMetadata?.label === "string" && latestMetadata.label) || emotionLabels[emotionLabels.length - 1]

  if (moodLabel) {
    payload.mood = moodLabel
  }

  if (typeof latestMetadata?.value === "number") {
    payload.moodScore = latestMetadata.value
  }

  if (typeof latestMetadata?.energy === "number") {
    payload.energyLevel = latestMetadata.energy
  }

  const voiceMessage = [...conversation]
    .reverse()
    .find((msg) => msg.type === "voice" && msg.metadata && typeof msg.metadata.transcript === "string")

  if (voiceMessage?.metadata?.transcript) {
    const voiceEmotions = Array.isArray(voiceMessage.metadata.emotions) ? voiceMessage.metadata.emotions : []
    voiceEmotions.forEach((emotion) => emotionSet.add(emotion.toLowerCase()))

    payload.voiceInsights = {
      transcript: voiceMessage.metadata.transcript,
      moodLabel: typeof voiceMessage.metadata.label === "string" ? voiceMessage.metadata.label : undefined,
      moodScore:
        typeof voiceMessage.metadata.value === "number" && !Number.isNaN(voiceMessage.metadata.value)
          ? voiceMessage.metadata.value
          : undefined,
      energyLevel:
        typeof voiceMessage.metadata.energy === "number" && !Number.isNaN(voiceMessage.metadata.energy)
          ? voiceMessage.metadata.energy
          : undefined,
      emotions: voiceEmotions,
      summary: typeof voiceMessage.metadata.summary === "string" ? voiceMessage.metadata.summary : undefined,
    }

    payload.context = `${payload.context}\nVoice note: ${voiceMessage.metadata.transcript}`

    if (payload.voiceInsights.moodScore && !payload.moodScore) {
      payload.moodScore = payload.voiceInsights.moodScore
    }
    if (payload.voiceInsights.energyLevel && !payload.energyLevel) {
      payload.energyLevel = payload.voiceInsights.energyLevel
    }
    if (!payload.mood && payload.voiceInsights.moodLabel) {
      payload.mood = payload.voiceInsights.moodLabel
    }
  }

  const imageMessage = [...conversation]
    .reverse()
    .find((msg) => msg.type === "photo" && msg.metadata && (msg.metadata.summary || msg.metadata.label))

  if (imageMessage?.metadata) {
    const imageEmotions = Array.isArray(imageMessage.metadata.emotions) ? imageMessage.metadata.emotions : []
    imageEmotions.forEach((emotion) => emotionSet.add(emotion.toLowerCase()))

    if (typeof imageMessage.metadata.label === "string") {
      emotionSet.add(imageMessage.metadata.label.toLowerCase())
    }

    payload.imageInsights = {
      moodLabel: typeof imageMessage.metadata.label === "string" ? imageMessage.metadata.label : undefined,
      confidence:
        typeof imageMessage.metadata.confidence === "number" && !Number.isNaN(imageMessage.metadata.confidence)
          ? imageMessage.metadata.confidence
          : undefined,
      emotions: imageEmotions,
      summary: typeof imageMessage.metadata.summary === "string" ? imageMessage.metadata.summary : undefined,
    }

    if (payload.imageInsights.summary) {
      payload.context = `${payload.context}\nImage insight: ${payload.imageInsights.summary}`
    }

    if (!payload.mood && payload.imageInsights.moodLabel) {
      payload.mood = payload.imageInsights.moodLabel
    }
  }

  payload.emotions = Array.from(emotionSet)

  return payload
}

const computeWellbeingScore = (entries: MoodEntry[]) => {
  if (!entries.length) return 0
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (entries.reduce((sum, entry) => sum + entry.mood + entry.energy, 0) / (entries.length * 20)) * 100,
      ),
    ),
  )
}

async function requestEmpathyRecommendations(payload: EmpathyRequestPayload): Promise<EmpathyResponse> {
  const response = await fetch("/api/empathy-recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || "Failed to fetch empathy recommendations")
  }

  return response.json()
}

export default function OnboardingPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("empathy")
  const [empathyData, setEmpathyData] = useState<EmpathyResponse | null>(null)
  const [snapshot, setSnapshot] = useState<WellnessSnapshot>(getEmptyWellnessSnapshot())
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false)

  const loadSnapshot = useCallback(async () => {
    try {
      setIsSnapshotLoading(true)
      const response = await fetch("/api/wellness-snapshot", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to fetch wellness snapshot")
      }
      const data = (await response.json()) as WellnessSnapshot
      setSnapshot(data)
    } catch (error) {
      console.error("[mindful-ai] Failed to load wellness snapshot:", error)
      setSnapshot((prev) => (prev.moodEntries.length ? prev : getEmptyWellnessSnapshot()))
    } finally {
      setIsSnapshotLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent("/onboarding")
      router.replace(`/auth/signin?callbackUrl=${callbackUrl}`)
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      loadSnapshot()
    }
  }, [status, loadSnapshot])

  const markInsightAsRead = useCallback(
    async (insightId: string) => {
      try {
        const response = await fetch(`/api/ai-insights/${insightId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update insight")
        }

        setSnapshot((prev) => ({
          ...prev,
          aiInsights: prev.aiInsights.map((insight) =>
            insight.id === insightId ? { ...insight, isRead: true } : insight,
          ),
        }))

        toast({
          title: "Insight saved",
          description: "We'll remember that you've reviewed this insight.",
        })
      } catch (error) {
        console.error("[mindful-ai] Failed to mark insight read", error)
        toast({
          title: "Unable to update insight",
          description: "Please try again in a moment.",
        })
      }
    },
    [toast],
  )

  const handleDismissInsight = useCallback(
    async (insight: AIInsight) => {
      if (!insight.id || insight.isRead) return
      await markInsightAsRead(insight.id)
    },
    [markInsightAsRead],
  )

  const persistCheckIn = useCallback(
    async (
      conversation: ConversationMessage[],
      payload: EmpathyRequestPayload,
      empathy: EmpathyResponse,
      responsesByStep: Record<number, ConversationMessage>,
      latestUserMessage?: ConversationMessage,
    ) => {
      try {
        const entryType = latestUserMessage?.type ?? "text"
        const audioUrl = latestUserMessage?.metadata?.audioUrl
        const photoUrl = latestUserMessage?.metadata?.photoUrl
        const truncatedNote = payload.context.slice(-1000)

        const responses = stepTitles
          .map((title, index) => {
            const responseMessage = responsesByStep[index]
            if (!responseMessage || !responseMessage.content.trim()) {
              return null
            }
            return {
              step: index + 1,
              stepTitle: title,
              response: responseMessage.content,
              metadata: responseMessage.metadata,
            }
          })
          .filter((response): response is NonNullable<typeof response> => Boolean(response))

        const requestBody = {
          responses,
          moodEntry: {
            moodScore: clamp(typeof payload.moodScore === "number" ? payload.moodScore : 5, 1, 10),
            energyLevel: clamp(typeof payload.energyLevel === "number" ? payload.energyLevel : 5, 1, 10),
            emotions: payload.emotions,
            triggers: payload.triggers,
            coping: [],
            entryType,
            note: truncatedNote,
            audioUrl,
            photoUrl,
            date: new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString(),
          },
          summary: {
            analysisSummary: empathy.analysisSummary,
            confidence: empathy.confidence,
            detectedMood: empathy.detectedMood,
          },
        }

        const response = await fetch("/api/onboarding/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(errorBody.error || "Failed to save onboarding responses")
        }

        await loadSnapshot()
      } catch (error) {
        console.error("[mindful-ai] Failed to persist onboarding data:", error)
      }
    },
    [loadSnapshot],
  )

  const handleFlowComplete = useCallback(
    async ({
      conversation,
      responsesByStep,
      latestUserMessage,
    }: {
      conversation: ConversationMessage[]
      responsesByStep: Record<number, ConversationMessage>
      latestUserMessage: ConversationMessage | undefined
    }) => {
      console.log("[mindful-ai] handleFlowComplete: Starting...")
      console.log("[mindful-ai] Conversation:", conversation)
      console.log("[mindful-ai] ResponsesByStep:", responsesByStep)

      const payload = buildEmpathyPayload(conversation, latestUserMessage?.metadata)
      console.log("[mindful-ai] Empathy payload built:", JSON.stringify(payload, null, 2))

      // ALWAYS generate empathy data - this is critical!
      try {
        console.log("[mindful-ai] Fetching empathy recommendations...")
        const empathy = await requestEmpathyRecommendations(payload)
        console.log("[mindful-ai] Empathy response received:", empathy)

        if (!empathy) {
          console.error("[mindful-ai] ❌ Empathy response is null!")
          throw new Error("Empathy response is null")
        }

        setEmpathyData(empathy)
        setActiveTab("empathy")
        console.log("[mindful-ai] ✅ Empathy data set successfully!")

        if (empathy.warnings?.length) {
          toast({
            title: "Using fallback insights",
            description: empathy.warnings[0],
          })
        }

        // Try to persist, but don't fail if it errors
        try {
          console.log("[mindful-ai] Persisting check-in data...")
          await persistCheckIn(conversation, payload, empathy, responsesByStep, latestUserMessage)
          console.log("[mindful-ai] ✅ Data persisted successfully")
        } catch (persistError) {
          console.error("[mindful-ai] ⚠️ Failed to persist data:", persistError)
          // Continue anyway - empathy data is already set
        }

        toast({
          title: "Onboarding complete!",
          description: "Your wellness plan has been created. Review your personalized insights below.",
        })
      } catch (error) {
        console.error("[mindful-ai] ❌ CRITICAL ERROR generating empathy:", error)

        toast({
          title: "Error generating recommendations",
          description: error instanceof Error ? error.message : "Please try refreshing the page.",
          variant: "destructive",
        })
      }
    },
    [persistCheckIn, toast],
  )

  const {
    flowState,
    currentStepIndex,
    messages,
    steps,
    isProcessing,
    currentQuestion,
    handleUserMessage,
  } = useOnboardingFlow({
    questions: onboardingQuestions,
    stepTitles,
    onComplete: handleFlowComplete,
  })

  const isCompleted = flowState === "completed"

  const sortedMoodEntries = useMemo(
    () =>
      [...(snapshot.moodEntries ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [snapshot.moodEntries],
  )

  const currentWindow = sortedMoodEntries.slice(0, WINDOW_DAYS)
  const previousWindow = sortedMoodEntries.slice(WINDOW_DAYS, WINDOW_DAYS * 2)

  const averageMoodCurrent = computeAverage(currentWindow, "mood")
  const averageEnergyCurrent = computeAverage(currentWindow, "energy")
  const averageMoodPrevious = previousWindow.length ? computeAverage(previousWindow, "mood") : 0
  const averageEnergyPrevious = previousWindow.length ? computeAverage(previousWindow, "energy") : 0

  const moodTrend = buildTrend(previousWindow.length ? averageMoodCurrent - averageMoodPrevious : null)
  const energyTrend = buildTrend(previousWindow.length ? averageEnergyCurrent - averageEnergyPrevious : null)
  const checkInTrend = buildTrend(previousWindow.length ? currentWindow.length - previousWindow.length : null, 0)

  const hasMoodData = currentWindow.length > 0
  const averageMoodDisplay = hasMoodData ? `${averageMoodCurrent.toFixed(1)}/10` : "—"
  const averageEnergyDisplay = hasMoodData ? `${averageEnergyCurrent.toFixed(1)}/10` : "—"
  const checkInsCurrent = currentWindow.length
  const wellbeingScore = hasMoodData ? computeWellbeingScore(currentWindow) : 0

  const streakDays = computeStreak(sortedMoodEntries)
  const streakDisplay = streakDays > 0 ? `${streakDays} ${streakDays === 1 ? "day" : "days"}` : "No streak yet"

  const energyHeatmapData = useMemo(() => {
    if (snapshot.energyBuckets && snapshot.energyBuckets.length > 0) {
      return snapshot.energyBuckets
    }
    return computeEnergyHeatmapData(sortedMoodEntries)
  }, [snapshot.energyBuckets, sortedMoodEntries])

  const hasEnergyData = energyHeatmapData.length > 0

  const patterns = useMemo(() => snapshot.aiInsights.filter((i) => i.type === "pattern"), [snapshot.aiInsights])
  const recommendations = useMemo(
    () => snapshot.aiInsights.filter((i) => i.type === "recommendation"),
    [snapshot.aiInsights],
  )
  const alerts = useMemo(() => snapshot.aiInsights.filter((i) => i.type === "alert"), [snapshot.aiInsights])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-muted">Preparing your onboarding experience…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="border-b border-border p-4 md:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {!isCompleted && <ProgressSidebar currentStep={currentStepIndex + 1} steps={steps} />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="hidden border-b border-border p-4 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {isCompleted ? (
            <OnboardingResults
              activeTab={activeTab}
              onTabChange={setActiveTab}
              empathyData={empathyData}
              snapshotLoading={isSnapshotLoading}
              metrics={{
                averageMoodDisplay,
                averageEnergyDisplay,
                checkInsCurrent,
                streakDisplay,
                moodTrend,
                energyTrend,
                checkInTrend,
                wellbeingScore,
              }}
              hasMoodData={hasMoodData}
              sortedMoodEntries={sortedMoodEntries}
              energyHeatmapData={energyHeatmapData}
              hasEnergyData={hasEnergyData}
              triggerFrequency={snapshot.triggerFrequency}
              copingEffectiveness={snapshot.copingEffectiveness}
              wellnessGoals={snapshot.wellnessGoals as WellnessGoal[]}
              onRefreshSnapshot={loadSnapshot}
              moodEntryHistory={sortedMoodEntries}
              aiInsights={snapshot.aiInsights}
              patterns={patterns}
              recommendations={recommendations}
              alerts={alerts}
              onDismissInsight={handleDismissInsight}
            />
          ) : (
            <ConversationInterface
              messages={messages}
              onSendMessage={(message: string, type?: MessageType, metadata?: MessageMetadata) =>
                handleUserMessage(message, type, metadata)
              }
              placeholder={currentQuestion?.placeholder || "Type your response..."}
              isLoading={isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  )
}
