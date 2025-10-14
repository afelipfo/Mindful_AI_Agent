"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Play, Pause, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(20).fill(20))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        onRecordingComplete?.(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)

      // Animate waveform
      waveformIntervalRef.current = setInterval(() => {
        setWaveformHeights(
          Array(20)
            .fill(0)
            .map(() => Math.random() * 40 + 20),
        )
      }, 100)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Unable to access microphone. Please check your permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
      setWaveformHeights(Array(20).fill(20))
    }
  }

  const togglePlayback = () => {
    if (!audioURL) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioURL)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setAudioURL(null)
    setIsPlaying(false)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Recording Button */}
      <div className="relative">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-scale)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 active:brightness-95",
            isRecording
              ? "bg-danger text-white animate-pulse-ring"
              : "bg-primary text-primary-foreground hover:scale-110",
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          disabled={false}
        >
          <Mic className="h-8 w-8" />
        </button>
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-danger animate-pulse-ring pointer-events-none" />
        )}
      </div>

      {/* Timer */}
      <div className="text-base font-mono tabular-nums text-text-primary">{formatTime(recordingTime)}</div>

      {/* Waveform */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-[60px]">
          {waveformHeights.map((height, index) => (
            <div
              key={index}
              className="w-1 bg-primary rounded-full transition-all duration-100 ease-[var(--ease-slide)]"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      )}

      {/* Playback Controls */}
      {audioURL && !isRecording && (
        <div className="flex items-center gap-4">
          <Button onClick={togglePlayback} size="icon" variant="outline">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={deleteRecording} size="icon" variant="outline">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !audioURL && (
        <p className="text-sm text-text-secondary text-center">
          Tap the microphone to start recording (max 60 seconds)
        </p>
      )}
    </div>
  )
}
