import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

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

    const { id: professionalId } = await params

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    const { data, error } = await supabase
      .from("professional_messages")
      .select("id, sender_id, sender_name, content, is_from_user, created_at")
      .eq("user_id", session.user.id)
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[mindful-ai] Error fetching messages from database:", error)
      throw error
    }

    // Map database fields to match expected API response format
    const messages = (data ?? []).map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      content: msg.content,
      timestamp: msg.created_at,
      isFromUser: msg.is_from_user,
    }))

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

    const { id: professionalId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    // Insert user message into database
    const { data: userMessageData, error: userMessageError } = await supabase
      .from("professional_messages")
      .insert({
        user_id: session.user.id,
        professional_id: professionalId,
        sender_id: session.user.id,
        sender_name: session.user.name || "You",
        content: content.trim(),
        is_from_user: true,
      })
      .select("id, sender_id, sender_name, content, is_from_user, created_at")
      .single()

    if (userMessageError) {
      console.error("[mindful-ai] Error saving user message:", userMessageError)
      throw userMessageError
    }

    const userMessage = {
      id: userMessageData.id,
      senderId: userMessageData.sender_id,
      senderName: userMessageData.sender_name,
      content: userMessageData.content,
      timestamp: userMessageData.created_at,
      isFromUser: userMessageData.is_from_user,
    }

    // Simulate professional response after 1-3 seconds (async, no await)
    setTimeout(async () => {
      const professionalResponses = [
        "Thank you for reaching out. I'd be happy to discuss how I can support you. When would be a good time for an initial consultation?",
        "I appreciate you sharing this with me. Let's schedule a time to talk more about what you're experiencing and how we can work together.",
        "I'm here to help. Based on what you've shared, I think we could explore some effective strategies together. Would you like to schedule a session?",
        "Thank you for your message. I specialize in this area and would be glad to support you. Let's find a time that works for both of us.",
      ]

      try {
        await supabase
          .from("professional_messages")
          .insert({
            user_id: session.user.id,
            professional_id: professionalId,
            sender_id: professionalId,
            sender_name: "Professional",
            content: professionalResponses[Math.floor(Math.random() * professionalResponses.length)],
            is_from_user: false,
          })
      } catch (error) {
        console.error("[mindful-ai] Error saving professional response:", error)
      }
    }, 1000 + Math.random() * 2000)

    return NextResponse.json({ message: userMessage })
  } catch (error) {
    console.error("[mindful-ai] Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
