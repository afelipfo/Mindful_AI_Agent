// Tool registry loader - Dynamic tool discovery from database
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import type { ToolDefinition } from "../types"

// ============================================================================
// Load Tool Registry from Database
// ============================================================================
export async function loadToolRegistry(): Promise<ToolDefinition[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("tool_registry")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })

    if (error) {
      console.error("[ToolRegistry] Failed to load tool registry:", error)
      return []
    }

    return data.map((tool) => ({
      name: tool.tool_name,
      displayName: tool.display_name,
      description: tool.description,
      category: tool.category as
        | "analysis"
        | "recommendation"
        | "goal_management"
        | "resource_discovery",
      endpoint: tool.endpoint,
      // For now, use z.any() - in production, parse JSON schemas dynamically
      inputSchema: z.any(),
      outputSchema: z.any(),
      rateLimit: tool.rate_limit_per_minute,
      isActive: tool.is_active,
    }))
  } catch (err) {
    console.error("[ToolRegistry] Exception loading tool registry:", err)
    return []
  }
}

// ============================================================================
// Get Tool by Name
// ============================================================================
export async function getToolByName(toolName: string): Promise<ToolDefinition | null> {
  const tools = await loadToolRegistry()
  return tools.find((t) => t.name === toolName) || null
}

// ============================================================================
// Get Tools by Category
// ============================================================================
export async function getToolsByCategory(
  category: "analysis" | "recommendation" | "goal_management" | "resource_discovery"
): Promise<ToolDefinition[]> {
  const tools = await loadToolRegistry()
  return tools.filter((t) => t.category === category)
}

// ============================================================================
// Execute Tool via API Endpoint
// ============================================================================
export async function executeTool(
  toolName: string,
  input: unknown,
  userId: string,
  authToken?: string
): Promise<unknown> {
  const tool = await getToolByName(toolName)

  if (!tool) {
    throw new Error(`Tool ${toolName} not found in registry`)
  }

  // In a production environment, validate input against tool.inputSchema
  // For now, we skip validation to avoid schema parsing complexity

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const url = `${baseUrl}${tool.endpoint}`

  console.log(`[ToolRegistry] Executing tool ${toolName} at ${url}`)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ ...input, userId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tool ${toolName} execution failed: ${response.statusText} - ${errorText}`)
    }

    const output = await response.json()
    return output
  } catch (err) {
    console.error(`[ToolRegistry] Error executing tool ${toolName}:`, err)
    throw err
  }
}

// ============================================================================
// Batch Execute Tools (parallel)
// ============================================================================
export async function batchExecuteTools(
  toolExecutions: Array<{ toolName: string; input: unknown }>,
  userId: string,
  authToken?: string
): Promise<Array<{ toolName: string; output?: unknown; error?: string }>> {
  const results = await Promise.allSettled(
    toolExecutions.map(({ toolName, input }) => executeTool(toolName, input, userId, authToken))
  )

  return toolExecutions.map(({ toolName }, index) => {
    const result = results[index]

    if (result.status === "fulfilled") {
      return {
        toolName,
        output: result.value,
      }
    } else {
      return {
        toolName,
        error: result.reason?.message || "Unknown error",
      }
    }
  })
}

// ============================================================================
// Get Tool Descriptions for LLM Prompt
// ============================================================================
export async function getToolDescriptionsForPrompt(): Promise<string> {
  const tools = await loadToolRegistry()

  return tools
    .map(
      (tool) =>
        `- ${tool.name}: ${tool.description} (Category: ${tool.category}, Rate limit: ${tool.rateLimit}/min)`
    )
    .join("\n")
}

// ============================================================================
// Register New Tool (Admin function)
// ============================================================================
export async function registerTool(
  tool: Omit<ToolDefinition, "isActive">
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("tool_registry").insert({
      tool_name: tool.name,
      display_name: tool.displayName,
      description: tool.description,
      category: tool.category,
      endpoint: tool.endpoint,
      input_schema: {}, // Placeholder - should serialize Zod schema
      output_schema: {}, // Placeholder
      rate_limit_per_minute: tool.rateLimit,
      is_active: true,
    })

    if (error) {
      console.error("[ToolRegistry] Failed to register tool:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("[ToolRegistry] Exception registering tool:", err)
    return false
  }
}

// ============================================================================
// Deactivate Tool
// ============================================================================
export async function deactivateTool(toolName: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("tool_registry")
      .update({ is_active: false })
      .eq("tool_name", toolName)

    if (error) {
      console.error("[ToolRegistry] Failed to deactivate tool:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("[ToolRegistry] Exception deactivating tool:", err)
    return false
  }
}
