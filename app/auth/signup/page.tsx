"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Brain, Loader2, Mail, CheckCircle } from "lucide-react"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleResendConfirmation = async () => {
    setIsResending(true)
    setError("")

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to resend confirmation email")
      } else {
        setError("") // Clear any previous errors
      }
    } catch {
      setError("Failed to resend confirmation email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Create user account
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })

      const signupData = await signupResponse.json()

      if (!signupResponse.ok) {
        setError(signupData.error || "Signup failed")
        setIsLoading(false)
        return
      }

      // Show success message and email confirmation UI
      setIsSuccess(true)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        {!isSuccess ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-center">Create Your Account</h1>
              <p className="text-text-secondary text-center mt-2">Start your mental wellness journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />
          </div>

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
              minLength={8}
              disabled={isLoading}
            />
            <p className="text-xs text-text-muted">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-text-secondary">Already have an account? </span>
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-text-secondary hover:text-primary">
                ← Back to home
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-center">Check Your Email</h1>
              <p className="text-text-secondary text-center mt-2">
                We've sent a confirmation link to <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Next Steps:</p>
                    <ol className="text-sm text-text-secondary mt-2 space-y-1">
                      <li>1. Check your email inbox (and spam folder)</li>
                      <li>2. Click the confirmation link</li>
                      <li>3. Return here to sign in</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>

                <Button asChild className="w-full">
                  <Link href="/auth/signin">Continue to Sign In</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-text-secondary hover:text-primary">
                ← Back to home
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
