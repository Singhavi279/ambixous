import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import {
  normalizePastEvent,
  normalizeUpcomingEvent,
  type PastEventRow,
  type UpcomingEventRow,
} from "@/lib/events/normalizers"

import {
  pastEventsFallback,
  type PastEventRecord,
  upcomingEventsFallback,
  type UpcomingEventRecord,
} from "./data"

const UPCOMING_EVENTS_TABLE = "view_upcoming_events"
const PAST_EVENTS_TABLE = "view_past_events"

const UPCOMING_COLUMNS =
  "id, title, summary, description, start_at, end_at, timezone, type_label, venue_name, venue_city, venue_country, registration_url, expected_attendees, status, speakers"

const PAST_COLUMNS =
  "id, title, summary, description, start_at, end_at, timezone, type_label, venue_city, venue_country, registration_url, recap_url, expected_attendees, actual_attendees, impact_summary"

type LoaderOperation = "loadUpcomingEvents" | "loadPastEvents"

type SupabaseErrorLike = PostgrestError | Error | { message?: string } | null | undefined

type SentryCapture = (error: unknown, captureContext?: { [key: string]: unknown }) => void

type GlobalWithSentry = typeof globalThis & {
  Sentry?: {
    captureException?: SentryCapture
  }
}

const ensureError = (error: SupabaseErrorLike): Error => {
  if (error instanceof Error) {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = typeof error.message === "string" ? error.message : "Unknown Supabase error"
    const enriched = new Error(message)
    return Object.assign(enriched, error)
  }

  return new Error("Unknown Supabase error")
}

const reportSupabaseError = (
  operation: LoaderOperation,
  error: SupabaseErrorLike,
  metadata: { table: string }
) => {
  if (!error) return

  const normalizedError = ensureError(error)
  const { Sentry } = globalThis as GlobalWithSentry

  if (Sentry?.captureException) {
    try {
      Sentry.captureException(normalizedError, {
        tags: {
          module: "events",
          operation,
        },
        extra: {
          table: metadata.table,
        },
      })
    } catch (sentryError) {
      console.error("Failed to send Supabase error to Sentry", sentryError)
    }
  }

  console.error(`Failed to ${operation}`, {
    table: metadata.table,
    error,
  })
}

const handleQuery = async <T extends UpcomingEventRow | PastEventRow, R extends UpcomingEventRecord | PastEventRecord>(
  client: SupabaseClient | null,
  operation: LoaderOperation,
  table: string,
  columns: string,
  normalizer: (row: T) => R,
  fallback: R[]
): Promise<R[]> => {
  if (!client) {
    return fallback
  }

  try {
    const { data, error } = await client.from<T>(table).select(columns).order(operation === "loadUpcomingEvents" ? "start_at" : "end_at", {
      ascending: operation === "loadUpcomingEvents",
    })

    if (error) {
      reportSupabaseError(operation, error, { table })
      return fallback
    }

    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    return data.map(normalizer)
  } catch (unexpectedError) {
    reportSupabaseError(operation, unexpectedError as SupabaseErrorLike, { table })
    return fallback
  }
}

export const loadUpcomingEvents = async (
  client: SupabaseClient | null
): Promise<UpcomingEventRecord[]> => {
  return handleQuery<UpcomingEventRow, UpcomingEventRecord>(
    client,
    "loadUpcomingEvents",
    UPCOMING_EVENTS_TABLE,
    UPCOMING_COLUMNS,
    normalizeUpcomingEvent,
    upcomingEventsFallback
  )
}

export const loadPastEvents = async (
  client: SupabaseClient | null
): Promise<PastEventRecord[]> => {
  return handleQuery<PastEventRow, PastEventRecord>(
    client,
    "loadPastEvents",
    PAST_EVENTS_TABLE,
    PAST_COLUMNS,
    normalizePastEvent,
    pastEventsFallback
  )
}
