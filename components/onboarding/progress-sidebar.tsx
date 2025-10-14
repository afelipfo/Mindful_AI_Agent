"use client"

import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  title: string
  status: "completed" | "active" | "upcoming"
}

interface ProgressSidebarProps {
  currentStep: number
  steps: Step[]
}

export function ProgressSidebar({ currentStep, steps }: ProgressSidebarProps) {
  return (
    <div className="w-full md:w-[340px] border-r border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Getting to Know You</h2>
        <p className="text-sm text-text-secondary">Help us personalize your wellness journey</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Step {currentStep} of {steps.length}
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "rounded-lg border p-4 transition-all duration-300",
              step.status === "completed" && "border-success bg-success/5",
              step.status === "active" && "border-primary bg-primary/5",
              step.status === "upcoming" && "border-border bg-card",
            )}
          >
            <div className="flex items-center gap-3">
              {step.status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex-shrink-0",
                    step.status === "active" ? "border-primary bg-primary" : "border-muted",
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  step.status === "completed" && "text-success",
                  step.status === "active" && "text-primary",
                  step.status === "upcoming" && "text-text-muted",
                )}
              >
                {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
