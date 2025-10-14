"use client"

import { useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { MoodEntry } from "@/types/wellness"

interface MoodEntryHistoryProps {
  entries: MoodEntry[]
  onRefresh: () => Promise<void> | void
}

export function MoodEntryHistory({ entries, onRefresh }: MoodEntryHistoryProps) {
  const { toast } = useToast()
  const [activeEntry, setActiveEntry] = useState<MoodEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formState, setFormState] = useState({
    moodScore: "",
    energyLevel: "",
    note: "",
    triggers: "",
    emotions: "",
    coping: "",
  })
  const [isPending, startTransition] = useTransition()

  const sortedEntries = useMemo(() => entries.slice(0, 10), [entries])

  const openDialog = (entry: MoodEntry) => {
    setActiveEntry(entry)
    setFormState({
      moodScore: String(entry.mood ?? 5),
      energyLevel: String(entry.energy ?? 5),
      note: entry.note ?? "",
      triggers: entry.triggers?.join(", ") ?? "",
      emotions: entry.emotions?.join(", ") ?? "",
      coping: entry.coping?.join(", ") ?? "",
    })
    setIsDialogOpen(true)
  }

  const handleFieldChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  const handleSave = () => {
    if (!activeEntry?.id) return
    const moodScore = Number(formState.moodScore)
    const energyLevel = Number(formState.energyLevel)
    if (Number.isNaN(moodScore) || Number.isNaN(energyLevel)) {
      toast({
        title: "Check the numbers",
        description: "Mood and energy must be valid numbers between 1 and 10.",
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/mood-entries/${activeEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moodScore,
            energyLevel,
            note: formState.note.trim() || null,
            triggers: parseList(formState.triggers),
            emotions: parseList(formState.emotions),
            coping: parseList(formState.coping),
          }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update entry")
        }

        await onRefresh()
        setIsDialogOpen(false)
        toast({
          title: "Entry updated",
          description: "Your reflections now reflect the latest details.",
        })
      } catch (error) {
        console.error("[mindful-ai] Failed to update entry", error)
        toast({
          title: "Unable to update entry",
          description: "Please try again later.",
        })
      }
    })
  }

  const handleDelete = async (entry: MoodEntry) => {
    if (!entry.id) return
    try {
      const response = await fetch(`/api/mood-entries/${entry.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete entry")
      }

      await onRefresh()
      toast({
        title: "Entry deleted",
        description: "Removed from your timeline.",
      })
    } catch (error) {
      console.error("[mindful-ai] Failed to delete entry", error)
      toast({
        title: "Unable to delete entry",
        description: "Please try again later.",
      })
    }
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Log a mood check-in to populate your history.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedEntries.map((entry) => (
        <div
          key={entry.id ?? `${entry.date}-${entry.mood}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">
              {format(new Date(entry.date), "MMM dd, yyyy")} · Mood {entry.mood}/10 · Energy {entry.energy}/10
            </p>
            {entry.note && <p className="text-xs text-muted-foreground line-clamp-1">{entry.note}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={isDialogOpen && activeEntry?.id === entry.id}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  setActiveEntry(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => openDialog(entry)}>
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit check-in</DialogTitle>
                  <DialogDescription>Fine-tune the details so insights stay accurate.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-mood">Mood score</Label>
                      <Input
                        id="edit-mood"
                        type="number"
                        min={1}
                        max={10}
                        value={formState.moodScore}
                        onChange={(event) => handleFieldChange("moodScore", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-energy">Energy level</Label>
                      <Input
                        id="edit-energy"
                        type="number"
                        min={1}
                        max={10}
                        value={formState.energyLevel}
                        onChange={(event) => handleFieldChange("energyLevel", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-note">Reflection</Label>
                    <Textarea
                      id="edit-note"
                      rows={3}
                      value={formState.note}
                      onChange={(event) => handleFieldChange("note", event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-triggers">Triggers (comma separated)</Label>
                    <Input
                      id="edit-triggers"
                      value={formState.triggers}
                      onChange={(event) => handleFieldChange("triggers", event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-emotions">Emotions (comma separated)</Label>
                    <Input
                      id="edit-emotions"
                      value={formState.emotions}
                      onChange={(event) => handleFieldChange("emotions", event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-coping">Coping strategies (comma separated)</Label>
                    <Input
                      id="edit-coping"
                      value={formState.coping}
                      onChange={(event) => handleFieldChange("coping", event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isPending}>
                      Save changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(entry)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
