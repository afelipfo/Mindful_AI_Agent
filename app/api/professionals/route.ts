import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "general")
    if (rateLimitResult) {
      return rateLimitResult
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = tryCreateAdminClient()
    const supabase = supabaseAdmin ?? (await createServerClient())

    const { data, error } = await supabase
      .from("professionals")
      .select("id, name, specialty, location, phone, email, photo_url, bio, experience, languages, availability")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[mindful-ai] Error fetching professionals from database:", error)
      throw error
    }

    // Map database fields to match expected API response format
    const professionals = (data ?? []).map((prof) => ({
      id: prof.id,
      name: prof.name,
      specialty: prof.specialty,
      location: prof.location ?? "",
      phone: prof.phone ?? "",
      email: prof.email ?? "",
      photo: prof.photo_url ?? "",
      bio: prof.bio ?? "",
      experience: prof.experience ?? "",
      languages: prof.languages ?? [],
      availability: prof.availability ?? "",
    }))

    return NextResponse.json({ professionals })
  } catch (error) {
    console.error("[mindful-ai] Error fetching professionals:", error)
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 })
  }
}
