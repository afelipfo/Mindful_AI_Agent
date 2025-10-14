"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Lightbulb, AlertTriangle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIInsight } from "@/lib/sample-data"

interface InsightCardProps {
  insight: AIInsight
}

export function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
            <div
              className={cn(
                "text-sm text-text-secondary leading-relaxed transition-all duration-300",
                !isExpanded && "line-clamp-2",
              )}
            >
              {insight.description}
            </div>
            {insight.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
              >
                {isExpanded ? "Show less" : "Read more"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
              </button>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">
                {insight.action}
              </Button>
              <Button size="sm" variant="ghost">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
