// Execution trace storage and retrieval
import { createServerClient } from "@/lib/supabase/server"
import type { ExecutionTraceEntry, AgentSession } from "./types"

// ============================================================================
// Save Execution Trace
// ============================================================================
export async function saveExecutionTrace(trace: ExecutionTraceEntry): Promise<void> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("execution_traces").insert({
      session_id: trace.sessionId,
      user_id: trace.userId,
      agent: trace.agent,
      tool: trace.tool,
      input: trace.input,
      output: trace.output,
      status: trace.status,
      error_message: trace.errorMessage,
      duration_ms: trace.durationMs,
      timestamp: trace.timestamp.toISOString(),
      metadata: trace.metadata,
    })

    if (error) {
      console.error("[TraceStore] Failed to save execution trace:", error)
      // Don't throw - tracing failures shouldn't break agent execution
    }
  } catch (err) {
    console.error("[TraceStore] Exception saving trace:", err)
  }
}

// ============================================================================
// Get Session Traces
// ============================================================================
export async function getSessionTraces(
  sessionId: string,
  userId: string
): Promise<ExecutionTraceEntry[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("execution_traces")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("[TraceStore] Failed to load session traces:", error)
      return []
    }

    return (
      data?.map((row) => ({
        sessionId: row.session_id,
        userId: row.user_id,
        agent: row.agent,
        tool: row.tool,
        input: row.input,
        output: row.output,
        status: row.status as "pending" | "running" | "success" | "failed",
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        timestamp: new Date(row.timestamp),
        metadata: row.metadata,
      })) || []
    )
  } catch (err) {
    console.error("[TraceStore] Exception loading traces:", err)
    return []
  }
}

// ============================================================================
// Get User Traces (all sessions)
// ============================================================================
export async function getUserTraces(
  userId: string,
  limit: number = 50
): Promise<ExecutionTraceEntry[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("execution_traces")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[TraceStore] Failed to load user traces:", error)
      return []
    }

    return (
      data?.map((row) => ({
        sessionId: row.session_id,
        userId: row.user_id,
        agent: row.agent,
        tool: row.tool,
        input: row.input,
        output: row.output,
        status: row.status as "pending" | "running" | "success" | "failed",
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        timestamp: new Date(row.timestamp),
        metadata: row.metadata,
      })) || []
    )
  } catch (err) {
    console.error("[TraceStore] Exception loading user traces:", err)
    return []
  }
}

// ============================================================================
// Create Agent Session
// ============================================================================
export async function createAgentSession(
  userId: string,
  sessionType: "onboarding" | "goal_coaching" | "ad_hoc" | "command_palette",
  context: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("agent_sessions")
      .insert({
        user_id: userId,
        session_type: sessionType,
        status: "active",
        context,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[TraceStore] Failed to create agent session:", error)
      return null
    }

    return data.id
  } catch (err) {
    console.error("[TraceStore] Exception creating session:", err)
    return null
  }
}

// ============================================================================
// Update Agent Session Status
// ============================================================================
export async function updateAgentSessionStatus(
  sessionId: string,
  status: "active" | "completed" | "failed" | "timeout"
): Promise<void> {
  try {
    const supabase = createServerClient()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("agent_sessions")
      .update(updateData)
      .eq("id", sessionId)

    if (error) {
      console.error("[TraceStore] Failed to update session status:", error)
    }
  } catch (err) {
    console.error("[TraceStore] Exception updating session:", err)
  }
}

// ============================================================================
// Get Agent Session
// ============================================================================
export async function getAgentSession(
  sessionId: string,
  userId: string
): Promise<AgentSession | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[TraceStore] Failed to load agent session:", error)
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type as
        | "onboarding"
        | "goal_coaching"
        | "ad_hoc"
        | "command_palette",
      status: data.status as "active" | "completed" | "failed" | "timeout",
      context: data.context,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    }
  } catch (err) {
    console.error("[TraceStore] Exception loading session:", err)
    return null
  }
}

// ============================================================================
// Get User Active Sessions
// ============================================================================
export async function getUserActiveSessions(userId: string): Promise<AgentSession[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[TraceStore] Failed to load active sessions:", error)
      return []
    }

    return (
      data?.map((row) => ({
        id: row.id,
        userId: row.user_id,
        sessionType: row.session_type as
          | "onboarding"
          | "goal_coaching"
          | "ad_hoc"
          | "command_palette",
        status: row.status as "active" | "completed" | "failed" | "timeout",
        context: row.context,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      })) || []
    )
  } catch (err) {
    console.error("[TraceStore] Exception loading active sessions:", err)
    return []
  }
}

// ============================================================================
// Get Agent Performance Stats
// ============================================================================
export interface AgentPerformanceStats {
  agent: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgDurationMs: number
  p95DurationMs: number
  lastExecution: Date
}

export async function getAgentPerformanceStats(
  userId: string
): Promise<AgentPerformanceStats[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("agent_performance_summary")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("[TraceStore] Failed to load performance stats:", error)
      return []
    }

    return (
      data?.map((row) => ({
        agent: row.agent,
        totalExecutions: row.total_executions,
        successfulExecutions: row.successful_executions,
        failedExecutions: row.failed_executions,
        avgDurationMs: row.avg_duration_ms,
        p95DurationMs: row.p95_duration_ms,
        lastExecution: new Date(row.last_execution),
      })) || []
    )
  } catch (err) {
    console.error("[TraceStore] Exception loading performance stats:", err)
    return []
  }
}
