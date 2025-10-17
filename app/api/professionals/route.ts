import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withRateLimit } from "@/lib/api-middleware"

// Mock data for mental health professionals
// In production, this would come from a database
const professionals = [
  {
    id: "1",
    name: "Dr. Sarah Martinez",
    specialty: "Clinical Psychologist",
    location: "San Francisco, CA",
    phone: "+1 (415) 555-0123",
    email: "sarah.martinez@mindful.health",
    photo: "https://i.pravatar.cc/150?img=1",
    bio: "Specializing in cognitive behavioral therapy and mindfulness-based interventions for anxiety and depression.",
    experience: "15 years",
    languages: ["English", "Spanish"],
    availability: "Monday-Friday, 9am-5pm",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialty: "Psychiatrist",
    location: "New York, NY",
    phone: "+1 (212) 555-0456",
    email: "michael.chen@mindful.health",
    photo: "https://i.pravatar.cc/150?img=12",
    bio: "Board-certified psychiatrist with expertise in medication management and integrative mental health approaches.",
    experience: "12 years",
    languages: ["English", "Mandarin"],
    availability: "Tuesday-Saturday, 10am-6pm",
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Licensed Therapist (LMFT)",
    location: "Los Angeles, CA",
    phone: "+1 (310) 555-0789",
    email: "emily.rodriguez@mindful.health",
    photo: "https://i.pravatar.cc/150?img=5",
    bio: "Marriage and family therapist focused on relationship dynamics, trauma recovery, and emotional regulation.",
    experience: "10 years",
    languages: ["English", "Spanish"],
    availability: "Wednesday-Sunday, 11am-7pm",
  },
  {
    id: "4",
    name: "Dr. James Wilson",
    specialty: "Clinical Social Worker",
    location: "Chicago, IL",
    phone: "+1 (312) 555-0321",
    email: "james.wilson@mindful.health",
    photo: "https://i.pravatar.cc/150?img=15",
    bio: "Licensed clinical social worker specializing in stress management, life transitions, and workplace mental health.",
    experience: "8 years",
    languages: ["English"],
    availability: "Monday-Thursday, 8am-4pm",
  },
  {
    id: "5",
    name: "Dr. Priya Patel",
    specialty: "Psychotherapist",
    location: "Austin, TX",
    phone: "+1 (512) 555-0654",
    email: "priya.patel@mindful.health",
    photo: "https://i.pravatar.cc/150?img=9",
    bio: "Holistic psychotherapist integrating mindfulness, somatic therapy, and narrative approaches for healing.",
    experience: "11 years",
    languages: ["English", "Hindi", "Gujarati"],
    availability: "Monday-Friday, 12pm-8pm",
  },
  {
    id: "6",
    name: "Dr. David Thompson",
    specialty: "Addiction Counselor",
    location: "Seattle, WA",
    phone: "+1 (206) 555-0987",
    email: "david.thompson@mindful.health",
    photo: "https://i.pravatar.cc/150?img=13",
    bio: "Certified addiction counselor with extensive experience in substance abuse recovery and dual diagnosis treatment.",
    experience: "20 years",
    languages: ["English"],
    availability: "Monday-Saturday, 9am-9pm",
  },
]

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

    // In production, you would filter by location, specialty, availability, etc.
    return NextResponse.json({ professionals })
  } catch (error) {
    console.error("[mindful-ai] Error fetching professionals:", error)
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 })
  }
}
