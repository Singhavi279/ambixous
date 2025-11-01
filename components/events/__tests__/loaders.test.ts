import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  loadPastEvents,
  loadUpcomingEvents,
} from "@/components/events/loaders"
import {
  pastEventsFallback,
  upcomingEventsFallback,
} from "@/components/events/data"

interface StubQueryResult<T> {
  data: T[] | null
  error: { message: string } | null
}

type StubOptions<T> = {
  rows: T[] | null
  error?: { message: string } | null
  throwOnOrder?: boolean
}

const createStubClient = <T>({ rows, error = null, throwOnOrder = false }: StubOptions<T>): SupabaseClient => {
  const order = vi.fn(async (): Promise<StubQueryResult<T>> => {
    if (throwOnOrder) {
      throw new Error("network down")
    }

    return {
      data: rows,
      error,
    }
  })

  const select = vi.fn(() => ({ order }))
  const from = vi.fn(() => ({ select }))

  return { from } as unknown as SupabaseClient
}

describe("event loaders", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

  beforeEach(() => {
    consoleError.mockClear()
  })

  afterEach(() => {
    delete (globalThis as { Sentry?: unknown }).Sentry
  })

  it("returns fallback data when no client is provided", async () => {
    expect(await loadUpcomingEvents(null)).toEqual(upcomingEventsFallback)
    expect(await loadPastEvents(null)).toEqual(pastEventsFallback)
  })

  it("normalizes Supabase rows", async () => {
    const client = createStubClient({
      rows: [
        {
          id: "1",
          title: "Community Meetup",
          summary: "",
          description: "Meet builders in the city",
          start_at: "2025-01-15T10:00:00Z",
          end_at: "2025-01-15T12:00:00Z",
          timezone: "UTC",
          type_label: "Community",
          venue_name: "",
          venue_city: "Austin",
          venue_country: "USA",
          registration_url: "https://example.com",
          expected_attendees: 120,
          status: "published",
          speakers: ["Ada"],
        },
      ],
    })

    const [result] = await loadUpcomingEvents(client)
    expect(result).toMatchObject({
      id: "1",
      title: "Community Meetup",
      location: "Austin, USA",
      registrationUrl: "https://example.com",
    })
  })

  it("returns an empty array when Supabase responds with no rows", async () => {
    const client = createStubClient({ rows: [] })
    const result = await loadUpcomingEvents(client)

    expect(result).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("reports errors to Sentry and logs when Supabase returns an error", async () => {
    const captureException = vi.fn()
    ;(globalThis as { Sentry?: { captureException?: typeof captureException } }).Sentry = {
      captureException,
    }

    const client = createStubClient({ rows: null, error: { message: "Boom" } })
    const result = await loadUpcomingEvents(client)

    expect(result).toEqual(upcomingEventsFallback)
    expect(captureException).toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("loadUpcomingEvents"),
      expect.objectContaining({ table: expect.any(String), error: expect.anything() })
    )
  })

  it("falls back gracefully when Supabase throws", async () => {
    const client = createStubClient({ rows: null, throwOnOrder: true })
    const result = await loadPastEvents(client)

    expect(result).toEqual(pastEventsFallback)
    expect(consoleError).toHaveBeenCalled()
  })
})
