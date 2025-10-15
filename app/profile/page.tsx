import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Header } from "@/components/layout/header"
import { ProfileForm } from "@/components/profile/profile-form"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

function MissingConfiguration() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="rounded-xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-text-primary">Profile unavailable</h1>
          <p className="mt-2 text-sm text-text-secondary">
            We couldn't reach the profile service. Double-check your Supabase environment variables and try again.
          </p>
        </div>
      </main>
    </div>
  )
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=%2Fprofile")
  }

  let hasConfigError = false
  let initialProfile = {
    email: session.user.email ?? "",
    fullName: session.user.name ?? "",
    avatarUrl: null as string | null,
    bio: "",
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name,email,avatar_url,bio")
      .eq("id", session.user.id)
      .maybeSingle()

    if (error) {
      console.error("[mindful-ai] profile page fetch error:", error)
    } else if (data) {
      initialProfile = {
        email: data.email ?? session.user.email ?? "",
        fullName: data.full_name ?? session.user.name ?? "",
        avatarUrl: data.avatar_url ?? null,
        bio: data.bio ?? "",
      }
    }
  } catch (error) {
    hasConfigError = true
    console.error("[mindful-ai] profile page supabase error:", error)
  }

  if (hasConfigError) {
    return <MissingConfiguration />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-text-primary">Profile</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Manage how your name and story appear across Mindful AI.
          </p>
        </div>
        <ProfileForm initialProfile={initialProfile} />
      </main>
    </div>
  )
}
