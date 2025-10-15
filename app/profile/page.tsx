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
            Supabase environment variables are missing. Add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to enable profile
            management.
          </p>
        </div>
      </main>
    </div>
  )
}

export default async function ProfilePage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return <MissingConfiguration />
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=%2Fprofile")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,email,avatar_url,bio")
    .eq("id", session.user.id)
    .maybeSingle()

  if (error) {
    console.error("[mindful-ai] profile page fetch error:", error)
  }

  const initialProfile = {
    email: data?.email ?? session.user.email ?? "",
    fullName: data?.full_name ?? session.user.name ?? "",
    avatarUrl: data?.avatar_url ?? null,
    bio: data?.bio ?? "",
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
