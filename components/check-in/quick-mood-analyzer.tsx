"use client"

import { useState } from "react"
import { Sparkles, Mic, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmpathyRecommendations, EmpathyRecommendation } from "@/components/check-in/empathy-recommendations"
import { useToast } from "@/hooks/use-toast"

interface QuickMoodAnalyzerProps {
  className?: string
}

export function QuickMoodAnalyzer({ className }: QuickMoodAnalyzerProps) {
  const [input, setInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EmpathyRecommendation | null>(null)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!input.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/empathy-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: input.trim(),
          emotions: [],
          triggers: [],
          recentMoods: [],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Failed to analyze mood")
      }

      const data = (await response.json()) as EmpathyRecommendation
      setResult(data)
      toast({
        title: "Analysis ready",
        description: "We prepared a tailored support plan based on your reflection.",
      })
    } catch (analysisError) {
      console.error("Mood analysis failed:", analysisError)
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "We couldn't analyze that right now. Please try again shortly.",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setInput("")
  }

  return (
    <div className={className}>
      <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Mindful Analyzer
            </div>
            <h2 className="text-xl font-semibold">How are you feeling today?</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Share a few sentences and we&apos;ll reflect back with mood insights, empathy, and curated next steps.
            </p>
          </div>
        </div>

        {!result && (
          <>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Example: I feel a bit squishy today—sort of mellow but unsure what's next."
              className="min-h-[140px] resize-none border-2 border-border/60 bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
              disabled={isAnalyzing}
            />

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Mic className="h-3 w-3" />
                  Voice insights enabled
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <ImageIcon className="h-3 w-3" />
                  Image cues active
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleReset} disabled={isAnalyzing || (!input && !error)}>
                  Reset
                </Button>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !input.trim()}>
                  {isAnalyzing ? "Analyzing..." : "Analyze mood"}
                </Button>
              </div>
            </div>
          </>
        )}

        {result && (
          <div className="mt-6">
            <EmpathyRecommendations
              recommendation={result}
              onDismiss={() => setResult(null)}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  )
}
