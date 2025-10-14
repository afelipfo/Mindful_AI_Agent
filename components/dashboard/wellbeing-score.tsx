"use client"

import { cn } from "@/lib/utils"

interface WellbeingScoreProps {
  score: number // 0-100
}

export function WellbeingScore({ score }: WellbeingScoreProps) {
  const getGrade = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  const getColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-danger"
  }

  const grade = getGrade(score)
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative h-48 w-48">
        <svg className="h-full w-full -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            fill="none"
            className="opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke={score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--warning))" : "hsl(var(--danger))"}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-5xl font-bold", getColor(score))}>{grade}</div>
          <div className="text-sm text-text-muted">{score}/100</div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-text-secondary">Overall Wellbeing Score</p>
    </div>
  )
}
