"use client"

import { useState } from "react"
import {
  Heart,
  Lightbulb,
  Music,
  BookOpen,
  MapPin,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RotateCcw,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { EmpathyResponse } from "@/lib/empathy-agent"

export type EmpathyRecommendation = EmpathyResponse

interface EmpathyRecommendationsProps {
  recommendation: EmpathyRecommendation
  onDismiss: () => void
  onReset?: () => void
}

const moodLabels: Record<string, string> = {
  anxious: "Anxious",
  happy: "Happy",
  sad: "Sad",
  tired: "Tired",
  stressed: "Stressed",
  excited: "Excited",
}

const moodBadgeClasses: Record<string, string> = {
  anxious: "bg-warning/10 text-warning border-warning/40",
  happy: "bg-success/10 text-success border-success/40",
  sad: "bg-blue-100 text-blue-700 border-blue-200",
  tired: "bg-muted text-text-muted border-muted-foreground/20",
  stressed: "bg-danger/10 text-danger border-danger/40",
  excited: "bg-secondary/10 text-secondary border-secondary/40",
}

const clampConfidence = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function EmpathyRecommendations({ recommendation, onDismiss, onReset }: EmpathyRecommendationsProps) {
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null)
  const { toast } = useToast()

  const confidenceValue = clampConfidence(recommendation.confidence)
  const sources = recommendation.analysisSources ?? []
  const moodKey = recommendation.detectedMood?.toLowerCase()
  const moodLabel = moodLabels[moodKey] ?? recommendation.detectedMood
  const moodBadge = moodBadgeClasses[moodKey] ?? "bg-primary/10 text-primary border-primary/30"

  const handleFeedback = (value: "helpful" | "not_helpful") => {
    setFeedback(value)
    console.log("[mindful-ai] user feedback:", value)
  }

  const handleAction = (actionType: string) => {
    console.log("[mindful-ai] recommendation action:", actionType)
  }

  const handleShare = async () => {
    const shareText = `Mood: ${moodLabel}\nConfidence: ${confidenceValue}%\nSummary: ${recommendation.analysisSummary}\nEmpathy: ${recommendation.empathyMessage}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Mindful AI Insight",
          text: shareText,
        })
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Copied to clipboard",
          description: "Insight summary copied. Share it with someone you trust.",
        })
      } else {
        throw new Error("Sharing not supported")
      }
    } catch (error) {
      console.error("Share failed:", error)
      toast({
        title: "Unable to share",
        description: "We couldn't share this insight automatically. Try copying it manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className="mx-auto mt-6 w-full max-w-3xl animate-slide-down"
      role="region"
      aria-label="Personalized wellness recommendations"
      aria-live="polite"
    >
      <div className="space-y-6 rounded-xl bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-6 shadow-lg sm:p-8">
        <div className="rounded-xl border border-border bg-background/80 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Detected mood</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                    moodBadge,
                  )}
                >
                  {moodLabel}
                </span>
                <div className="flex flex-col text-xs text-text-muted">
                  <span>Confidence</span>
                  <span className="font-semibold text-text-primary">{confidenceValue}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share insight
              </Button>
              {onReset && (
                <Button variant="ghost" size="sm" className="gap-2" onClick={onReset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                <span>Analysis confidence</span>
                <span>{confidenceValue}%</span>
              </div>
              <Progress value={confidenceValue} className="h-2" />
            </div>

            <p className="text-sm leading-relaxed text-text-secondary">{recommendation.analysisSummary}</p>

            {sources.length > 0 && (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-muted">
                  <Target className="h-4 w-4" />
                  Analysis sources
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <span
                      key={`${source.type}-${source.label}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-muted"
                    >
                      <span className="font-semibold text-text-primary">{source.weight}%</span>
                      {source.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border border-primary/20 bg-background p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 flex-shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-primary">We hear you</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{recommendation.empathyMessage}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-success/20 bg-background p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 flex-shrink-0 text-success" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-success">{recommendation.recommendation.title}</h3>
                <p className="mb-3 text-sm text-text-secondary">{recommendation.recommendation.description}</p>
                <Button
                  onClick={() => handleAction(recommendation.recommendation.actionType)}
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-lg bg-success/10 text-success transition-colors hover:bg-success/20 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 active:scale-95"
                >
                  {recommendation.recommendation.actionLabel}
                </Button>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border-l-4 border-primary bg-gradient-to-r from-primary/5 to-secondary/10 p-6 shadow-sm">
            <div className="absolute left-4 top-2 text-5xl leading-none text-primary/20" aria-hidden="true">
              "
            </div>
            <blockquote className="pl-8">
              <p className="text-base font-medium italic leading-relaxed text-text-primary">
                {recommendation.quote.text}
              </p>
              <footer className="mt-3 text-right text-sm text-text-muted">— {recommendation.quote.author}</footer>
            </blockquote>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href={recommendation.music.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Listen to ${recommendation.music.title} by ${recommendation.music.artist} on Spotify`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Music className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Listen</p>
              <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-text-primary">
                {recommendation.music.title}
              </h4>
              <p className="mb-1 text-xs text-text-secondary">{recommendation.music.artist}</p>
              <p className="line-clamp-3 text-xs leading-snug text-text-secondary">{recommendation.music.reason}</p>
              <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>

            <a
              href={recommendation.book.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Read ${recommendation.book.title} by ${recommendation.book.author} on Amazon`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Read</p>
              <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-text-primary">
                {recommendation.book.title}
              </h4>
              <p className="mb-1 text-xs text-text-secondary">{recommendation.book.author}</p>
              <p className="line-clamp-3 text-xs leading-snug text-text-secondary">{recommendation.book.relevance}</p>
              <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>

            <div className="group relative rounded-lg border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Visit</p>
              <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-text-primary">
                {recommendation.place.type}
              </h4>
              <p className="mb-1 text-xs text-text-secondary">{recommendation.place.reason}</p>
              <p className="line-clamp-3 text-xs leading-snug text-text-secondary">{recommendation.place.benefits}</p>
              {recommendation.place.address && (
                <p className="mt-2 text-xs text-text-muted">{recommendation.place.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Was this helpful?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback("helpful")}
                className={cn(
                  "rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95",
                  feedback === "helpful" ? "bg-success/20 text-success" : "bg-muted text-text-secondary hover:bg-muted/80",
                )}
                aria-label="Mark as helpful"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFeedback("not_helpful")}
                className={cn(
                  "rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95",
                  feedback === "not_helpful" ? "bg-danger/20 text-danger" : "bg-muted text-text-secondary hover:bg-muted/80",
                )}
                aria-label="Mark as not helpful"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-text-muted underline decoration-dotted transition-colors hover:text-text-secondary"
              onClick={onDismiss}
            >
              Close recommendations
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
