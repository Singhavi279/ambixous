import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"
import { EventForm } from "@/components/admin/events/EventForm"
import { createEvent } from "../actions"

const calloutClasses = "rounded-lg border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300"

export default async function NewEventPage() {
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

  const { data: eventTypes } = await supabase
    .from("event_types")
    .select("id, label")
    .order("display_order", { ascending: true })

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Create a new event</h1>
          <p className="text-sm text-slate-400">
            Draft the details and publish when you&apos;re ready to share with the community.
          </p>
        </div>
        <Link
          href="/(admin)/events"
          className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
        >
          Back to events
        </Link>
      </header>

      <div className="rounded-lg border border-white/10 bg-slate-950/60 p-6 shadow-xl">
        <EventForm eventTypes={eventTypes ?? []} action={createEvent} submitLabel="Create event" />
      </div>
    </section>
  )
}
