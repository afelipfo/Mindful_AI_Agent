"use client"

import Link from "next/link"
import { Brain, Heart, Zap, TrendingUp, Mic, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { QuickMoodAnalyzer } from "@/components/check-in/quick-mood-analyzer"
import type { ReactNode } from "react"

interface TimelineItemProps {
  step: string
  icon: ReactNode
  title: string
  description: string
}

function Timeline({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-4xl space-y-10 md:space-y-12">
      <div className="absolute left-[22px] top-4 hidden h-[calc(100%-2rem)] w-px bg-border md:block" />
      {children}
    </div>
  )
}

function TimelineItem({ step, icon, title, description }: TimelineItemProps) {
  return (
    <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
      <div className="flex items-center gap-3 md:min-w-[160px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm">
          {icon}
        </div>
        <div className="md:hidden">
          <p className="text-xs uppercase tracking-wide text-primary/70">{step}</p>
          <p className="text-base font-semibold leading-tight">{title}</p>
        </div>
      </div>
      <div className="md:mt-1">
        <p className="hidden text-xs uppercase tracking-widest text-primary/70 md:block">{step}</p>
        <h3 className="mb-2 hidden text-lg font-semibold md:block">{title}</h3>
        <p className="text-sm text-text-secondary md:text-base">{description}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="mx-auto max-w-xl text-center lg:text-left">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-fade-in">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl animate-fade-in [animation-delay:100ms]">
              Your AI-Powered Mental Wellness Companion
            </h1>
            <p className="mb-8 text-pretty text-lg text-text-secondary md:text-xl animate-fade-in [animation-delay:200ms]">
              Track your emotional states through multimodal inputs and receive personalized insights to improve your
              mental wellbeing.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 animate-fade-in [animation-delay:300ms] lg:items-start lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto">
                <Link href="/auth/signin?callbackUrl=%2Fonboarding" prefetch={false}>
                  Start full onboarding
                </Link>
              </Button>
              <p className="text-sm text-text-muted">Prefer a faster check-in? Try the analyzer alongside.</p>
            </div>
          </div>
          <QuickMoodAnalyzer className="animate-fade-in [animation-delay:300ms]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything You Need for Mental Wellness</h2>
            <p className="text-lg text-text-secondary">
              Comprehensive tools to understand and improve your emotional health
            </p>
          </div>

          <Timeline>
            <TimelineItem
              step="Step 1"
              icon={<Mic className="h-5 w-5" />}
              title="Multimodal Check-Ins"
              description="Express yourself through text, voice notes, emojis, or photos. Choose what feels right in the moment."
            />
            <TimelineItem
              step="Step 2"
              icon={<TrendingUp className="h-5 w-5" />}
              title="Mood Tracking"
              description="Visualize your emotional patterns over time with beautiful charts and insights."
            />
            <TimelineItem
              step="Step 3"
              icon={<Brain className="h-5 w-5" />}
              title="AI Insights"
              description="Get personalized recommendations based on your unique patterns and triggers."
            />
            <TimelineItem
              step="Step 4"
              icon={<Zap className="h-5 w-5" />}
              title="Energy Tracking"
              description="Monitor your energy levels throughout the day and discover your peak performance times."
            />
            <TimelineItem
              step="Step 5"
              icon={<Heart className="h-5 w-5" />}
              title="Wellness Goals"
              description="Set and track progress toward your mental health goals with actionable steps."
            />
            <TimelineItem
              step="Step 6"
              icon={<Camera className="h-5 w-5" />}
              title="Trigger Analysis"
              description="Identify patterns in what affects your mood and learn effective coping strategies."
            />
          </Timeline>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-text-muted md:px-6">
          <p>&copy; 2025 Mindful AI Agent. Your mental wellness companion.</p>
        </div>
      </footer>
    </div>
  )
}
