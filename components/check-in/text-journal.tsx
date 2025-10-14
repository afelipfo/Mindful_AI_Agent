"use client"
import { Textarea } from "@/components/ui/textarea"

interface TextJournalProps {
  value: string
  onChange: (value: string) => void
}

export function TextJournal({ value, onChange }: TextJournalProps) {
  const maxLength = 1000

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How are you feeling today? Write about your thoughts, emotions, or anything on your mind..."
        className="min-h-[120px] resize-none border-2 focus:border-primary transition-colors"
        maxLength={maxLength}
      />
      <div className="absolute bottom-3 right-3 text-xs text-text-muted">
        {value.length}/{maxLength}
      </div>
    </div>
  )
}
