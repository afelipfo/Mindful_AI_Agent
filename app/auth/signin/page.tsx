"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Brain, Loader2 } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("🔐 Attempting to sign in with:", { email, password: "***" })

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("📋 Sign in result:", result)
      console.log("📋 Result.ok:", result?.ok)
      console.log("📋 Result.error:", result?.error)
      console.log("📋 Result.url:", result?.url)

      if (result?.error) {
        console.error("❌ Sign in error:", result.error)

        // More specific error messages
        if (result.error.includes("Email not confirmed")) {
          setError("Please confirm your email address before signing in. Check your inbox for the confirmation link.")
        } else if (result.error.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (result.error.includes("Email rate limit exceeded")) {
          setError("Too many login attempts. Please wait a few minutes before trying again.")
        } else {
          setError(`Authentication failed: ${result.error}`)
        }
      } else if (result?.ok) {
        console.log("✅ Sign in successful, redirecting to onboarding...")
        // Redirect to onboarding page - it will handle showing the right view
        // based on whether onboarding is complete or not
        router.push("/onboarding")
        router.refresh()
      } else {
        console.log("⚠️ Unexpected result:", result)
        setError("Authentication failed. Please try again.")
      }
    } catch (error) {
      console.error("💥 Sign in exception:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
