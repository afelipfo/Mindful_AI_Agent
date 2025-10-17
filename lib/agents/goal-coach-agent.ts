// Goal Coach Agent - Specialized agent for wellness goal management
import { ChatOpenAI } from "@langchain/openai"
import type { AgentState, GoalOutput } from "./types"
import { saveExecutionTrace } from "./trace-store"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Goal Coach Input Types
// ============================================================================
export interface GoalCoachInput {
  action: "draft" | "update" | "track" | "celebrate" | "suggest_adjustment"
  goalText?: string
  goalId?: string
  currentProgress?: number
  targetValue?: number
  unit?: string
}

// ============================================================================
// Goal Coach Response Types
// ============================================================================
export interface GoalCoachResponse {
  type: "draft" | "update" | "track" | "celebration" | "adjustment"
  message: string
  goal?: Partial<GoalOutput>
  progress?: number
  acknowledgment?: string
  encouragement?: string
  nextStep?: string
  insights?: string[]
}

// ============================================================================
// Goal Coach Agent Main Function
// ============================================================================
export async function goalCoachAgent(
  state: AgentState,
  input: GoalCoachInput
): Promise<GoalCoachResponse> {
  const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 600,
    apiKey: process.env.OPENAI_API_KEY,
  })

  console.log(`[GoalCoach] Action: ${input.action}`)

  const startTime = Date.now()

  try {
    switch (input.action) {
      case "draft":
        return await draftGoal(llm, state, input, startTime)

      case "update":
        return await updateGoal(llm, state, input, startTime)

      case "track":
        return await trackGoals(llm, state, input, startTime)

      case "celebrate":
        return await celebrateGoal(llm, state, input, startTime)

      case "suggest_adjustment":
        return await suggestAdjustment(llm, state, input, startTime)

      default:
        throw new Error(`Unknown action: ${input.action}`)
    }
  } catch (error) {
    console.error("[GoalCoach] Error:", error)

    await saveExecutionTrace({
      sessionId: state.sessionId,
      userId: state.userId,
      agent: "goal_coach",
      input,
      status: "failed",
      errorMessage: (error as Error).message,
      timestamp: new Date(),
    })

    throw error
  }
}

// ============================================================================
// Action: Draft Goal
// ============================================================================
async function draftGoal(
  llm: ChatOpenAI,
  state: AgentState,
  input: GoalCoachInput,
  startTime: number
): Promise<GoalCoachResponse> {
  const systemPrompt = `You are a supportive wellness goal coach. Help the user create a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound).

Extract from their text:
1. Goal description (what they want to achieve)
2. Target value (numeric)
3. Unit of measurement (sessions, minutes, days, etc.)
4. Timeline in weeks (default 4 if not specified)

Return ONLY valid JSON:
{
  "goal": "Clear, specific goal statement",
  "targetValue": number,
  "unit": "unit of measurement",
  "timelineWeeks": number,
  "encouragement": "Warm, supportive message about their goal"
}`

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: input.goalText || "" },
  ])

  const goalData = JSON.parse(response.content as string)
  const durationMs = Date.now() - startTime

  const result: GoalCoachResponse = {
    type: "draft",
    message: goalData.encouragement,
    goal: {
      goal: goalData.goal,
      targetValue: goalData.targetValue,
      currentValue: 0,
      unit: goalData.unit,
      progress: 0,
      isActive: true,
    },
  }

  await saveExecutionTrace({
    sessionId: state.sessionId,
    userId: state.userId,
    agent: "goal_coach",
    tool: "draft_goal",
    input,
    output: result,
    status: "success",
    durationMs,
    timestamp: new Date(),
    metadata: { goalData },
  })

  return result
}

// ============================================================================
// Action: Update Goal
// ============================================================================
async function updateGoal(
  llm: ChatOpenAI,
  state: AgentState,
  input: GoalCoachInput,
  startTime: number
): Promise<GoalCoachResponse> {
  // Fetch current goal from database
  const currentGoal = await fetchGoal(input.goalId!, state.userId)

  if (!currentGoal) {
    throw new Error("Goal not found")
  }

  const progressPercentage = Math.round(
    ((input.currentProgress || currentGoal.currentValue) / currentGoal.targetValue) * 100
  )

  const systemPrompt = `You are a supportive wellness goal coach. The user has updated their goal progress.

Current goal: ${currentGoal.goal}
Progress: ${input.currentProgress} ${currentGoal.unit} of ${currentGoal.targetValue} ${currentGoal.unit} (${progressPercentage}%)

Provide:
1. Acknowledgment of their progress
2. Specific, personalized encouragement based on progress level
3. One concrete next step

Return ONLY valid JSON:
{
  "acknowledgment": "Acknowledge their specific progress",
  "encouragement": "Personalized encouragement (2-3 sentences)",
  "nextStep": "One specific, actionable next step"
}`

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `I've updated my progress to ${input.currentProgress} ${currentGoal.unit}`,
    },
  ])

  const coachingResponse = JSON.parse(response.content as string)
  const durationMs = Date.now() - startTime

  const result: GoalCoachResponse = {
    type: "update",
    message: coachingResponse.encouragement,
    progress: progressPercentage,
    acknowledgment: coachingResponse.acknowledgment,
    encouragement: coachingResponse.encouragement,
    nextStep: coachingResponse.nextStep,
  }

  await saveExecutionTrace({
    sessionId: state.sessionId,
    userId: state.userId,
    agent: "goal_coach",
    tool: "update_goal",
    input,
    output: result,
    status: "success",
    durationMs,
    timestamp: new Date(),
    metadata: { currentGoal, progressPercentage },
  })

  return result
}

// ============================================================================
// Action: Track Goals
// ============================================================================
async function trackGoals(
  llm: ChatOpenAI,
  state: AgentState,
  input: GoalCoachInput,
  startTime: number
): Promise<GoalCoachResponse> {
  const goals = await fetchUserGoals(state.userId)

  if (goals.length === 0) {
    return {
      type: "track",
      message:
        "You don't have any active wellness goals yet. Would you like to create one? Setting meaningful goals can help you build positive habits and track your progress.",
    }
  }

  const systemPrompt = `You are a wellness goal coach analyzing the user's goal progress. Provide insights:

1. Overall progress summary
2. Goals that need attention
3. Patterns in goal achievement
4. Specific encouragement

Return ONLY valid JSON:
{
  "summary": "Overall progress summary (2-3 sentences)",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "needsAttention": ["goal name that needs attention"],
  "encouragement": "Warm, motivating message"
}`

  const goalsContext = goals.map((g) => ({
    goal: g.goal,
    progress: g.progress,
    target: g.targetValue,
    current: g.currentValue,
    unit: g.unit,
  }))

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: `My goals: ${JSON.stringify(goalsContext)}` },
  ])

  const trackingData = JSON.parse(response.content as string)
  const durationMs = Date.now() - startTime

  const result: GoalCoachResponse = {
    type: "track",
    message: trackingData.encouragement,
    insights: trackingData.insights,
  }

  await saveExecutionTrace({
    sessionId: state.sessionId,
    userId: state.userId,
    agent: "goal_coach",
    tool: "track_goals",
    input,
    output: result,
    status: "success",
    durationMs,
    timestamp: new Date(),
    metadata: { goalsCount: goals.length },
  })

  return result
}

// ============================================================================
// Action: Celebrate Goal
// ============================================================================
async function celebrateGoal(
  llm: ChatOpenAI,
  state: AgentState,
  input: GoalCoachInput,
  startTime: number
): Promise<GoalCoachResponse> {
  const systemPrompt = `The user has achieved their wellness goal! Generate a warm celebration message.

Guidelines:
1. Acknowledge the specific achievement
2. Reflect on the effort and growth
3. Encourage setting new goals
4. Keep it 3-4 sentences, warm and personal

Return ONLY valid JSON:
{
  "celebration": "Your celebration message",
  "nextSteps": "Suggestion for what to do next"
}`

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: input.goalText || "I completed my goal!" },
  ])

  const celebrationData = JSON.parse(response.content as string)
  const durationMs = Date.now() - startTime

  const result: GoalCoachResponse = {
    type: "celebration",
    message: celebrationData.celebration,
    nextStep: celebrationData.nextSteps,
  }

  await saveExecutionTrace({
    sessionId: state.sessionId,
    userId: state.userId,
    agent: "goal_coach",
    tool: "celebrate_goal",
    input,
    output: result,
    status: "success",
    durationMs,
    timestamp: new Date(),
  })

  return result
}

// ============================================================================
// Action: Suggest Adjustment
// ============================================================================
async function suggestAdjustment(
  llm: ChatOpenAI,
  state: AgentState,
  input: GoalCoachInput,
  startTime: number
): Promise<GoalCoachResponse> {
  const currentGoal = await fetchGoal(input.goalId!, state.userId)

  if (!currentGoal) {
    throw new Error("Goal not found")
  }

  const systemPrompt = `The user is struggling with their wellness goal. Suggest realistic adjustments.

Current goal: ${currentGoal.goal}
Progress: ${currentGoal.currentValue} of ${currentGoal.targetValue} ${currentGoal.unit} (${currentGoal.progress}%)

Suggest:
1. Why adjustment might help
2. Specific adjusted target (make it more achievable)
3. Encouragement that struggle is normal

Return ONLY valid JSON:
{
  "rationale": "Why adjustment is okay and helpful",
  "suggestedTarget": number (realistic adjusted target),
  "encouragement": "Warm, non-judgmental support"
}`

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: "I'm having trouble keeping up with my goal" },
  ])

  const adjustmentData = JSON.parse(response.content as string)
  const durationMs = Date.now() - startTime

  const result: GoalCoachResponse = {
    type: "adjustment",
    message: adjustmentData.encouragement,
    goal: {
      ...currentGoal,
      targetValue: adjustmentData.suggestedTarget,
    },
    insights: [adjustmentData.rationale],
  }

  await saveExecutionTrace({
    sessionId: state.sessionId,
    userId: state.userId,
    agent: "goal_coach",
    tool: "suggest_adjustment",
    input,
    output: result,
    status: "success",
    durationMs,
    timestamp: new Date(),
  })

  return result
}

// ============================================================================
// Database Helpers
// ============================================================================
async function fetchGoal(goalId: string, userId: string): Promise<GoalOutput | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("wellness_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[GoalCoach] Error fetching goal:", error)
      return null
    }

    return {
      id: data.id,
      goal: data.goal,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      progress: data.progress,
      isActive: data.is_active,
    }
  } catch (err) {
    console.error("[GoalCoach] Exception fetching goal:", err)
    return null
  }
}

async function fetchUserGoals(userId: string): Promise<GoalOutput[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("wellness_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GoalCoach] Error fetching goals:", error)
      return []
    }

    return data.map((g) => ({
      id: g.id,
      goal: g.goal,
      targetValue: g.target_value,
      currentValue: g.current_value,
      unit: g.unit,
      progress: g.progress,
      isActive: g.is_active,
    }))
  } catch (err) {
    console.error("[GoalCoach] Exception fetching goals:", err)
    return []
  }
}
