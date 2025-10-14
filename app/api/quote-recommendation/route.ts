import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { detectedMood } = await request.json()

    // Mood to tags mapping
    const moodTags: Record<string, string> = {
      anxious: "courage|wisdom|peace",
      happy: "happiness|success|life",
      sad: "adversity|healing|hope",
      tired: "self|rest|patience",
      stressed: "wisdom|peace|perseverance",
      excited: "inspirational|success|opportunity",
    }

    const tags = moodTags[detectedMood] || moodTags.anxious

    // Call Quotable API
    const response = await fetch(`https://api.quotable.io/quotes/random?tags=${tags}&maxLength=150`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch quote")
    }

    const data = await response.json()
    const quote = data[0]

    if (!quote) {
      throw new Error("No quote found")
    }

    return NextResponse.json({
      text: quote.content,
      author: quote.author,
    })
  } catch (error) {
    console.error("[v0] Quote recommendation error:", error)

    // Fallback quotes
    const fallbacks: Record<string, any> = {
      anxious: {
        text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
        author: "A.A. Milne",
      },
      happy: {
        text: "Happiness is not by chance, but by choice.",
        author: "Jim Rohn",
      },
      sad: {
        text: "The wound is the place where the light enters you.",
        author: "Rumi",
      },
      tired: {
        text: "Almost everything will work again if you unplug it for a few minutes, including you.",
        author: "Anne Lamott",
      },
      stressed: {
        text: "You can't calm the storm, so stop trying. What you can do is calm yourself. The storm will pass.",
        author: "Timber Hawkeye",
      },
      excited: {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
    }

    const body = await request.json()
    return NextResponse.json(fallbacks[body.detectedMood] || fallbacks.anxious)
  }
}
