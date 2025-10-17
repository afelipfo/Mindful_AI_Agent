import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"

// Mock message store - in production this would be a database
const messageStore: Record<string, Array<{ id: string; senderId: string; senderName: string; content: string; timestamp: string; isFromUser: boolean }>> = {}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationKey = `${session.user.id}-${id}`
    const messages = messageStore[conversationKey] || []

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[mindful-ai] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const conversationKey = `${session.user.id}-${id}`
    if (!messageStore[conversationKey]) {
      messageStore[conversationKey] = []
    }

    const userMessage = {
      id: crypto.randomUUID(),
      senderId: session.user.id,
      senderName: session.user.name || "You",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isFromUser: true,
    }

    messageStore[conversationKey].push(userMessage)

    // Simulate professional response after 1-3 seconds
    setTimeout(() => {
      const professionalResponses = [
        "Thank you for reaching out. I'd be happy to discuss how I can support you. When would be a good time for an initial consultation?",
        "I appreciate you sharing this with me. Let's schedule a time to talk more about what you're experiencing and how we can work together.",
        "I'm here to help. Based on what you've shared, I think we could explore some effective strategies together. Would you like to schedule a session?",
        "Thank you for your message. I specialize in this area and would be glad to support you. Let's find a time that works for both of us.",
      ]

      const professionalMessage = {
        id: crypto.randomUUID(),
        senderId: id,
        senderName: "Professional",
        content: professionalResponses[Math.floor(Math.random() * professionalResponses.length)],
        timestamp: new Date().toISOString(),
        isFromUser: false,
      }

      messageStore[conversationKey].push(professionalMessage)
    }, 1000 + Math.random() * 2000)

    return NextResponse.json({ message: userMessage })
  } catch (error) {
    console.error("[mindful-ai] Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
