import { type NextRequest, NextResponse } from "next/server"

interface OpenLibraryDoc {
  cover_i?: number
  author_name?: string[]
  ratings_average?: number
  title: string
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[]
}

export async function POST(request: NextRequest) {
  const parsedBody: Partial<{ detectedMood: string }> = await request
    .json()
    .catch(() => ({ detectedMood: "anxious" }))

  const detectedMoodKey = parsedBody.detectedMood ?? "anxious"

  try {

    // Mood to subject mapping
    const moodSubjects: Record<string, string[]> = {
      anxious: ["anxiety", "mindfulness", "cognitive behavioral therapy"],
      happy: ["joy", "gratitude", "positive psychology"],
      sad: ["depression", "resilience", "healing"],
      tired: ["rest", "sleep", "burnout recovery"],
      stressed: ["stress relief", "meditation", "mental health"],
      excited: ["motivation", "creativity", "personal growth"],
    }

    const subjects = moodSubjects[detectedMoodKey] || moodSubjects.anxious
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]

    // Call Open Library API
    const response = await fetch(
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(randomSubject)}&limit=20&sort=rating`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch books")
    }

    const data = (await response.json()) as OpenLibraryResponse

    // Filter quality books with covers and good ratings
    const qualityBooks = data.docs.filter((book) =>
      Boolean(book.cover_i && book.author_name?.length && book.ratings_average && book.ratings_average >= 3.8),
    )

    if (qualityBooks.length === 0) {
      throw new Error("No quality books found")
    }

    const book = qualityBooks[Math.floor(Math.random() * Math.min(5, qualityBooks.length))]

    return NextResponse.json({
      title: book.title,
      author: book.author_name![0],
      relevance: `Recommended for ${randomSubject} - rated ${book.ratings_average!.toFixed(1)}/5`,
      amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`,
      coverUrl: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
    })
  } catch (error) {
    console.error("[v0] Book recommendation error:", error)

    // Fallback recommendations
    const fallbacks: Record<string, { title: string; author: string; relevance: string; amazonUrl: string }> = {
      anxious: {
        title: "The Anxiety and Phobia Workbook",
        author: "Edmund Bourne",
        relevance: "Practical CBT techniques for managing anxiety",
        amazonUrl: "https://www.amazon.com/s?k=The+Anxiety+and+Phobia+Workbook",
      },
      happy: {
        title: "The Book of Joy",
        author: "Dalai Lama",
        relevance: "Deepens appreciation for joy and happiness",
        amazonUrl: "https://www.amazon.com/s?k=The+Book+of+Joy",
      },
    }

    return NextResponse.json(fallbacks[detectedMoodKey] ?? fallbacks.anxious)
  }
}
