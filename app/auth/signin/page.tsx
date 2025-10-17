"use client"

import { useState, Suspense, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Brain, Loader2 } from "lucide-react"

function SignInForm() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Get callback URL from query params, default to /onboarding
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("🔐 Starting sign in with callbackUrl:", callbackUrl)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      })

      console.log("📋 Sign in result:", result)

      if (result?.error) {
        console.error("❌ Sign in error:", result.error)
        setIsLoading(false)
        setError(result.error)
      } else if (result?.ok) {
        console.log("✅ Sign in successful! Redirecting to:", callbackUrl)
        // Force a full page reload to ensure session is loaded properly
        window.location.href = callbackUrl
      } else {
        console.log("⚠️ Unexpected result:", result)
        setIsLoading(false)
        setError("Authentication failed. Please try again.")
      }
    } catch (err) {
      console.error("💥 Sign in exception:", err)
      setIsLoading(false)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  // If already authenticated, show a message instead of auto-redirecting
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">Already Signed In</h1>
            <p className="text-text-secondary text-center mt-2">You're already authenticated</p>
          </div>

          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href={callbackUrl}>
                Continue to App
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
          <p className="text-text-secondary text-center mt-2">Sign in to continue your wellness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">Don&apos;t have an account? </span>
          <Link href="/auth/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>


        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-text-secondary hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-text-secondary">Loading...</p>
          </div>
        </Card>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
