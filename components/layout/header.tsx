"use client"

import Link from "next/link"
import { Brain, LogOut, Menu, Settings, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut, useSession } from "next-auth/react"
import { useMemo, useState } from "react"

interface HeaderProps {
  onCheckInClick?: () => void
}

export function Header({ onCheckInClick }: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  const initials = useMemo(() => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase()
    }
    return "U"
  }, [session?.user?.name, session?.user?.email])

  const renderUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name ?? session.user.email ?? "User"} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline-flex">
            {session?.user?.name ?? session?.user?.email ?? "Account"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1 px-2 py-1.5">
          <span className="text-sm font-semibold leading-tight">
            {session?.user?.name ?? session?.user?.email ?? "Logged in"}
          </span>
          {session?.user?.email && (
            <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

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
          {status !== "authenticated" ? (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              {onCheckInClick ? (
                <Button onClick={onCheckInClick}>Get Started</Button>
              ) : (
                <Button asChild>
                  <Link href="/auth/signin?callbackUrl=%2Fonboarding" prefetch={false}>
                    Get Started
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link href="/onboarding">Dashboard</Link>
              </Button>
              {renderUserMenu()}
            </>
          )}

          <button
            className="md:hidden transition-transform duration-150 ease-[var(--ease-scale)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            {status !== "authenticated" ? (
              <>
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
                    <Link
                      href="/auth/signin?callbackUrl=%2Fonboarding"
                      prefetch={false}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Avatar>
                    {session?.user?.image ? (
                      <AvatarImage src={session.user.image} alt={session.user.name ?? session.user.email ?? "User"} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {session?.user?.name ?? session?.user?.email ?? "Account"}
                    </span>
                    {session?.user?.email && (
                      <span className="text-xs text-muted-foreground">{session.user.email}</span>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: "/" })
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
