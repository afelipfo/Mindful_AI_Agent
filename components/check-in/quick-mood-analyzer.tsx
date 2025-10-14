"use client"

import { useState } from "react"
import { Sparkles, Mic, ImageIcon, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmpathyRecommendations, EmpathyRecommendation } from "@/components/check-in/empathy-recommendations"
import { VoiceRecorder } from "@/components/check-in/voice-recorder"
import { PhotoCapture } from "@/components/check-in/photo-capture"
import { uploadAudio, uploadImage } from "@/lib/upload"
import { useToast } from "@/hooks/use-toast"

interface QuickMoodAnalyzerProps {
  className?: string
}

interface TextAnalysis {
  moodLabel: string
  moodScore: number
  energyLevel: number
  emotions: string[]
  summary: string
  confidence: number
}

interface VoiceAnalysis {
  transcript: string
  moodLabel?: string
  moodScore?: number
  energyLevel?: number
  emotions?: string[]
  summary?: string
}

interface ImageAnalysis {
  moodLabel?: string
  confidence?: number
  emotions?: string[]
  summary?: string
}

interface VoiceAttachment {
  url: string
  analysis?: VoiceAnalysis
}

interface ImageAttachment {
  url: string
  analysis?: ImageAnalysis
}

export function QuickMoodAnalyzer({ className }: QuickMoodAnalyzerProps) {
  const [input, setInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EmpathyRecommendation | null>(null)

  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null)
  const [voiceAttachment, setVoiceAttachment] = useState<VoiceAttachment | null>(null)
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null)
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false)
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { toast } = useToast()

  const analyzeText = async (text: string): Promise<TextAnalysis | null> => {
    if (!text.trim()) {
      return null
    }

    try {
      const response = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!response.ok) {
        throw new Error("Text analysis failed")
      }

      const data = (await response.json()) as TextAnalysis
      return data
    } catch (analysisError) {
      console.error("Text analysis error:", analysisError)
      return null
    }
  }

  const handleVoiceSend = async (audioBlob: Blob) => {
    try {
      setIsUploadingVoice(true)
      toast({
        title: "Uploading voice note...",
        description: "We are processing your recording",
      })

      const audioUrl = await uploadAudio(audioBlob)

      try {
        const response = await fetch("/api/analyze/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioUrl }),
        })

        if (response.ok) {
          const analysis = (await response.json()) as VoiceAnalysis
          setVoiceAttachment({ url: audioUrl, analysis })
          toast({
            title: "Voice note added",
            description: analysis.summary || "We captured your voice reflection.",
          })
        } else {
          console.error("Voice analysis failed", await response.json().catch(() => ({})))
          setVoiceAttachment({ url: audioUrl })
          toast({
            title: "Voice note saved",
            description: "We couldn't analyze it right now, but it's attached.",
          })
        }
      } catch (analysisError) {
        console.error("Voice analysis error:", analysisError)
        setVoiceAttachment({ url: audioUrl })
        toast({
          title: "Voice note saved",
          description: "We couldn't analyze it right now, but it's attached.",
        })
      }
    } catch (error) {
      console.error("Failed to upload audio:", error)
      toast({
        title: "Voice upload failed",
        description: "Please try recording again.",
      })
    } finally {
      setIsUploadingVoice(false)
      setIsVoiceRecorderOpen(false)
    }
  }

  const handlePhotoSend = async (file: File) => {
    try {
      setIsUploadingImage(true)
      toast({
        title: "Uploading photo...",
        description: "We are processing your snapshot",
      })

      const photoUrl = await uploadImage(file)

      try {
        const response = await fetch("/api/analyze/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: photoUrl }),
        })

        if (response.ok) {
          const analysis = (await response.json()) as ImageAnalysis
          setImageAttachment({ url: photoUrl, analysis })
          toast({
            title: "Photo analyzed",
            description: analysis.summary || "We added mood cues from your photo.",
          })
        } else {
          console.error("Image analysis failed", await response.json().catch(() => ({})))
          setImageAttachment({ url: photoUrl })
          toast({
            title: "Photo saved",
            description: "We couldn't analyze it right now, but it's attached.",
          })
        }
      } catch (analysisError) {
        console.error("Image analysis error:", analysisError)
        setImageAttachment({ url: photoUrl })
        toast({
          title: "Photo saved",
          description: "We couldn't analyze it right now, but it's attached.",
        })
      }
    } catch (error) {
      console.error("Failed to upload photo:", error)
      toast({
        title: "Photo upload failed",
        description: "Please try again with a different shot.",
      })
    } finally {
      setIsUploadingImage(false)
      setIsPhotoCaptureOpen(false)
    }
  }

  const handleAnalyze = async () => {
    if (!input.trim() && !voiceAttachment && !imageAttachment) {
      setError("Share a note, voice recording, or photo so we have something to reflect on.")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      let textInsights: TextAnalysis | null = null
      if (input.trim()) {
        textInsights = await analyzeText(input)
        setTextAnalysis(textInsights)
      } else {
        setTextAnalysis(null)
      }

      const contextSegments: string[] = []
      const emotionSet = new Set<string>()
      const recentMoods: number[] = []

      if (textInsights) {
        contextSegments.push(textInsights.summary)
        textInsights.emotions.forEach((emotion) => emotionSet.add(emotion.toLowerCase()))
        recentMoods.push(textInsights.moodScore)
      } else if (input.trim()) {
        contextSegments.push(input.trim())
      }

      if (voiceAttachment?.analysis) {
        const { analysis } = voiceAttachment
        if (analysis.summary) {
          contextSegments.push(`Voice insight: ${analysis.summary}`)
        } else if (analysis.transcript) {
          contextSegments.push(`Voice transcript: ${analysis.transcript}`)
        }
        ;(analysis.emotions ?? []).forEach((emotion) => emotionSet.add(emotion.toLowerCase()))
        if (typeof analysis.moodScore === "number") {
          recentMoods.push(analysis.moodScore)
        }
      }

      if (imageAttachment?.analysis) {
        const { analysis } = imageAttachment
        if (analysis.summary) {
          contextSegments.push(`Image insight: ${analysis.summary}`)
        }
        ;(analysis.emotions ?? []).forEach((emotion) => emotionSet.add(emotion.toLowerCase()))
      }

      const payload: Record<string, unknown> = {
        context: contextSegments.length > 0 ? contextSegments.join("\n").slice(-2000) : input.trim(),
        emotions: Array.from(emotionSet),
        triggers: [],
        recentMoods,
      }

      if (textInsights) {
        payload.mood = textInsights.moodLabel
        payload.moodScore = textInsights.moodScore
        payload.energyLevel = textInsights.energyLevel
      }

      if (voiceAttachment?.analysis) {
        const { analysis } = voiceAttachment
        payload.voiceInsights = {
          transcript: analysis.transcript,
          moodLabel: analysis.moodLabel,
          moodScore: analysis.moodScore,
          energyLevel: analysis.energyLevel,
          emotions: analysis.emotions,
          summary: analysis.summary,
        }

        if (!payload.mood && analysis.moodLabel) {
          payload.mood = analysis.moodLabel
        }
        if (!payload.moodScore && typeof analysis.moodScore === "number") {
          payload.moodScore = analysis.moodScore
        }
        if (!payload.energyLevel && typeof analysis.energyLevel === "number") {
          payload.energyLevel = analysis.energyLevel
        }
      }

      if (imageAttachment?.analysis) {
        const { analysis } = imageAttachment
        payload.imageInsights = {
          moodLabel: analysis.moodLabel,
          confidence: analysis.confidence,
          emotions: analysis.emotions,
          summary: analysis.summary,
        }

        if (!payload.mood && analysis.moodLabel) {
          payload.mood = analysis.moodLabel
        }
      }

      const response = await fetch("/api/empathy-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const payloadBody = await response.json().catch(() => ({}))
        throw new Error(payloadBody.error || "Failed to analyze mood")
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
    setTextAnalysis(null)
    setVoiceAttachment(null)
    setImageAttachment(null)
    setIsVoiceRecorderOpen(false)
    setIsPhotoCaptureOpen(false)
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
              Share a few sentences and we'll reflect back with mood insights, empathy, and curated next steps.
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

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVoiceRecorderOpen((prev) => !prev)}
                  disabled={isUploadingVoice || isAnalyzing}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {isVoiceRecorderOpen
                    ? "Hide voice recorder"
                    : voiceAttachment
                      ? "Re-record voice note"
                      : "Add voice note"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPhotoCaptureOpen((prev) => !prev)}
                  disabled={isUploadingImage || isAnalyzing}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {isPhotoCaptureOpen ? "Hide photo capture" : imageAttachment ? "Replace photo" : "Add photo"}
                </Button>
              </div>

              {isVoiceRecorderOpen && (
                <div className="rounded-lg border border-dashed border-border/60 p-4">
                  <VoiceRecorder onSend={handleVoiceSend} />
                </div>
              )}

              {isPhotoCaptureOpen && (
                <div className="rounded-lg border border-dashed border-border/60 p-4">
                  <PhotoCapture onSend={handlePhotoSend} />
                </div>
              )}

              {voiceAttachment && (
                <div className="rounded-lg border border-border bg-background/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Voice note attached</p>
                      {voiceAttachment.analysis?.summary ? (
                        <p className="mt-1 text-sm text-text-secondary">{voiceAttachment.analysis.summary}</p>
                      ) : (
                        <p className="mt-1 text-sm text-text-secondary">Voice recording saved for this check-in.</p>
                      )}
                      {voiceAttachment.analysis?.moodLabel && (
                        <p className="mt-2 text-xs text-text-muted">
                          Detected mood: {voiceAttachment.analysis.moodLabel}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVoiceAttachment(null)}
                      aria-label="Remove voice note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {imageAttachment && (
                <div className="rounded-lg border border-border bg-background/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Photo attached</p>
                      {imageAttachment.analysis?.summary ? (
                        <p className="mt-1 text-sm text-text-secondary">{imageAttachment.analysis.summary}</p>
                      ) : (
                        <p className="mt-1 text-sm text-text-secondary">Photo saved for this check-in.</p>
                      )}
                      {imageAttachment.analysis?.confidence && (
                        <p className="mt-2 text-xs text-text-muted">
                          Confidence: {imageAttachment.analysis.confidence}%
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setImageAttachment(null)}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isAnalyzing || (!input && !voiceAttachment && !imageAttachment && !error)}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzing || (!input.trim() && !voiceAttachment && !imageAttachment) || isUploadingVoice || isUploadingImage
                  }
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze mood"}
                </Button>
              </div>
            </div>
          </>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            {textAnalysis && (
              <div className="rounded-lg border border-border bg-background/80 p-4">
                <p className="text-sm font-medium text-text-primary">Text insight</p>
                <p className="mt-1 text-sm text-text-secondary">{textAnalysis.summary}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Mood: {textAnalysis.moodLabel} · Confidence: {textAnalysis.confidence}%
                </p>
              </div>
            )}

            {voiceAttachment?.analysis && (
              <div className="rounded-lg border border-border bg-background/80 p-4">
                <p className="text-sm font-medium text-text-primary">Voice insight</p>
                {voiceAttachment.analysis.summary ? (
                  <p className="mt-1 text-sm text-text-secondary">{voiceAttachment.analysis.summary}</p>
                ) : (
                  voiceAttachment.analysis.transcript && (
                    <p className="mt-1 text-sm text-text-secondary">{voiceAttachment.analysis.transcript}</p>
                  )
                )}
              </div>
            )}

            {imageAttachment?.analysis?.summary && (
              <div className="rounded-lg border border-border bg-background/80 p-4">
                <p className="text-sm font-medium text-text-primary">Image insight</p>
                <p className="mt-1 text-sm text-text-secondary">{imageAttachment.analysis.summary}</p>
              </div>
            )}

            <EmpathyRecommendations recommendation={result} onDismiss={() => setResult(null)} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  )
}
