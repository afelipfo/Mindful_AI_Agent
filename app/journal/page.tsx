"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface JournalEntry {
  id: string
  content: string
  mood: number
  energy: number
  date: string
  createdAt: string
}

export default function JournalPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent("/journal")
      router.replace(`/auth/signin?callbackUrl=${callbackUrl}`)
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      loadRecentEntries()
    }
  }, [status])

  const loadRecentEntries = async () => {
    try {
      setIsLoadingEntries(true)
      const response = await fetch("/api/journal", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setRecentEntries(data.entries || [])
      }
    } catch (error) {
      console.error("[mindful-ai] Failed to load journal entries:", error)
    } finally {
      setIsLoadingEntries(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write something before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Journal saved!",
          description: "Your reflection has been recorded.",
        })
        setContent("")
        await loadRecentEntries()
      } else {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to save journal entry")
      }
    } catch (error) {
      console.error("[mindful-ai] Failed to save journal:", error)
      toast({
        title: "Unable to save",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="border-b border-border p-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/onboarding">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold">Journaling</h1>
          </div>
          <p className="text-base text-text-muted">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's Reflection</h2>
            <Button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Entry"}
            </Button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How are you feeling today? What's on your mind? Write freely about your thoughts, emotions, and experiences..."
            className="w-full min-h-[300px] p-4 rounded-md border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            disabled={isSaving}
          />

          <div className="mt-4 flex items-start gap-2 text-sm text-text-secondary">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Writing helps process emotions and gain clarity. Your entries are private and can help you track patterns over time.
            </p>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>

          {isLoadingEntries ? (
            <div className="text-center py-8 text-text-muted">
              Loading your entries...
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <Card key={entry.id} className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">
                      {format(new Date(entry.date), "MMMM d, yyyy")}
                    </span>
                    <span className="text-xs text-text-muted">
                      {format(new Date(entry.createdAt), "h:mm a")}
                    </span>
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-muted" />
              <p className="text-text-secondary">
                No journal entries yet. Start writing to begin your journaling journey!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
