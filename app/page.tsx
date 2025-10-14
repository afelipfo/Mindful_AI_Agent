"use client"

import Link from "next/link"
import { Brain, Heart, Zap, TrendingUp, Mic, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { QuickMoodAnalyzer } from "@/components/check-in/quick-mood-analyzer"

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
                <Link href="/onboarding">Start full onboarding</Link>
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Multimodal Check-Ins</h3>
              <p className="text-text-secondary">
                Express yourself through text, voice notes, emojis, or photos. Choose what feels right in the moment.
              </p>
            </Card>

            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Mood Tracking</h3>
              <p className="text-text-secondary">
                Visualize your emotional patterns over time with beautiful charts and insights.
              </p>
            </Card>

            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Insights</h3>
              <p className="text-text-secondary">
                Get personalized recommendations based on your unique patterns and triggers.
              </p>
            </Card>

            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Energy Tracking</h3>
              <p className="text-text-secondary">
                Monitor your energy levels throughout the day and discover your peak performance times.
              </p>
            </Card>

            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-danger/10">
                <Heart className="h-6 w-6 text-danger" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Wellness Goals</h3>
              <p className="text-text-secondary">
                Set and track progress toward your mental health goals with actionable steps.
              </p>
            </Card>

            <Card className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Camera className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Trigger Analysis</h3>
              <p className="text-text-secondary">
                Identify patterns in what affects your mood and learn effective coping strategies.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 p-8 text-center md:p-12">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Start Your Wellness Journey Today</h2>
          <p className="mb-8 text-lg text-text-secondary">
            Join thousands of people improving their mental health with AI-powered insights.
          </p>
          <Button asChild size="lg">
            <Link href="/onboarding">Begin Your Journey</Link>
          </Button>
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
