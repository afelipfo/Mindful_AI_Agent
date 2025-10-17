import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      authenticated: !!session,
      user: session?.user || null,
      session: session ? {
        expires: session.expires,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      } : null,
      timestamp: new Date().toISOString(),
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get session",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
