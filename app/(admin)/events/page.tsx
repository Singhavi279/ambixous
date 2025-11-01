import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"
import { EventsTable, type AdminEventListItem } from "@/components/admin/events/EventsTable"

const pageHeader = {
  title: "Events",
  description: "Review upcoming and past events, update details, and publish new experiences for the community.",
}

const calloutClasses = "rounded-lg border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300"

export default async function AdminEventsPage() {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return (
      <section className="max-w-4xl">
        <div className={calloutClasses}>
          <p className="font-medium text-white">Supabase credentials missing</p>
          <p className="mt-2">
            Add the `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment
            variables to enable the admin dashboard.
          </p>
        </div>
      </section>
    )
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, status, format, start_at, end_at, timezone, expected_attendees, display_order, event_types(label)"
    )
    .order("start_at", { ascending: false })

  const events: AdminEventListItem[] =
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      format: row.format,
      startAt: row.start_at,
      endAt: row.end_at,
      timezone: row.timezone,
      expectedAttendees: row.expected_attendees,
      displayOrder: row.display_order,
      typeLabel: row.event_types?.label ?? null,
    })) ?? []

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{pageHeader.title}</h1>
          <p className="text-sm text-slate-400">{pageHeader.description}</p>
        </div>
        <Link
          href="/(admin)/events/new"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          New event
        </Link>
      </header>

      {error ? (
        <div className={calloutClasses}>
          <p className="font-semibold text-white">Unable to load events</p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      ) : (
        <EventsTable events={events} />
      )}
    </section>
  )
}
