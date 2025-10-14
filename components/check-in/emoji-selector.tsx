"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { emojiMoods } from "@/lib/sample-data"

interface EmojiSelectorProps {
  onSelect: (emoji: string, label: string, value: number, note?: string) => void
}

export function EmojiSelector({ onSelect }: EmojiSelectorProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const handleEmojiClick = (emoji: string, label: string, value: number) => {
    setSelectedEmoji(emoji)
    setSelectedLabel(label)
    onSelect(emoji, label, value, note)
  }

  return (
    <div className="space-y-6">
      {/* Emoji Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {emojiMoods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => handleEmojiClick(mood.emoji, mood.label, mood.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ease-[var(--ease-elastic)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 active:brightness-95",
              selectedEmoji === mood.emoji
                ? "border-primary bg-primary/10 scale-105"
                : "border-border bg-card hover:border-primary/50",
            )}
          >
            <span className="text-4xl" role="img" aria-label={mood.label}>
              {mood.emoji}
            </span>
            <span className="text-xs text-center text-text-muted font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      {/* Optional Note */}
      {selectedEmoji && (
        <div className="animate-in slide-in-from-top-4 duration-300 ease-[var(--ease-slide)]">
          <label htmlFor="emoji-note" className="block text-sm font-medium mb-2">
            Tell us more about feeling {selectedLabel}... (optional)
          </label>
          <Textarea
            id="emoji-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              if (selectedEmoji && selectedLabel) {
                const mood = emojiMoods.find((m) => m.emoji === selectedEmoji)
                if (mood) {
                  onSelect(selectedEmoji, selectedLabel, mood.value, e.target.value)
                }
              }
            }}
            placeholder={`What's making you feel ${selectedLabel?.toLowerCase()} today?`}
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  )
}
