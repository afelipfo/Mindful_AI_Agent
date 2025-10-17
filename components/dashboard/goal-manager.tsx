"use client"

import { useEffect, useState, useTransition } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import type { WellnessGoal } from "@/types/wellness"
import { cn } from "@/lib/utils"

interface GoalManagerProps {
  goals: WellnessGoal[]
  onRefresh: () => Promise<void> | void
}

export function GoalManager({ goals, onRefresh }: GoalManagerProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [goalName, setGoalName] = useState("")
  const [goalTarget, setGoalTarget] = useState("30")
  const [goalUnit, setGoalUnit] = useState("minutes")
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({})
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  const resetForm = () => {
    setGoalName("")
    setGoalTarget("30")
    setGoalUnit("minutes")
  }

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}
    goals.forEach((goal) => {
      const key = goal.id ?? goal.goal
      nextDrafts[key] = String(goal.current ?? 0)
    })
    setProgressDrafts(nextDrafts)
  }, [goals])

  const createGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const targetValue = Number(goalTarget)
    if (!goalName.trim() || Number.isNaN(targetValue) || targetValue <= 0) {
      toast({
        title: "Check the goal details",
        description: "Please provide a name and a positive target value.",
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/wellness-goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: goalName.trim(),
            targetValue,
            unit: goalUnit.trim() || "minutes",
          }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to create goal")
        }

        resetForm()
        setIsOpen(false)
        await onRefresh()
        toast({
          title: "Goal added",
          description: "We're tracking your new wellness goal.",
        })
      } catch (error) {
        console.error("[mindful-ai] Failed to create goal", error)
        toast({
          title: "Unable to save goal",
          description: "Please try again later.",
        })
      }
    })
  }

  const updateGoalProgress = async (goal: WellnessGoal, currentValue: number) => {
    if (!goal.id) return
    setPendingGoalId(goal.id)
    try {
      const response = await fetch(`/api/wellness-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to update goal")
      }

      await onRefresh()
      toast({
        title: "Progress updated",
        description: "Nice work inching toward your target!",
      })
    } catch (error) {
      console.error("[mindful-ai] Failed to update goal", error)
      toast({
        title: "Unable to update",
        description: "Please try again in a moment.",
      })
    } finally {
      setPendingGoalId(null)
    }
  }

  const archiveGoal = async (goalId: string) => {
    setPendingGoalId(goalId)
    try {
      const response = await fetch(`/api/wellness-goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to archive goal")
      }

      await onRefresh()
      toast({
        title: "Goal archived",
        description: "You can always add it back later.",
      })
    } catch (error) {
      console.error("[mindful-ai] Failed to archive goal", error)
      toast({
        title: "Unable to archive",
        description: "Please try again in a moment.",
      })
    } finally {
      setPendingGoalId(null)
    }
  }

  const deleteGoal = async (goalId: string) => {
    setPendingGoalId(goalId)
    try {
      const response = await fetch(`/api/wellness-goals/${goalId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete goal")
      }

      await onRefresh()
      toast({
        title: "Goal removed",
        description: "We'll keep your dashboard tidy.",
      })
    } catch (error) {
      console.error("[mindful-ai] Failed to delete goal", error)
      toast({
        title: "Unable to remove goal",
        description: "Please try again in a moment.",
      })
    } finally {
      setPendingGoalId(null)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage goals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Wellness goals</DialogTitle>
          <DialogDescription>
            Track progress, add new intentions, or retire goals that no longer serve you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={createGoal}>
          <div className="grid gap-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Evening wind-down"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="goal-target">Target value</Label>
              <Input
                id="goal-target"
                type="number"
                min={1}
                step={1}
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="goal-unit">Unit</Label>
              <Input
                id="goal-unit"
                value={goalUnit}
                onChange={(event) => setGoalUnit(event.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Add goal
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active goals yet. Start by adding something small.</p>
          ) : (
            goals.map((goal) => {
              const key = goal.id ?? goal.goal
              const currentDraft = progressDrafts[key] ?? String(goal.current ?? 0)
              const numericValue = Number(currentDraft)
              const isPending = pendingGoalId === goal.id

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border border-border p-4",
                    goal.progress >= 100 ? "border-success/60" : undefined,
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{goal.goal}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {goal.target} {goal.unit}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={currentDraft}
                      onChange={(event) =>
                        setProgressDrafts((prev) => ({
                          ...prev,
                          [key]: event.target.value,
                        }))
                      }
                      aria-label={`Update progress for ${goal.goal}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending || Number.isNaN(numericValue)}
                      onClick={() => updateGoalProgress(goal, numericValue)}
                    >
                      Update
                    </Button>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => goal.id && archiveGoal(goal.id)}
                    >
                      Archive
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={isPending}
                      onClick={() => goal.id && deleteGoal(goal.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
