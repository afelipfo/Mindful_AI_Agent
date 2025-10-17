import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Import the mood analysis function directly
// In production, you might want to call the MCP server via IPC or HTTP
import { analyzeMood, MoodAnalysisInputSchema } from "@/mcp-server/src/tools/mood-analysis";

/**
 * MCP Mood Analysis API Route
 * Exposes mood analysis tool via REST API
 */

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = MoodAnalysisInputSchema.parse(body);

    // Call mood analysis tool
    const result = await analyzeMood(validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[mcp] Mood analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze mood",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tool information
export async function GET() {
  return NextResponse.json({
    tool: "analyze_mood",
    description:
      "Analyzes text input to detect mood, emotions, triggers, and severity. Returns detailed mood analysis with confidence scores and personalized recommendations.",
    inputSchema: {
      text: "string (required) - User's text input describing their feelings or situation",
      emotions: "string[] (optional) - List of detected emotions",
      moodScore: "number 1-10 (optional) - Mood score",
      energyLevel: "number 1-10 (optional) - Energy level",
      context: "string (optional) - Additional context",
    },
    example: {
      text: "I've been feeling really overwhelmed with work lately. Can't seem to catch a break.",
      moodScore: 4,
      energyLevel: 3,
    },
  });
}
