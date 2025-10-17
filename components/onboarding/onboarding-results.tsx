"use client"

import dynamicImport from "next/dynamic"
import { format } from "date-fns"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, BarChart3, Sparkles, Zap, Brain, TrendingUp, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GoalManager } from "@/components/dashboard/goal-manager"
import { MoodEntryHistory } from "@/components/dashboard/mood-entry-history"
import type { AIInsight, MoodEntry, WellnessGoal } from "@/types/wellness"
import type { EmpathyResponse } from "@/lib/empathy-agent"

const EmpathyRecommendations = dynamicImport(
  () => import("@/components/check-in/empathy-recommendations").then((mod) => ({ default: mod.EmpathyRecommendations })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8">Loading...</div> },
)

const MetricCard = dynamicImport(
  () => import("@/components/dashboard/metric-card").then((mod) => ({ default: mod.MetricCard })),
  { ssr: false },
)

const MoodTrendChart = dynamicImport(
  () => import("@/components/dashboard/mood-trend-chart").then((mod) => ({ default: mod.MoodTrendChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> },
)

const TriggerCloud = dynamicImport(
  () => import("@/components/dashboard/trigger-cloud").then((mod) => ({ default: mod.TriggerCloud })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> },
)

const WellbeingScore = dynamicImport(
  () => import("@/components/dashboard/wellbeing-score").then((mod) => ({ default: mod.WellbeingScore })),
  { ssr: false },
)

const EnergyHeatmap = dynamicImport(
  () => import("@/components/dashboard/energy-heatmap").then((mod) => ({ default: mod.EnergyHeatmap })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-muted" /> },
)



type TrendData = {
  direction: "up" | "down"
  value: string
  isPositive: boolean
}
const InsightCard = dynamicImport(
  () => import("@/components/insights/insight-card").then((mod) => ({ default: mod.InsightCard })),
  { ssr: false },
)

interface OnboardingResultsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  empathyData: EmpathyResponse | null
  snapshotLoading: boolean
  metrics: {
    averageMoodDisplay: string
    averageEnergyDisplay: string
    checkInsCurrent: number
    streakDisplay: string
    moodTrend?: TrendData
    energyTrend?: TrendData
    checkInTrend?: TrendData
    wellbeingScore: number
  }
  hasMoodData: boolean
  sortedMoodEntries: MoodEntry[]
  energyHeatmapData: { day: string; hour: number; energy: number }[]
  hasEnergyData: boolean
  triggerFrequency: Record<string, number>
  copingEffectiveness: Record<string, number>
  wellnessGoals: WellnessGoal[]
  onRefreshSnapshot: () => Promise<void> | void
  moodEntryHistory: MoodEntry[]
  aiInsights: AIInsight[]
  patterns: AIInsight[]
  recommendations: AIInsight[]
  alerts: AIInsight[]
  onDismissInsight: (insight: AIInsight) => void
  todayLabel?: string
}

export function OnboardingResults({
  activeTab,
  onTabChange,
  empathyData,
  snapshotLoading,
  metrics,
  hasMoodData,
  sortedMoodEntries,
  energyHeatmapData,
  hasEnergyData,
  triggerFrequency,
  copingEffectiveness: _copingEffectiveness,
  wellnessGoals,
  onRefreshSnapshot,
  moodEntryHistory,
  aiInsights,
  patterns,
  recommendations,
  alerts,
  onDismissInsight,
  todayLabel,
}: OnboardingResultsProps) {
  const router = useRouter()
  const todayDisplay = useMemo(() => todayLabel ?? format(new Date(), "EEEE, MMMM d, yyyy"), [todayLabel])

  const handleDismissRecommendations = () => {
    // Switch to dashboard tab and redirect to home page
    onTabChange("dashboard")
    router.push("/")
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="h-full">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
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
        {empathyData ? (
          <div className="space-y-4">
            {empathyData.warnings && empathyData.warnings.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 text-warning rounded-md mx-auto mt-6 max-w-3xl px-4 py-3">
                <p className="text-sm font-medium">We fell back to stored insights:</p>
                <ul className="mt-2 list-disc pl-6 text-xs text-warning/90">
                  {empathyData.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <EmpathyRecommendations
              recommendation={empathyData}
              onDismiss={handleDismissRecommendations}
            />
            <div className="mx-auto max-w-3xl px-4 pb-8">
              <Button
                onClick={handleDismissRecommendations}
                size="lg"
                className="w-full sm:w-auto"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-16 md:px-6">
            <Card className="p-12 text-center max-w-2xl mx-auto">
              <Heart className="mx-auto mb-6 h-16 w-16 text-text-muted" />
              <h2 className="text-2xl font-semibold mb-3">No Recommendations Yet</h2>
              <p className="text-text-secondary mb-6">
                Complete the onboarding conversation to receive personalized wellness recommendations based on your mood and needs.
              </p>
              <Button onClick={() => onTabChange("dashboard")} variant="outline">
                View Dashboard
              </Button>
            </Card>
          </div>
        )}
      </TabsContent>

      <TabsContent value="dashboard" className="m-0 p-0">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-1">Welcome back!</h1>
            <p className="text-base text-text-muted">{todayDisplay}</p>
          </div>

          {snapshotLoading && <div className="mb-6 text-sm text-text-muted">Refreshing your latest check-ins...</div>}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard title="Average Mood (7d)" value={metrics.averageMoodDisplay} icon={<Heart className="h-5 w-5" />} trend={metrics.moodTrend} />
            <MetricCard title="Average Energy (7d)" value={metrics.averageEnergyDisplay} icon={<Zap className="h-5 w-5" />} trend={metrics.energyTrend} />
            <MetricCard title="7-Day Check-Ins" value={metrics.checkInsCurrent} icon={<Brain className="h-5 w-5" />} trend={metrics.checkInTrend} />
            <MetricCard title="Streak" value={metrics.streakDisplay} icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-semibold mb-4">Mood &amp; Energy Trends</h2>
              <p className="text-sm text-text-secondary mb-4">Last 30 days</p>
              {hasMoodData ? (
                <MoodTrendChart data={sortedMoodEntries} />
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
                  Log a few check-ins to unlock your personalized trends.
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Wellbeing Score</h2>
              {hasMoodData ? (
                <WellbeingScore score={metrics.wellbeingScore} />
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
                  Complete your first check-in to generate a wellbeing score.
                </div>
              )}
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
              {hasEnergyData ? (
                <EnergyHeatmap data={energyHeatmapData} />
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
                  Track your energy levels across different times of day to populate this view.
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Wellness Goals</h2>
              <GoalManager goals={wellnessGoals} onRefresh={onRefreshSnapshot} />
            </div>
            {wellnessGoals.length > 0 ? (
              <div className="space-y-6">
                {wellnessGoals.map((goal) => (
                  <div key={goal.id ?? goal.goal}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{goal.goal}</span>
                      <span className="text-sm text-text-muted">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
                Add a goal to track your progress here.
              </div>
            )}
          </Card>

          <Card className="p-6 mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Check-ins</h2>
              <Badge variant="outline">Latest 10 entries</Badge>
            </div>
            <MoodEntryHistory entries={moodEntryHistory} onRefresh={onRefreshSnapshot} />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Need Additional Support?</h3>
                <p className="text-sm text-text-secondary">
                  If you're experiencing persistent difficulties, consider reaching out to a mental health professional.
                </p>
              </div>
              <Button asChild variant="outline" className="flex-shrink-0 bg-transparent">
                <Link href="/professionals">Find Resources</Link>
              </Button>
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="insights" className="m-0 p-0">
        <div className="container mx-auto space-y-6 px-4 py-8 md:px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">Insight Center</h2>
            <Badge variant="secondary">{aiInsights.length} total</Badge>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                All
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
              {aiInsights.length > 0 ? (
                aiInsights.map((insight, index) => (
                  <InsightCard key={insight.id ?? index} insight={insight} onDismiss={onDismissInsight} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                  <p className="text-text-secondary">No AI insights yet. Keep logging check-ins and we'll start generating personalized insights!</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {patterns.length > 0 ? (
                patterns.map((insight, index) => (
                  <InsightCard key={insight.id ?? index} insight={insight} onDismiss={onDismissInsight} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Brain className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                  <p className="text-text-secondary">No patterns detected yet. Keep logging your check-ins!</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((insight, index) => (
                  <InsightCard key={insight.id ?? index} insight={insight} onDismiss={onDismissInsight} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                  <p className="text-text-secondary">No recommendations yet. We'll analyze your data soon!</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((insight, index) => (
                  <InsightCard key={insight.id ?? index} insight={insight} onDismiss={onDismissInsight} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                  <p className="text-text-secondary">No alerts at this time. You're doing great!</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </TabsContent>
    </Tabs>
  )
}
