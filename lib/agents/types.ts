// Shared types for the multi-agent system
import { z } from "zod"

// ============================================================================
// Agent State Schema - Core state management for LangGraph
// ============================================================================
export const AgentStateSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.date(),
    })
  ),
  context: z.record(z.unknown()).optional(),
  selectedTools: z.array(z.string()),
  executionTrace: z.array(
    z.object({
      agent: z.string(),
      tool: z.string().optional(),
      input: z.unknown(),
      output: z.unknown().optional(),
      status: z.enum(["pending", "running", "success", "failed"]),
      timestamp: z.date(),
    })
  ),
  metadata: z.record(z.unknown()).optional(),
})

export type AgentState = z.infer<typeof AgentStateSchema>

// ============================================================================
// Tool Definition - Dynamic tool registration
// ============================================================================
export interface ToolDefinition {
  name: string
  displayName: string
  description: string
  category: "analysis" | "recommendation" | "goal_management" | "resource_discovery"
  endpoint: string
  inputSchema: z.ZodSchema
  outputSchema: z.ZodSchema
  rateLimit: number
  isActive: boolean
}

// ============================================================================
// Execution Trace Entry - For observability
// ============================================================================
export interface ExecutionTraceEntry {
  sessionId: string
  userId: string
  agent: string
  tool?: string
  input: unknown
  output?: unknown
  status: "pending" | "running" | "success" | "failed"
  errorMessage?: string
  durationMs?: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// Agent Session - Session management
// ============================================================================
export interface AgentSession {
  id: string
  userId: string
  sessionType: "onboarding" | "goal_coaching" | "ad_hoc" | "command_palette"
  status: "active" | "completed" | "failed" | "timeout"
  context: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// ============================================================================
// Agent Configuration - Dynamic agent config from DB
// ============================================================================
export interface AgentConfiguration {
  agentName: string
  systemPrompt: string
  modelName: string
  temperature: number
  maxTokens: number
  isActive: boolean
  version: number
}

// ============================================================================
// Tool Execution Result
// ============================================================================
export interface ToolExecutionResult {
  tool: string
  output: unknown
  status: "success" | "failed"
  errorMessage?: string
  durationMs: number
}

// ============================================================================
// Planner Response - What the planner agent returns
// ============================================================================
export interface PlannerResponse {
  selectedTools: string[]
  rationale: string
  estimatedDurationMs: number
}

// ============================================================================
// Mood Analysis Tool Schemas
// ============================================================================
export const MoodAnalysisInputSchema = z.object({
  text: z.string().max(2000),
  emotions: z.array(z.string()).optional(),
  moodScore: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  context: z.string().max(600).optional(),
})

export const MoodAnalysisOutputSchema = z.object({
  detectedMood: z.string(),
  confidence: z.number(),
  emotions: z.array(z.string()),
  severity: z.enum(["low", "moderate", "high"]),
  triggers: z.array(z.string()),
  analysis: z.string(),
})

export type MoodAnalysisInput = z.infer<typeof MoodAnalysisInputSchema>
export type MoodAnalysisOutput = z.infer<typeof MoodAnalysisOutputSchema>

// ============================================================================
// Wellness Recommendations Tool Schemas
// ============================================================================
export const WellnessRecommendationInputSchema = z.object({
  mood: z.string(),
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10).optional(),
  preferences: z.record(z.unknown()).optional(),
  triggers: z.array(z.string()).optional(),
})

export const WellnessRecommendationOutputSchema = z.object({
  immediate: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timeEstimate: z.string(),
      actionType: z.string(),
    })
  ),
  shortTerm: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timeEstimate: z.string(),
    })
  ),
  longTerm: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timeEstimate: z.string(),
    })
  ),
})

export type WellnessRecommendationInput = z.infer<typeof WellnessRecommendationInputSchema>
export type WellnessRecommendationOutput = z.infer<typeof WellnessRecommendationOutputSchema>

// ============================================================================
// Goal Management Tool Schemas
// ============================================================================
export const GoalDraftInputSchema = z.object({
  goal: z.string().max(500),
  targetValue: z.number().min(0),
  unit: z.string().max(50),
  timelineWeeks: z.number().optional(),
})

export const GoalUpdateInputSchema = z.object({
  id: z.string().uuid(),
  currentValue: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
})

export const GoalOutputSchema = z.object({
  id: z.string().uuid(),
  goal: z.string(),
  progress: z.number(),
  targetValue: z.number(),
  currentValue: z.number(),
  unit: z.string(),
  isActive: z.boolean(),
})

export type GoalDraftInput = z.infer<typeof GoalDraftInputSchema>
export type GoalUpdateInput = z.infer<typeof GoalUpdateInputSchema>
export type GoalOutput = z.infer<typeof GoalOutputSchema>

// ============================================================================
// Resource Discovery Tool Schemas
// ============================================================================
export const ResourceDiscoveryInputSchema = z.object({
  mood: z.string(),
  resourceType: z.enum(["music", "book", "place", "professional", "all"]).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const ResourceDiscoveryOutputSchema = z.object({
  music: z
    .object({
      title: z.string(),
      artist: z.string(),
      reason: z.string(),
      spotifyUrl: z.string(),
      appleMusicUrl: z.string(),
    })
    .optional(),
  book: z
    .object({
      title: z.string(),
      author: z.string(),
      relevance: z.string(),
      amazonUrl: z.string(),
      coverUrl: z.string().optional(),
    })
    .optional(),
  place: z
    .object({
      type: z.string(),
      reason: z.string(),
      benefits: z.string(),
      address: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
})

export type ResourceDiscoveryInput = z.infer<typeof ResourceDiscoveryInputSchema>
export type ResourceDiscoveryOutput = z.infer<typeof ResourceDiscoveryOutputSchema>

// ============================================================================
// User Insights Tool Schemas
// ============================================================================
export const UserInsightsInputSchema = z.object({
  userId: z.string().uuid(),
  timeframe: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
  moodHistory: z.array(z.unknown()).optional(),
})

export const UserInsightsOutputSchema = z.object({
  summary: z.object({
    avgMood: z.number(),
    avgEnergy: z.number(),
    totalEntries: z.number(),
    moodTrend: z.enum(["improving", "stable", "declining"]),
  }),
  patterns: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      frequency: z.string(),
    })
  ),
  triggers: z.array(
    z.object({
      trigger: z.string(),
      count: z.number(),
      impact: z.enum(["high", "medium", "low"]),
    })
  ),
  recommendations: z.array(z.string()),
})

export type UserInsightsInput = z.infer<typeof UserInsightsInputSchema>
export type UserInsightsOutput = z.infer<typeof UserInsightsOutputSchema>

// ============================================================================
// Command Palette Command Schema
// ============================================================================
export const CommandPaletteCommandSchema = z.object({
  command: z.string(),
  args: z.record(z.unknown()).optional(),
  userId: z.string().uuid(),
})

export type CommandPaletteCommand = z.infer<typeof CommandPaletteCommandSchema>

// ============================================================================
// Agent Response Schema - Standardized response format
// ============================================================================
export interface AgentResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  sessionId: string
  executionTimeMs: number
  metadata?: Record<string, unknown>
}
