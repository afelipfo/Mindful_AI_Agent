"use client"

import { Command } from "cmdk"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Target,
  Sparkles,
  Book,
  Music,
  MapPin,
  TrendingUp,
  Loader2,
  Flame,
  ListChecks,
} from "lucide-react"
import { toast } from "sonner"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  async function handleCommand(command: string, args?: Record<string, unknown>) {
    if (!session?.user?.id) {
      toast.error("Please sign in to use commands")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          args: { ...args, text: search },
          userId: session.user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Command execution failed")
      }

      const result = await response.json()

      // Show success message
      if (result.success) {
        toast.success("Command executed successfully!")

        // Handle different result types
        if (result.data?.message) {
          toast.info(result.data.message)
        }
      }

      onOpenChange(false)
      setSearch("")
    } catch (error) {
      console.error("Command error:", error)
      toast.error("Failed to execute command. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Agent Command Palette"
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          <Sparkles className="h-4 w-4 text-gray-400 mr-2" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="What would you like to do?"
            className="flex-1 border-0 py-3 text-base focus:outline-none focus:ring-0 bg-transparent"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No commands found. Try typing something else.
          </Command.Empty>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Processing...</span>
            </div>
          ) : (
            <>
              <Command.Group heading="Goal Management">
                <Command.Item
                  onSelect={() => handleCommand("draft_goal")}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <Target className="h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Create a new goal</span>
                    <span className="text-xs text-gray-500">
                      Set a wellness target with AI guidance
                    </span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleCommand("track_goals")}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Track progress</span>
                    <span className="text-xs text-gray-500">
                      View all goals and insights
                    </span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleCommand("celebrate_goal")}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Celebrate achievement</span>
                    <span className="text-xs text-gray-500">
                      Mark a goal as completed
                    </span>
                  </div>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-2 border-t border-gray-200 dark:border-gray-700" />

              <Command.Group heading="Wellness Resources">
                <Command.Item
                  onSelect={() =>
                    handleCommand("fetch_resources", { resourceType: "music" })
                  }
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <Music className="h-4 w-4 text-purple-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Find calming music</span>
                    <span className="text-xs text-gray-500">
                      Mood-based playlist recommendations
                    </span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    handleCommand("fetch_resources", { resourceType: "book" })
                  }
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <Book className="h-4 w-4 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Recommend a book</span>
                    <span className="text-xs text-gray-500">
                      Mental wellness reading suggestions
                    </span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    handleCommand("fetch_resources", { resourceType: "place" })
                  }
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <MapPin className="h-4 w-4 text-red-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Find nearby wellness spots</span>
                    <span className="text-xs text-gray-500">
                      Parks, cafes, quiet places
                    </span>
                  </div>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-2 border-t border-gray-200 dark:border-gray-700" />

              <Command.Group heading="AI Analysis">
                <Command.Item
                  onSelect={() => handleCommand("analyze_mood")}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Analyze my mood</span>
                    <span className="text-xs text-gray-500">
                      Get personalized insights from your message
                    </span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleCommand("generate_insights")}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                >
                  <ListChecks className="h-4 w-4 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Generate insights</span>
                    <span className="text-xs text-gray-500">
                      Analyze patterns from your mood history
                    </span>
                  </div>
                </Command.Item>
              </Command.Group>
            </>
          )}
        </Command.List>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Press Esc to close</span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
              ⌘K
            </kbd>
            to open
          </span>
        </div>
      </Command.Dialog>
    </>
  )
}
