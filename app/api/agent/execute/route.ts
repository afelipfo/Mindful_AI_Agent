import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { invokePlannerAgent } from "@/lib/agents/planner-agent"
import { goalCoachAgent } from "@/lib/agents/goal-coach-agent"
import { createAgentSession, updateAgentSessionStatus } from "@/lib/agents/trace-store"

// ============================================================================
// POST /api/agent/execute - Execute agent command from command palette
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { command, args, userId } = await req.json()

    // Validate user ID matches session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 })
    }

    console.log(`[AgentAPI] Command: ${command}, User: ${userId}`)

    // Create agent session
    const sessionId = await createAgentSession(userId, "command_palette", {
      command,
      args,
    })

    if (!sessionId) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    const startTime = Date.now()
    let result: unknown

    // Route to appropriate agent
    try {
      switch (command) {
        // ====================================================================
        // Goal Management Commands
        // ====================================================================
        case "draft_goal":
          result = await goalCoachAgent(
            {
              sessionId,
              userId,
              messages: [{ role: "user", content: args.text || "", timestamp: new Date() }],
              selectedTools: [],
              executionTrace: [],
              context: args,
            },
            {
              action: "draft",
              goalText: args.text,
              targetValue: args.targetValue,
              unit: args.unit,
            }
          )
          break

        case "update_goal":
          result = await goalCoachAgent(
            {
              sessionId,
              userId,
              messages: [{ role: "user", content: args.text || "", timestamp: new Date() }],
              selectedTools: [],
              executionTrace: [],
              context: args,
            },
            {
              action: "update",
              goalId: args.goalId,
              currentProgress: args.currentProgress,
            }
          )
          break

        case "track_goals":
          result = await goalCoachAgent(
            {
              sessionId,
              userId,
              messages: [
                { role: "user", content: "Show me my goals progress", timestamp: new Date() },
              ],
              selectedTools: [],
              executionTrace: [],
              context: args,
            },
            {
              action: "track",
            }
          )
          break

        case "celebrate_goal":
          result = await goalCoachAgent(
            {
              sessionId,
              userId,
              messages: [
                { role: "user", content: args.text || "I completed my goal!", timestamp: new Date() },
              ],
              selectedTools: [],
              executionTrace: [],
              context: args,
            },
            {
              action: "celebrate",
              goalText: args.text,
            }
          )
          break

        // ====================================================================
        // Analysis & Resource Commands (use planner agent)
        // ====================================================================
        case "analyze_mood":
        case "fetch_resources":
        case "generate_insights":
          result = await invokePlannerAgent(
            sessionId,
            userId,
            args.text || command.replace("_", " "),
            args
          )
          break

        default:
          await updateAgentSessionStatus(sessionId, "failed")
          return NextResponse.json({ error: "Unknown command" }, { status: 400 })
      }

      // Mark session as completed
      await updateAgentSessionStatus(sessionId, "completed")

      const executionTimeMs = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: result,
        sessionId,
        executionTimeMs,
      })
    } catch (error) {
      console.error(`[AgentAPI] Command ${command} failed:`, error)

      // Mark session as failed
      await updateAgentSessionStatus(sessionId, "failed")

      return NextResponse.json(
        {
          success: false,
          error: "Agent execution failed",
          details: (error as Error).message,
          sessionId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[AgentAPI] Request error:", error)
    return NextResponse.json(
      { error: "Invalid request", details: (error as Error).message },
      { status: 400 }
    )
  }
}

// ============================================================================
// GET /api/agent/execute - Get agent execution history
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Import here to avoid circular dependencies
    const { getUserActiveSessions } = await import("@/lib/agents/trace-store")

    const activeSessions = await getUserActiveSessions(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        activeSessions,
        count: activeSessions.length,
      },
    })
  } catch (error) {
    console.error("[AgentAPI] Failed to fetch sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch agent sessions" },
      { status: 500 }
    )
  }
}
