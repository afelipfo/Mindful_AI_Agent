import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const journalEntrySchema = z.object({
  content: z.string().min(1),
  date: z.string(),
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
 * POST - Save a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = journalEntrySchema.parse(body);

    const supabase = await getSupabaseClient();

    // Save journal entry
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: session.user.id,
        content: validated.content,
        date: validated.date,
        created_at: validated.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error("[mindful-ai] Failed to save journal entry:", error);
      return NextResponse.json(
        { error: "Failed to save journal entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid journal entry data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("[mindful-ai] Journal entry error:", error);
    return NextResponse.json(
      { error: "Unable to save journal entry" },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve user's journal entries
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, content, date, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[mindful-ai] Failed to fetch journal entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch journal entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: data.map((entry) => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        createdAt: entry.created_at,
      })),
    });
  } catch (error) {
    console.error("[mindful-ai] Journal fetch error:", error);
    return NextResponse.json(
      { error: "Unable to fetch journal entries" },
      { status: 500 }
    );
  }
}
