import { Button } from "@/components/ui/button"
import { Calendar, Bell, BookOpen } from "lucide-react"

export function ActionButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
        <Calendar className="h-4 w-4" />
        Schedule Reminder
      </Button>
      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
        <Bell className="h-4 w-4" />
        Set Alert
      </Button>
      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
        <BookOpen className="h-4 w-4" />
        Learn More
      </Button>
    </div>
  )
}
