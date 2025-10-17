"use client"

import { memo, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Lightbulb, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIInsight } from "@/types/wellness"

interface InsightCardProps {
  insight: AIInsight
  onDismiss?: (insight: AIInsight) => Promise<void> | void
  onViewRecommendations?: () => void
}

export const InsightCard = memo(function InsightCard({ insight, onDismiss, onViewRecommendations }: InsightCardProps) {
  const [isPending, startTransition] = useTransition()

  const getIcon = () => {
    switch (insight.type) {
      case "pattern":
        return <Brain className="h-6 w-6" />
      case "recommendation":
        return <Lightbulb className="h-6 w-6" />
      case "alert":
        return <AlertTriangle className="h-6 w-6" />
    }
  }

  const getBorderColor = () => {
    switch (insight.type) {
      case "pattern":
        return "border-l-primary"
      case "recommendation":
        return "border-l-success"
      case "alert":
        return "border-l-warning"
    }
  }

  const getIconColor = () => {
    switch (insight.type) {
      case "pattern":
        return "text-primary"
      case "recommendation":
        return "text-success"
      case "alert":
        return "text-warning"
    }
  }

  return (
    <Card className={cn("border-l-4 transition-all duration-300", getBorderColor())}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn("flex-shrink-0 mt-1", getIconColor())}>{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-2">{insight.title}</h3>
            <div className="text-sm text-text-secondary leading-relaxed">
              {insight.description}
            </div>
            <div className="mt-4 flex gap-2">
              {onViewRecommendations && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(() => {
                      onViewRecommendations()
                    })
                  }}
                >
                  View Recommendations
                </Button>
              )}
              <Button
                size="sm"
                variant={insight.isRead ? "secondary" : "ghost"}
                disabled={isPending || insight.isRead}
                onClick={() => {
                  if (!onDismiss || insight.isRead) return
                  startTransition(async () => {
                    await onDismiss(insight)
                  })
                }}
              >
                {insight.isRead ? "Done" : "Dismiss"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
})
