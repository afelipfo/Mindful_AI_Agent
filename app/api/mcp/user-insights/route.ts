import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Import the user insights function
import {
  generateUserInsights,
  UserInsightsInputSchema,
} from "@/mcp-server/src/tools/user-insights";

/**
 * MCP User Insights API Route
 * Analyzes historical mood data to generate insights
 */

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // If moodHistory is not provided, fetch from database
    if (!body.moodHistory) {
      const supabase = await createServerClient();

      // Fetch user's mood entries
      const { data: moodEntries, error } = await supabase
        .from("mood_entries")
        .select("date, mood_score, energy_level, emotions, triggers, note")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false })
        .limit(90); // Last 90 entries (~3 months)

      if (error) {
        console.error("[mcp] Failed to fetch mood entries:", error);
        return NextResponse.json(
          { error: "Failed to fetch mood history" },
          { status: 500 }
        );
      }

      // Transform database entries to match schema
      body.moodHistory = (moodEntries || []).map((entry) => ({
        date: entry.date || new Date().toISOString().split("T")[0],
        mood: detectMoodFromScore(entry.mood_score) as any,
        moodScore: entry.mood_score || 5,
        energyLevel: entry.energy_level || 5,
        triggers: entry.triggers || [],
        emotions: entry.emotions || [],
      }));
    }

    // Set userId from session
    body.userId = session.user.id;

    // Validate input
    const validated = UserInsightsInputSchema.parse(body);

    // Generate insights
    const result = await generateUserInsights(validated);

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

    console.error("[mcp] User insights error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate user insights",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tool information
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Automatically generate insights for the current user
    const supabase = await createServerClient();

    // Fetch user's mood entries
    const { data: moodEntries, error } = await supabase
      .from("mood_entries")
      .select("date, mood_score, energy_level, emotions, triggers, note")
      .eq("user_id", session.user.id)
      .order("date", { ascending: false })
      .limit(90);

    if (error) {
      console.error("[mcp] Failed to fetch mood entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch mood history" },
        { status: 500 }
      );
    }

    if (!moodEntries || moodEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: "No mood data available yet. Start tracking to generate insights!",
        },
      });
    }

    // Transform and generate insights
    const moodHistory = moodEntries.map((entry) => ({
      date: entry.date || new Date().toISOString().split("T")[0],
      mood: detectMoodFromScore(entry.mood_score) as any,
      moodScore: entry.mood_score || 5,
      energyLevel: entry.energy_level || 5,
      triggers: entry.triggers || [],
      emotions: entry.emotions || [],
    }));

    const result = await generateUserInsights({
      userId: session.user.id,
      moodHistory,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[mcp] User insights GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate user insights",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to detect mood category from score
function detectMoodFromScore(score: number): string {
  if (score >= 8) return "happy";
  if (score >= 6) return "excited";
  if (score >= 5) return "tired";
  if (score >= 3) return "sad";
  if (score >= 2) return "stressed";
  return "anxious";
}
