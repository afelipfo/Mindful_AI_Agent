"use client"

import Link from "next/link"
import { Brain, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface HeaderProps {
  onCheckInClick?: () => void
}

export function Header({ onCheckInClick }: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity duration-200 ease-[var(--ease-hover)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Mindful AI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          {onCheckInClick ? (
            <Button onClick={onCheckInClick}>Get Started</Button>
          ) : (
            <Button asChild>
              <Link href="/onboarding">Get Started</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden transition-transform duration-150 ease-[var(--ease-scale)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            </Button>
            {onCheckInClick ? (
              <Button
                className="w-full"
                onClick={() => {
                  onCheckInClick()
                  setMobileMenuOpen(false)
                }}
              >
                Get Started
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
