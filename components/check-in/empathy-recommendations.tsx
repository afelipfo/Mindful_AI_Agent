"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Lightbulb, Music, BookOpen, MapPin, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react"

interface EmpathyRecommendation {
  empathyMessage: string
  recommendation: {
    title: string
    description: string
    actionLabel: string
    actionType: "breathing" | "journal" | "timer" | "contact"
  }
  quote: {
    text: string
    author: string
  }
  music: {
    title: string
    artist: string
    reason: string
    spotifyUrl: string
    appleMusicUrl: string
  }
  book: {
    title: string
    author: string
    relevance: string
    amazonUrl: string
  }
  place: {
    type: string
    reason: string
    benefits: string
  }
}

interface EmpathyRecommendationsProps {
  recommendation: EmpathyRecommendation
  onDismiss: () => void
}

export function EmpathyRecommendations({ recommendation, onDismiss }: EmpathyRecommendationsProps) {
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null)

  const handleFeedback = (value: "helpful" | "not_helpful") => {
    setFeedback(value)
    // In production, send feedback to API
    console.log("[v0] User feedback:", value)
  }

  const handleAction = (actionType: string) => {
    console.log("[v0] Action clicked:", actionType)
    // Handle different action types
    switch (actionType) {
      case "breathing":
        // Navigate to breathing exercise
        break
      case "journal":
        // Open journal
        break
      case "timer":
        // Set timer
        break
      case "contact":
        // View contacts
        break
    }
  }

  return (
    <div
      className="mx-auto mt-6 max-w-[600px] animate-slide-down"
      role="region"
      aria-label="Personalized wellness recommendations"
      aria-live="polite"
    >
      <div className="space-y-5 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 p-8 shadow-lg">
        {/* Empathy Message Section */}
        <div className="animate-fade-in rounded-lg border border-primary/20 bg-white p-5">
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 flex-shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h3 className="mb-2 text-lg font-semibold text-primary">We hear you</h3>
              <p className="text-balance leading-relaxed text-gray-700">{recommendation.empathyMessage}</p>
            </div>
          </div>
        </div>

        {/* Recommendation Section */}
        <div className="animate-fade-in-delay-300 rounded-lg border border-success/20 bg-white p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 flex-shrink-0 text-success" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-success">Try this</h3>
              <p className="mb-3 text-gray-700">{recommendation.recommendation.description}</p>
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

        {/* Motivational Quote Section */}
        <div className="animate-fade-in-delay-400 relative rounded-lg border-l-4 border-primary bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
          <div className="absolute left-4 top-4 text-5xl leading-none text-primary/20" aria-hidden="true">
            "
          </div>
          <blockquote className="pl-5">
            <p className="text-balance text-lg font-medium italic leading-relaxed text-gray-800">
              {recommendation.quote.text}
            </p>
            <footer className="mt-3 text-right text-sm text-gray-600">— {recommendation.quote.author}</footer>
          </blockquote>
        </div>

        {/* Curated Recommendations Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Music Recommendation */}
          <a
            href={recommendation.music.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group animate-fade-in-delay-500 relative rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`Listen to ${recommendation.music.title} by ${recommendation.music.artist} on Spotify`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Music className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">LISTEN</p>
            <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-gray-900">{recommendation.music.title}</h4>
            <p className="mb-1 text-xs text-gray-600">{recommendation.music.artist}</p>
            <p className="line-clamp-3 text-xs leading-snug text-gray-600">{recommendation.music.reason}</p>
            <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>

          {/* Book Recommendation */}
          <a
            href={recommendation.book.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group animate-fade-in-delay-600 relative rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`Read ${recommendation.book.title} by ${recommendation.book.author} on Amazon`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">READ</p>
            <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-gray-900">{recommendation.book.title}</h4>
            <p className="mb-1 text-xs text-gray-600">{recommendation.book.author}</p>
            <p className="line-clamp-3 text-xs leading-snug text-gray-600">{recommendation.book.relevance}</p>
            <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>

          {/* Place Recommendation */}
          <div className="group animate-fade-in-delay-700 relative rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:col-span-2 lg:col-span-1">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">VISIT</p>
            <h4 className="mb-1.5 line-clamp-2 text-sm font-semibold text-gray-900">{recommendation.place.type}</h4>
            <p className="mb-1 text-xs text-gray-600">{recommendation.place.reason}</p>
            <p className="line-clamp-3 text-xs leading-snug text-gray-600">{recommendation.place.benefits}</p>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Was this helpful?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback("helpful")}
                className={`rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 ${
                  feedback === "helpful" ? "bg-success/20 text-success" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Mark as helpful"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFeedback("not_helpful")}
                className={`rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 ${
                  feedback === "not_helpful"
                    ? "bg-danger/20 text-danger"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Mark as not helpful"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-sm text-gray-500 underline decoration-dotted transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Close recommendations
          </button>
        </div>
      </div>
    </div>
  )
}
