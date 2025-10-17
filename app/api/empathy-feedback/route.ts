import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  mood: z.string(),
  feedback: z.enum(["helpful", "not_helpful"]),
  confidence: z.number().optional(),
  timestamp: z.string(),
});

async function getSupabaseClient() {
  const admin = tryCreateAdminClient();
  if (admin) {
    return admin;
  }
  return await createServerClient();
}

/**
 * POST - Save empathy recommendation feedback
 * This feedback is used to improve recommendation accuracy
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    const supabase = await getSupabaseClient();

    // Store feedback
    const { error } = await supabase.from("empathy_feedback").insert({
      user_id: session.user.id,
      detected_mood: validated.mood,
      feedback: validated.feedback,
      confidence: validated.confidence,
      created_at: validated.timestamp,
    });

    if (error) {
      console.error("[mindful-ai] Failed to save empathy feedback:", error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid feedback data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("[mindful-ai] Empathy feedback error:", error);
    return NextResponse.json(
      { error: "Unable to save feedback" },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve feedback statistics (for analytics)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("empathy_feedback")
      .select("detected_mood, feedback, confidence, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[mindful-ai] Failed to fetch feedback:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      helpful: data.filter((f) => f.feedback === "helpful").length,
      not_helpful: data.filter((f) => f.feedback === "not_helpful").length,
      by_mood: data.reduce((acc, f) => {
        if (!acc[f.detected_mood]) {
          acc[f.detected_mood] = { helpful: 0, not_helpful: 0 };
        }
        const feedbackType = f.feedback as "helpful" | "not_helpful";
        acc[f.detected_mood][feedbackType]++;
        return acc;
      }, {} as Record<string, { helpful: number; not_helpful: number }>),
    };

    return NextResponse.json({
      success: true,
      stats,
      recent: data.slice(0, 10),
    });
  } catch (error) {
    console.error("[mindful-ai] Feedback stats error:", error);
    return NextResponse.json(
      { error: "Unable to fetch feedback stats" },
      { status: 500 }
    );
  }
}
