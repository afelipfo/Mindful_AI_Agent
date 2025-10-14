import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-2 text-6xl font-bold text-text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-text-primary">Page Not Found</h2>
        <p className="mb-8 text-text-secondary">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
