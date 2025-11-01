import Link from "next/link"
import { cn } from "@/lib/utils"

export type AdminEventListItem = {
  id: string
  title: string
  slug: string
  status: string | null
  format: string | null
  startAt: string | null
  endAt: string | null
  timezone: string | null
  expectedAttendees: number | null
  displayOrder: number | null
  typeLabel: string | null
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-700/60 text-slate-200",
  published: "bg-emerald-500/20 text-emerald-300",
  limited: "bg-amber-500/20 text-amber-300",
  closed: "bg-blue-500/20 text-blue-200",
  cancelled: "bg-rose-500/20 text-rose-200",
  archived: "bg-slate-700/60 text-slate-300",
}

const formatStyles: Record<string, string> = {
  in_person: "bg-slate-700/60 text-slate-100",
  virtual: "bg-sky-500/20 text-sky-200",
  hybrid: "bg-purple-500/20 text-purple-200",
}

const toTitleCase = (value: string | null | undefined) => {
  if (!value) return "—"
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const formatSchedule = (startAt: string | null, endAt: string | null, timezone: string | null) => {
  if (!startAt) return "—"

  try {
    const formatter = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone ?? "Asia/Kolkata",
    })

    const start = formatter.format(new Date(startAt))
    if (!endAt) {
      return start
    }

    const end = formatter.format(new Date(endAt))
    return `${start} → ${end}`
  } catch (error) {
    console.warn("Unable to format schedule", error)
    return "—"
  }
}

export function EventsTable({ events }: { events: AdminEventListItem[] }) {
  if (!events.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
        <p className="font-medium text-white">No events yet</p>
        <p className="mt-2">Create your first event to start publishing upcoming programs and highlights.</p>
        <div className="mt-6">
          <Link
            href="/(admin)/events/new"
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-400"
          >
            Create event
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/50 shadow-xl">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3">Event</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Type</th>
            <th scope="col" className="px-4 py-3">Schedule</th>
            <th scope="col" className="px-4 py-3">Format</th>
            <th scope="col" className="px-4 py-3 text-right">Expected</th>
            <th scope="col" className="px-4 py-3 text-right">Order</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {events.map((event) => {
            const statusKey = (event.status ?? "draft").toLowerCase()
            const statusClass = statusStyles[statusKey] ?? statusStyles.draft

            const formatKey = (event.format ?? "in_person").toLowerCase()
            const formatClass = formatStyles[formatKey] ?? formatStyles.in_person

            return (
              <tr key={event.id} className="transition hover:bg-white/5">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-medium text-white">{event.title}</div>
                  <div className="text-xs text-slate-400">/{event.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusClass)}>
                    {toTitleCase(event.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{event.typeLabel ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{formatSchedule(event.startAt, event.endAt, event.timezone)}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", formatClass)}>
                    {toTitleCase(event.format)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{event.expectedAttendees ?? "—"}</td>
                <td className="px-4 py-3 text-right text-slate-300">{event.displayOrder ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/(admin)/events/${event.id}/edit`}
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-sky-400 hover:text-sky-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
