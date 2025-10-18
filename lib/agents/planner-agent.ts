// Planner Agent - Dynamic tool selection using LangGraph
import { ChatOpenAI } from "@langchain/openai"
import { StateGraph, type StateGraphArgs } from "@langchain/langgraph"
import type { AgentState, PlannerResponse } from "./types"
import {
  loadToolRegistry,
  executeTool,
  getToolDescriptionsForPrompt,
} from "./tools/tool-registry"
import { saveExecutionTrace, updateAgentSessionStatus } from "./trace-store"

// ============================================================================
// Create Planner Agent Workflow
// ============================================================================
export async function createPlannerAgent() {
  // Load available tools dynamically from database
  const tools = await loadToolRegistry()

  console.log(`[PlannerAgent] Loaded ${tools.length} tools from registry`)

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 500,
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Define state graph configuration
  const graphState: StateGraphArgs<AgentState>["channels"] = {
    sessionId: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    userId: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    messages: {
      value: (left?: AgentState["messages"], right?: AgentState["messages"]) =>
        right ?? left ?? [],
      default: () => [],
    },
    context: {
      value: (left?: Record<string, unknown>, right?: Record<string, unknown>) =>
        right ?? left ?? {},
      default: () => ({}),
    },
    selectedTools: {
      value: (left?: string[], right?: string[]) => right ?? left ?? [],
      default: () => [],
    },
    executionTrace: {
      value: (
        left?: AgentState["executionTrace"],
        right?: AgentState["executionTrace"]
      ) => right ?? left ?? [],
      default: () => [],
    },
    metadata: {
      value: (left?: Record<string, unknown>, right?: Record<string, unknown>) =>
        right ?? left ?? {},
      default: () => ({}),
    },
  }

  // Create workflow with proper typing
  const workflow = new StateGraph<AgentState>({
    channels: graphState,
  })

  // ============================================================================
  // NODE: Plan - Analyze user intent and select tools
  // ============================================================================
  workflow.addNode("plan", async (state: AgentState) => {
    console.log("[PlannerAgent:plan] Analyzing user intent...")

    const startTime = Date.now()

    try {
      const toolDescriptions = await getToolDescriptionsForPrompt()
      const userMessage = state.messages[state.messages.length - 1]?.content || ""

      const systemPrompt = `You are a mental wellness AI planner. Analyze the user's message and select the most appropriate tools to use.

Available tools:
${toolDescriptions}

Based on the user's request, select 1-3 tools that would best help them. Consider:
1. The user's explicit request
2. Their emotional state (if mentioned)
3. Whether they need immediate support or long-term guidance
4. The most efficient path to help them

Return ONLY a valid JSON object in this exact format:
{
  "selectedTools": ["tool_name_1", "tool_name_2"],
  "rationale": "Brief explanation of why you chose these tools"
}

Example response:
{
  "selectedTools": ["analyze_mood", "generate_wellness_recommendations"],
  "rationale": "User mentioned feeling anxious, so I'll first analyze their mood and then provide personalized wellness recommendations."
}`

      const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ])

      const responseContent = response.content as string
      let plannerResponse: PlannerResponse

      try {
        plannerResponse = JSON.parse(responseContent)
      } catch {
        // Fallback if JSON parsing fails
        console.warn("[PlannerAgent:plan] Failed to parse JSON, using fallback")
        plannerResponse = {
          selectedTools: ["analyze_mood"],
          rationale: "Defaulting to mood analysis",
          estimatedDurationMs: 0,
        }
      }

      const durationMs = Date.now() - startTime

      await saveExecutionTrace({
        sessionId: state.sessionId,
        userId: state.userId,
        agent: "planner",
        input: { userMessage },
        output: plannerResponse,
        status: "success",
        durationMs,
        timestamp: new Date(),
        metadata: { model: "gpt-4o-mini", phase: "planning" },
      })

      return {
        ...state,
        selectedTools: plannerResponse.selectedTools,
        metadata: {
          ...state.metadata,
          plannerRationale: plannerResponse.rationale,
        },
      }
    } catch (error) {
      console.error("[PlannerAgent:plan] Error:", error)

      await saveExecutionTrace({
        sessionId: state.sessionId,
        userId: state.userId,
        agent: "planner",
        input: {},
        status: "failed",
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      })

      // Return state with default tool selection
      return {
        ...state,
        selectedTools: ["analyze_mood"],
        metadata: {
          ...state.metadata,
          plannerError: (error as Error).message,
        },
      }
    }
  })

  // ============================================================================
  // NODE: Execute - Execute selected tools
  // ============================================================================
  workflow.addNode("execute", async (state: AgentState) => {
    console.log("[PlannerAgent:execute] Executing tools:", state.selectedTools)

    const results: unknown[] = []

    for (const toolName of state.selectedTools) {
      try {
        const startTime = Date.now()

        // Prepare tool input from context
        const toolInput = prepareToolInput(toolName, state)

        await saveExecutionTrace({
          sessionId: state.sessionId,
          userId: state.userId,
          agent: "planner",
          tool: toolName,
          input: toolInput,
          status: "running",
          timestamp: new Date(),
        })

        const output = await executeTool(toolName, toolInput, state.userId)
        const durationMs = Date.now() - startTime

        await saveExecutionTrace({
          sessionId: state.sessionId,
          userId: state.userId,
          agent: "planner",
          tool: toolName,
          input: toolInput,
          output,
          status: "success",
          durationMs,
          timestamp: new Date(),
        })

        results.push({ tool: toolName, output, status: "success" })
      } catch (error) {
        console.error(`[PlannerAgent:execute] Tool ${toolName} failed:`, error)

        await saveExecutionTrace({
          sessionId: state.sessionId,
          userId: state.userId,
          agent: "planner",
          tool: toolName,
          input: {},
          status: "failed",
          errorMessage: (error as Error).message,
          timestamp: new Date(),
        })

        results.push({ tool: toolName, error: (error as Error).message, status: "failed" })
      }
    }

    return {
      ...state,
      context: {
        ...state.context,
        toolResults: results,
      },
    }
  })

  // ============================================================================
  // NODE: Respond - Synthesize final response
  // ============================================================================
  workflow.addNode("respond", async (state: AgentState) => {
    console.log("[PlannerAgent:respond] Synthesizing response...")

    const startTime = Date.now()

    try {
      const systemPrompt = `You are a warm, empathetic mental wellness companion. Synthesize the tool execution results into a coherent, supportive response for the user.

Guidelines:
- Be warm and validating
- Acknowledge their feelings
- Provide actionable next steps
- Keep it concise (2-3 paragraphs max)
- Don't mention technical details about tools or agents

Format your response as natural conversation, not JSON.`

      const toolResultsSummary = JSON.stringify(state.context?.toolResults, null, 2)

      const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Tool results:\n${toolResultsSummary}\n\nSynthesize this into a supportive message for the user.`,
        },
      ])

      const assistantMessage = {
        role: "assistant" as const,
        content: response.content as string,
        timestamp: new Date(),
      }

      const durationMs = Date.now() - startTime

      await saveExecutionTrace({
        sessionId: state.sessionId,
        userId: state.userId,
        agent: "planner",
        input: { toolResults: state.context?.toolResults },
        output: { message: assistantMessage.content },
        status: "success",
        durationMs,
        timestamp: new Date(),
        metadata: { phase: "synthesis" },
      })

      // Mark session as completed
      await updateAgentSessionStatus(state.sessionId, "completed")

      return {
        ...state,
        messages: [...state.messages, assistantMessage],
      }
    } catch (error) {
      console.error("[PlannerAgent:respond] Error:", error)

      await saveExecutionTrace({
        sessionId: state.sessionId,
        userId: state.userId,
        agent: "planner",
        input: {},
        status: "failed",
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      })

      // Fallback message
      const fallbackMessage = {
        role: "assistant" as const,
        content:
          "I'm here to support you. While I encountered some technical difficulties, please know that your wellbeing matters. Would you like to try sharing how you're feeling in a different way?",
        timestamp: new Date(),
      }

      return {
        ...state,
        messages: [...state.messages, fallbackMessage],
      }
    }
  })

  // ============================================================================
  // Define workflow sequence
  // ============================================================================
  workflow.addEdge("plan" as any, "execute" as any)
  workflow.addEdge("execute" as any, "respond" as any)
  workflow.addEdge("respond" as any, "__end__")

  return workflow.compile({ entryPoint: "plan" as any })
}

// ============================================================================
// Helper: Prepare Tool Input from State
// ============================================================================
function prepareToolInput(toolName: string, state: AgentState): unknown {
  const userMessage = state.messages[state.messages.length - 1]?.content || ""
  const context = state.context || {}

  switch (toolName) {
    case "analyze_mood":
      return {
        text: userMessage,
        emotions: context.emotions || [],
        moodScore: context.moodScore || 5,
        energyLevel: context.energyLevel || 5,
        context: userMessage,
      }

    case "generate_wellness_recommendations":
      return {
        mood: context.detectedMood || "tired",
        moodScore: context.moodScore || 5,
        energyLevel: context.energyLevel || 5,
        triggers: context.triggers || [],
        preferences: context.preferences || {},
      }

    case "generate_user_insights":
      return {
        userId: state.userId,
        timeframe: "30d",
        moodHistory: context.moodHistory || [],
      }

    case "draft_goal":
      return {
        goal: userMessage,
        targetValue: context.targetValue || 10,
        unit: context.unit || "sessions",
        timelineWeeks: context.timelineWeeks || 4,
      }

    case "update_goal":
      return {
        id: context.goalId as string,
        currentValue: context.currentValue as number,
        progress: context.progress as number,
      }

    case "fetch_resources":
      return {
        mood: context.detectedMood || "tired",
        resourceType: context.resourceType || "all",
        latitude: context.latitude,
        longitude: context.longitude,
      }

    default:
      return { query: userMessage }
  }
}

// ============================================================================
// Convenience: Invoke Planner Agent
// ============================================================================
export async function invokePlannerAgent(
  sessionId: string,
  userId: string,
  userMessage: string,
  context: Record<string, unknown> = {}
): Promise<AgentState> {
  const planner = await createPlannerAgent()

  const initialState: AgentState = {
    sessionId,
    userId,
    messages: [
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ],
    context,
    selectedTools: [],
    executionTrace: [],
    metadata: {},
  }

  const result = await planner.invoke(initialState)
  return result
}
