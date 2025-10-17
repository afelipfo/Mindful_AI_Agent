import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { professionalName, professionalSpecialty, userContext } = body

    if (!professionalName || !professionalSpecialty) {
      return NextResponse.json(
        { error: "Professional name and specialty are required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[mindful-ai] Missing OPENAI_API_KEY")
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const userName = session.user.name || "User"
    const userEmail = session.user.email || ""

    const prompt = `You are a compassionate assistant helping a user reach out to a mental health professional.

Generate a professional, warm, and respectful introductory message for ${userName} to send to ${professionalName}, a ${professionalSpecialty}.

The message should:
- Be concise (3-4 sentences)
- Express genuine interest in scheduling an initial consultation
- Briefly mention they're seeking support (without oversharing)
- Request information about availability and next steps
- Be written in first person from ${userName}'s perspective
- Sound natural and authentic, not overly formal

${userContext ? `User context: ${userContext}` : ""}

Generate only the message text, no subject line or greeting. The message should start directly with the content.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a compassionate mental health communication assistant. Generate warm, professional messages for users reaching out to mental health professionals.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[mindful-ai] OpenAI API error:", errorData)
      throw new Error("Failed to generate contact message")
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content?.trim()

    if (!message) {
      throw new Error("No message generated")
    }

    return NextResponse.json({
      message,
      userName,
      userEmail,
    })
  } catch (error) {
    console.error("[mindful-ai] Error generating contact message:", error)
    return NextResponse.json(
      { error: "Failed to generate contact message" },
      { status: 500 }
    )
  }
}
