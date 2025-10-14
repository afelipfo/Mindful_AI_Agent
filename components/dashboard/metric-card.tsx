import type React from "react"
import { memo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    direction: "up" | "down"
    value: string
    isPositive: boolean
  }
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const MetricCard = memo(function MetricCard({ title, value, trend, icon, children }: MetricCardProps) {
  return (
    <Card className="p-6 shadow-sm transition-shadow duration-200 ease-[var(--ease-hover)] hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      <div className="mb-2">
        <div className="text-4xl font-bold text-text-primary">{value}</div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-sm">
          {trend.direction === "up" ? (
            <TrendingUp className={cn("h-4 w-4", trend.isPositive ? "text-success" : "text-danger")} />
          ) : (
            <TrendingDown className={cn("h-4 w-4", trend.isPositive ? "text-success" : "text-danger")} />
          )}
          <span className={cn(trend.isPositive ? "text-success" : "text-danger")}>{trend.value}</span>
          <span className="text-text-muted">vs last week</span>
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </Card>
  )
})
