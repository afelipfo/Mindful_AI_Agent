"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"

interface SymptomRatingInputProps {
  onSubmit: (ratings: {
    anxiety: number
    sadness: number
    stress: number
    loneliness: number
    suicideTrends: number
  }) => void
  isLoading?: boolean
}

export function SymptomRatingInput({ onSubmit, isLoading = false }: SymptomRatingInputProps) {
  const [ratings, setRatings] = useState({
    anxiety: 0,
    sadness: 0,
    stress: 0,
    loneliness: 0,
    suicideTrends: 0,
  })

  const [errors, setErrors] = useState({
    anxiety: false,
    sadness: false,
    stress: false,
    loneliness: false,
    suicideTrends: false,
  })

  const handleChange = (symptom: keyof typeof ratings, value: string) => {
    const numValue = parseInt(value, 10)

    // Validate range 0-5
    if (value === "" || (numValue >= 0 && numValue <= 5)) {
      setRatings((prev) => ({ ...prev, [symptom]: value === "" ? 0 : numValue }))
      setErrors((prev) => ({ ...prev, [symptom]: false }))
    } else {
      setErrors((prev) => ({ ...prev, [symptom]: true }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all inputs are within range
    const hasErrors = Object.values(errors).some((error) => error)
    if (hasErrors) {
      return
    }

    onSubmit(ratings)
  }

  const symptoms = [
    { key: "anxiety" as const, label: "Anxiety" },
    { key: "sadness" as const, label: "Sadness" },
    { key: "stress" as const, label: "Stress" },
    { key: "loneliness" as const, label: "Loneliness" },
    { key: "suicideTrends" as const, label: "Suicide trends" },
  ]

  return (
    <Card className="border-2 border-primary/20 bg-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">Rate each symptom</h3>
          <p className="text-sm text-text-muted">
            How often have you experienced these symptoms over the past two weeks?
          </p>
          <p className="text-xs text-text-secondary">
            0 = Not at all • 5 = Nearly every day
          </p>
        </div>

        <div className="space-y-4">
          {symptoms.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key} className="flex-1 text-sm font-medium text-text-primary">
                {label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={key}
                  type="number"
                  min="0"
                  max="5"
                  value={ratings[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-20 text-center ${errors[key] ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <span className="text-xs text-text-muted">/5</span>
              </div>
            </div>
          ))}
        </div>

        {Object.values(errors).some((error) => error) && (
          <p className="text-sm text-destructive">Please enter values between 0 and 5</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          <Send className="mr-2 h-4 w-4" />
          Submit Ratings
        </Button>
      </form>
    </Card>
  )
}
