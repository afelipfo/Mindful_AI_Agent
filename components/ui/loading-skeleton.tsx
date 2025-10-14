import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("animate-shimmer rounded-md bg-muted", className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <LoadingSkeleton className="h-9 w-48 mb-2" />
        <LoadingSkeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 border rounded-xl">
            <LoadingSkeleton className="h-5 w-32 mb-4" />
            <LoadingSkeleton className="h-10 w-24 mb-2" />
            <LoadingSkeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 p-6 border rounded-xl">
          <LoadingSkeleton className="h-6 w-48 mb-4" />
          <LoadingSkeleton className="h-[200px] w-full" />
        </div>
        <div className="p-6 border rounded-xl">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton className="h-48 w-48 mx-auto rounded-full" />
        </div>
      </div>
    </div>
  )
}
