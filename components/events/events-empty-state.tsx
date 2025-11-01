import { CalendarX, History } from "lucide-react"

interface UpcomingEventsEmptyStateProps {
  filter?: "All" | "Community" | "Corporate"
}

export function UpcomingEventsEmptyState({ filter = "All" }: UpcomingEventsEmptyStateProps) {
  const filteredLabel = filter === "All" ? "" : `${filter.toLowerCase()} `

  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-slate-600">
      <CalendarX className="h-12 w-12 text-signal-blue" aria-hidden />
      <h3 className="text-2xl font-semibold text-electric-ink">No upcoming {filteredLabel}events yet</h3>
      <p className="max-w-2xl text-base">
        We’re lining up the next wave of experiences. Check back soon or follow us on social to hear when registration opens.
      </p>
    </div>
  )
}

export function PastEventsEmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700/40 bg-slate-900/40 p-12 text-center text-slate-gray">
      <History className="h-12 w-12 text-ambixous-neon" aria-hidden />
      <h3 className="text-2xl font-semibold text-warm-white">No past highlights to show… yet</h3>
      <p className="max-w-2xl text-base">
        Recaps for recent events will appear here once they’re ready. In the meantime, explore our community to see what’s coming next.
      </p>
    </div>
  )
}
