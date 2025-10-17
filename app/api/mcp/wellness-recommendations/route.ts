import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Import the wellness recommendations function from lib
import {
  generateWellnessRecommendations,
  WellnessRecommendationsInputSchema,
} from "@/lib/mcp-tools";

/**
 * MCP Wellness Recommendations API Route
 * Generates personalized wellness recommendations
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
    const validated = WellnessRecommendationsInputSchema.parse(body);

    // Call wellness recommendations tool
    const result = await generateWellnessRecommendations(validated);

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

    console.error("[mcp] Wellness recommendations error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate wellness recommendations",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tool information
export async function GET() {
  return NextResponse.json({
    tool: "generate_wellness_recommendations",
    description:
      "Generates personalized wellness recommendations based on user's current emotional state. Returns immediate, short-term, and long-term actionable wellness practices with instructions.",
    inputSchema: {
      mood: "enum (required) - Current mood: anxious, happy, sad, tired, stressed, excited",
      moodScore: "number 1-10 (required) - Mood score",
      energyLevel: "number 1-10 (required) - Energy level",
      triggers: "string[] (optional) - Identified triggers",
      preferences: {
        activityLevel: "enum (optional) - low, moderate, high",
        timeAvailable: "number (optional) - Minutes available",
        environment: "enum (optional) - home, work, outdoor, any",
      },
    },
    example: {
      mood: "anxious",
      moodScore: 5,
      energyLevel: 6,
      preferences: {
        timeAvailable: 15,
        activityLevel: "moderate",
        environment: "home",
      },
    },
  });
}
