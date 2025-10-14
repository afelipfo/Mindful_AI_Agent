"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import dynamicImport from "next/dynamic"
import { ProgressSidebar } from "@/components/onboarding/progress-sidebar"
import { ConversationInterface } from "@/components/onboarding/conversation-interface"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Zap, Brain, TrendingUp, AlertTriangle } from "lucide-react"
import { getFallbackWellnessSnapshot } from "@/lib/wellness-data"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import type { ConversationMessage, MessageMetadata, MessageType } from "@/types/conversation"
import type { EmpathyResponse } from "@/lib/empathy-agent"
import type { WellnessSnapshot } from "@/lib/wellness-data"

// Dynamically import heavy components
const EmpathyRecommendations = dynamicImport(
  () => import("@/components/check-in/empathy-recommendations").then(mod => ({ default: mod.EmpathyRecommendations })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8">Loading...</div> }
)

const MetricCard = dynamicImport(
  () => import("@/components/dashboard/metric-card").then(mod => ({ default: mod.MetricCard })),
  { ssr: false }
)

const MoodTrendChart = dynamicImport(
  () => import("@/components/dashboard/mood-trend-chart").then(mod => ({ default: mod.MoodTrendChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" /> }
)

const TriggerCloud = dynamicImport(
  () => import("@/components/dashboard/trigger-cloud").then(mod => ({ default: mod.TriggerCloud })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" /> }
)

const WellbeingScore = dynamicImport(
  () => import("@/components/dashboard/wellbeing-score").then(mod => ({ default: mod.WellbeingScore })),
  { ssr: false }
)

const EnergyHeatmap = dynamicImport(
  () => import("@/components/dashboard/energy-heatmap").then(mod => ({ default: mod.EnergyHeatmap })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-muted rounded-lg" /> }
)

const InsightCard = dynamicImport(
  () => import("@/components/insights/insight-card").then(mod => ({ default: mod.InsightCard })),
  { ssr: false }
)

interface Step {
  id: number
  title: string
  status: "completed" | "active" | "upcoming"
}

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const EMPTY_SNAPSHOT: WellnessSnapshot = {
  moodEntries: [],
  triggerFrequency: {},
  copingEffectiveness: {},
  wellnessGoals: [],
  aiInsights: [],
}

const onboardingQuestions = [
  {
    question:
      "Hi there! I'm your Mindful AI companion. Let's get to know each other. Can you tell me a bit about your daily routine? What does a typical day look like for you?",
    placeholder: "Tell me about your daily routine...",
  },
  {
    question:
      "Thanks for sharing! Now, how are you feeling today? On a scale of 1-10, what's your mood and energy level? Are you experiencing any physical symptoms?",
    placeholder: "Describe your current mood and energy...",
  },
  {
    question:
      "I appreciate you opening up. What events, people, or situations tend to affect your mood the most? These could be positive or negative triggers.",
    placeholder: "Share what affects your mood...",
  },
  {
    question:
      "That's helpful to know. What strategies do you currently use to manage your emotions? This could be anything from exercise to talking with friends.",
    placeholder: "Describe your coping mechanisms...",
  },
  {
    question:
      "Great! What are your main wellness goals? Are you looking to improve sleep, reduce anxiety, manage stress, or something else?",
    placeholder: "Share your wellness goals...",
  },
  {
    question:
      "Finally, what types of support work best for you? Do you prefer meditation, exercise, journaling, or other activities?",
    placeholder: "Tell me your preferences...",
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

export default function OnboardingPage() {
  const { status } = useSession()
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [empathyData, setEmpathyData] = useState<EmpathyResponse | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState("empathy")
  const [responsesByStep, setResponsesByStep] = useState<Record<number, ConversationMessage>>({})
  const [snapshot, setSnapshot] = useState<WellnessSnapshot>(EMPTY_SNAPSHOT)
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false)
  const [steps, setSteps] = useState<Step[]>(
    stepTitles.map((title, index) => ({
      id: index + 1,
      title,
      status: index === 0 ? "active" : "upcoming",
    })),
  )

  const {
    moodEntries,
    triggerFrequency,
    copingEffectiveness,
    wellnessGoals,
    aiInsights,
  } = snapshot

  const recentEntries = moodEntries.slice(0, 7)
  const avgMood = recentEntries.length
    ? (recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length).toFixed(1)
    : "0.0"
  const avgEnergy = recentEntries.length
    ? (recentEntries.reduce((sum, entry) => sum + entry.energy, 0) / recentEntries.length).toFixed(1)
    : "0.0"
  const wellbeingScore = recentEntries.length
    ? Math.min(
        100,
        Math.max(
          30,
          Math.round(
            (recentEntries.reduce((sum, entry) => sum + entry.mood + entry.energy, 0) /
              (recentEntries.length * 20)) *
              100,
          ),
        ),
      )
    : 70

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
      setSnapshot((prev) => (prev.moodEntries.length ? prev : getFallbackWellnessSnapshot()))
    } finally {
      setIsSnapshotLoading(false)
    }
  }, [])

  const persistCheckIn = useCallback(
    async (conversation: ConversationMessage[], payload: EmpathyRequestPayload, empathy: EmpathyResponse) => {
      try {
        const latestUserMessage = [...conversation].reverse().find((msg) => msg.role === "user")
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
            entryType: entryType ?? "text",
            note: truncatedNote,
            audioUrl,
            photoUrl,
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
        setResponsesByStep({})
      } catch (error) {
        console.error("[mindful-ai] Failed to persist onboarding data:", error)
      }
    },
    [responsesByStep, loadSnapshot],
  )

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

  const energyHeatmapData = [
    { day: "Mon", hour: 8, energy: 5 },
    { day: "Mon", hour: 14, energy: 4 },
    { day: "Mon", hour: 20, energy: 6 },
    { day: "Tue", hour: 8, energy: 6 },
    { day: "Tue", hour: 14, energy: 5 },
    { day: "Tue", hour: 20, energy: 7 },
    { day: "Wed", hour: 8, energy: 7 },
    { day: "Wed", hour: 14, energy: 6 },
    { day: "Wed", hour: 20, energy: 8 },
    { day: "Thu", hour: 8, energy: 6 },
    { day: "Thu", hour: 14, energy: 5 },
    { day: "Thu", hour: 20, energy: 7 },
    { day: "Fri", hour: 8, energy: 8 },
    { day: "Fri", hour: 14, energy: 7 },
    { day: "Fri", hour: 20, energy: 9 },
    { day: "Sat", hour: 8, energy: 7 },
    { day: "Sat", hour: 14, energy: 8 },
    { day: "Sat", hour: 20, energy: 8 },
    { day: "Sun", hour: 8, energy: 6 },
    { day: "Sun", hour: 14, energy: 7 },
    { day: "Sun", hour: 20, energy: 7 },
  ]

  const patterns = aiInsights.filter((i) => i.type === "pattern")
  const recommendations = aiInsights.filter((i) => i.type === "recommendation")
  const alerts = aiInsights.filter((i) => i.type === "alert")

  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: onboardingQuestions[0].question,
      },
    ])
  }, [])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-muted">Preparing your onboarding experience…</div>
      </div>
    )
  }

  const handleSendMessage = (message: string, type?: MessageType, metadata?: MessageMetadata) => {
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      type,
      metadata,
    }
    const updatedConversation = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage])
    setResponsesByStep((prev) => ({
      ...prev,
      [currentStepIndex]: userMessage,
    }))
    setIsLoading(true)

    setTimeout(() => {
      const nextStepIndex = currentStepIndex + 1

      if (nextStepIndex < onboardingQuestions.length) {
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: onboardingQuestions[nextStepIndex].question,
        }
        setMessages((prev) => [...prev, aiMessage])

        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index < nextStepIndex ? "completed" : index === nextStepIndex ? "active" : "upcoming",
          })),
        )
        setCurrentStepIndex(nextStepIndex)
      } else {
        const completionMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Thank you for sharing! I now have a good understanding of your wellness journey. Here are some personalized recommendations for you.",
        }
        setMessages((prev) => [...prev, completionMessage])

        setSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })))

        fetchEmpathyRecommendations(updatedConversation, metadata)
      }
      setIsLoading(false)
    }, 1500)
  }

  const fetchEmpathyRecommendations = async (
    conversation: ConversationMessage[],
    latestMetadata?: MessageMetadata,
  ) => {
    try {
      const userMessages = conversation.filter((msg) => msg.role === "user")
      const textualNarrative = userMessages
        .filter((msg) => msg.type !== "emoji")
        .map((msg) => msg.content)
        .join("\n")
      const trimmedNarrative = textualNarrative.slice(-1000)
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

      const context =
        trimmedNarrative ||
        conversation[conversation.length - 1]?.content ||
        (emotionLabels.length ? `Recent mood tags: ${emotionLabels.join(", ")}` : "")

      const payload: EmpathyRequestPayload = {
        context,
        emotions: Array.from(emotionSet),
        triggers: [],
        recentMoods: moodValues,
      }

      const moodLabel =
        (typeof latestMetadata?.label === "string" && latestMetadata.label) ||
        emotionLabels[emotionLabels.length - 1]

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

      const response = await fetch("/api/empathy-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = (await response.json()) as EmpathyResponse
        setEmpathyData(data)
        setIsCompleted(true)
        setActiveTab("empathy")
        await persistCheckIn(conversation, payload, data)
      } else {
        const errorBody = await response.json().catch(() => ({}))
        console.error("[mindful-ai] Empathy recommendations failed:", errorBody)
      }
    } catch (error) {
      console.error("Error fetching empathy recommendations:", error)
    }
  }

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">
      <div className="md:hidden border-b border-border p-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {!isCompleted && <ProgressSidebar currentStep={currentStepIndex + 1} steps={steps} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden md:flex border-b border-border p-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {isCompleted ? (
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <div className="border-b border-border bg-background sticky top-0 z-10">
                <div className="container mx-auto px-4">
                  <TabsList className="h-14">
                    <TabsTrigger value="empathy" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Recommendations
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Insights
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="empathy" className="m-0 p-0">
                {empathyData && (
                  <EmpathyRecommendations
                    recommendation={empathyData}
                    onDismiss={() => {
                      setActiveTab("dashboard")
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="dashboard" className="m-0 p-0">
                <div className="container mx-auto px-4 py-8 md:px-6">
                  <div className="mb-8">
                    <h1 className="text-3xl font-semibold mb-1">Welcome back!</h1>
                    <p className="text-base text-text-muted">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                  </div>

                  {isSnapshotLoading && (
                    <div className="mb-6 text-sm text-text-muted">Refreshing your latest check-ins...</div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <MetricCard
                      title="Average Mood"
                      value={`${avgMood}/10`}
                      icon={<Heart className="h-5 w-5" />}
                      trend={{ direction: "up", value: "+0.8", isPositive: true }}
                    />
                    <MetricCard
                      title="Average Energy"
                      value={`${avgEnergy}/10`}
                      icon={<Zap className="h-5 w-5" />}
                      trend={{ direction: "up", value: "+0.5", isPositive: true }}
                    />
                    <MetricCard
                      title="Check-Ins"
                      value={moodEntries.length}
                      icon={<Brain className="h-5 w-5" />}
                      trend={{ direction: "up", value: "+3", isPositive: true }}
                    />
                    <MetricCard
                      title="Streak"
                      value="7 days"
                      icon={<TrendingUp className="h-5 w-5" />}
                      trend={{ direction: "up", value: "+2", isPositive: true }}
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3 mb-8">
                    <Card className="lg:col-span-2 p-6">
                      <h2 className="text-lg font-semibold mb-4">Mood & Energy Trends</h2>
                      <p className="text-sm text-text-secondary mb-4">Last 30 days</p>
                      <MoodTrendChart data={moodEntries} />
                    </Card>

                    <Card className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Wellbeing Score</h2>
                      <WellbeingScore score={wellbeingScore} />
                    </Card>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Common Triggers</h2>
                      <p className="text-sm text-text-secondary mb-4">Most frequent patterns affecting your mood</p>
                      <TriggerCloud triggers={triggerFrequency} />
                    </Card>

                    <Card className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Energy Patterns</h2>
                      <p className="text-sm text-text-secondary mb-4">Energy levels by time of day</p>
                      <EnergyHeatmap data={energyHeatmapData} />
                    </Card>
                  </div>

                  <Card className="p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Wellness Goals</h2>
                    <div className="space-y-6">
                      {wellnessGoals.map((goal) => (
                        <div key={goal.goal}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{goal.goal}</span>
                            <span className="text-sm text-text-muted">
                              {goal.current} / {goal.target} {goal.unit}
                            </span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Coping Strategy Effectiveness</h2>
                    <p className="text-sm text-text-secondary mb-4">
                      Average mood improvement after using each strategy
                    </p>
                    <div className="space-y-3">
                      {Object.entries(copingEffectiveness)
                        .sort(([, a], [, b]) => b - a)
                        .map(([strategy, effectiveness]) => (
                          <div key={strategy} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{strategy}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-success rounded-full transition-all duration-500"
                                  style={{ width: `${(effectiveness / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-text-muted w-12 text-right">{effectiveness}/10</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="m-0 p-0">
                <div className="container mx-auto px-4 py-8 md:px-6">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-semibold">AI Insights</h1>
                        <p className="text-base text-text-muted">Personalized recommendations based on your patterns</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card className="p-4 border-l-4 border-l-primary">
                      <div className="flex items-center gap-3">
                        <Brain className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-2xl font-bold">{patterns.length}</div>
                          <div className="text-sm text-text-muted">Patterns Detected</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-success">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-success" />
                        <div>
                          <div className="text-2xl font-bold">{recommendations.length}</div>
                          <div className="text-sm text-text-muted">Recommendations</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-warning">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-warning" />
                        <div>
                          <div className="text-2xl font-bold">{alerts.length}</div>
                          <div className="text-sm text-text-muted">Alerts</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Tabs defaultValue="all" className="mb-8">
                    <TabsList className="mb-6">
                      <TabsTrigger value="all">
                        All Insights
                        <Badge variant="secondary" className="ml-2">
                          {aiInsights.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="patterns">
                        Patterns
                        <Badge variant="secondary" className="ml-2">
                          {patterns.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="recommendations">
                        Recommendations
                        <Badge variant="secondary" className="ml-2">
                          {recommendations.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="alerts">
                        Alerts
                        <Badge variant="secondary" className="ml-2">
                          {alerts.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                      {aiInsights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                      ))}
                    </TabsContent>

                    <TabsContent value="patterns" className="space-y-4">
                      {patterns.length > 0 ? (
                        patterns.map((insight, index) => <InsightCard key={index} insight={insight} />)
                      ) : (
                        <Card className="p-8 text-center">
                          <Brain className="h-12 w-12 text-text-muted mx-auto mb-4" />
                          <p className="text-text-secondary">No patterns detected yet. Keep logging your check-ins!</p>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="recommendations" className="space-y-4">
                      {recommendations.length > 0 ? (
                        recommendations.map((insight, index) => <InsightCard key={index} insight={insight} />)
                      ) : (
                        <Card className="p-8 text-center">
                          <TrendingUp className="h-12 w-12 text-text-muted mx-auto mb-4" />
                          <p className="text-text-secondary">No recommendations yet. We'll analyze your data soon!</p>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="alerts" className="space-y-4">
                      {alerts.length > 0 ? (
                        alerts.map((insight, index) => <InsightCard key={index} insight={insight} />)
                      ) : (
                        <Card className="p-8 text-center">
                          <AlertTriangle className="h-12 w-12 text-text-muted mx-auto mb-4" />
                          <p className="text-text-secondary">No alerts at this time. You're doing great!</p>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Need Additional Support?</h3>
                        <p className="text-sm text-text-secondary">
                          If you're experiencing persistent difficulties, consider reaching out to a mental health
                          professional.
                        </p>
                      </div>
                      <Button variant="outline" className="flex-shrink-0 bg-transparent">
                        Find Resources
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <ConversationInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            placeholder={onboardingQuestions[currentStepIndex]?.placeholder || "Type your response..."}
            isLoading={isLoading}
            enableMultimodal
          />
        )}
      </div>
    </div>
  )
}
