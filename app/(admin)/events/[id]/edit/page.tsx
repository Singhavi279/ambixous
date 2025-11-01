import Link from "next/link"
import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"
import { EventForm } from "@/components/admin/events/EventForm"
import { updateEvent } from "../../actions"
import type { EventFormInput } from "../../actions"

const calloutClasses = "rounded-lg border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300"

type EditEventPageProps = {
  params: {
    id: string
  }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
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

  const [{ data: eventTypes }, { data: event, error: eventError }] = await Promise.all([
    supabase.from("event_types").select("id, label").order("display_order", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, type_id, format, status, start_at, end_at, timezone, venue_name, venue_city, venue_country, registration_url, recap_url, expected_attendees, display_order"
      )
      .eq("id", params.id)
      .single(),
  ])

  if (eventError) {
    return (
      <section className="max-w-4xl space-y-4">
        <div className={calloutClasses}>
          <p className="font-semibold text-white">Unable to load event</p>
          <p className="mt-2 text-sm">{eventError.message}</p>
        </div>
        <Link
          href="/(admin)/events"
          className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
        >
          Back to events
        </Link>
      </section>
    )
  }

  if (!event) {
    notFound()
  }

  const initialValues: Partial<EventFormInput> = {
    slug: event.slug,
    title: event.title,
    summary: event.summary ?? undefined,
    description: event.description ?? undefined,
    type_id: event.type_id,
    format: event.format,
    status: event.status,
    start_at: event.start_at,
    end_at: event.end_at,
    timezone: event.timezone,
    venue_name: event.venue_name ?? undefined,
    venue_city: event.venue_city ?? undefined,
    venue_country: event.venue_country ?? undefined,
    registration_url: event.registration_url ?? undefined,
    recap_url: event.recap_url ?? undefined,
    expected_attendees: event.expected_attendees ?? undefined,
    display_order: event.display_order ?? undefined,
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Editing</p>
          <h1 className="text-2xl font-semibold text-white">{event.title}</h1>
          <p className="text-sm text-slate-400">Update event details and publish changes when you&apos;re ready.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/(admin)/events/${event.id}/edit`}
            className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
          >
            Refresh
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            View public page
          </Link>
        </div>
      </header>

      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-6 shadow-xl">
        <EventForm
          eventTypes={eventTypes ?? []}
          action={updateEvent.bind(null, event.id)}
          initialValues={initialValues}
          submitLabel="Save changes"
        />
      </div>
    </section>
  )
}
