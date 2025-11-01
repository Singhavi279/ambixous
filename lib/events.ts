import { cache } from "react"
import type { PastEventRecord, UpcomingEventRecord } from "@/components/events/data"
import { loadPastEvents as loadPastEventsImpl, loadUpcomingEvents as loadUpcomingEventsImpl } from "@/components/events/loaders"
import { getSupabaseClient } from "@/lib/supabase/client"

export {
  formatDate,
  formatTimeRange,
  normalizePastEvent,
  normalizeUpcomingEvent,
  resolveLocation,
  titleCase,
  type PastEventRow,
  type UpcomingEventRow,
} from "./events/normalizers"

export const loadUpcomingEvents = loadUpcomingEventsImpl
export const loadPastEvents = loadPastEventsImpl

const fetchUpcoming = cache(async (): Promise<UpcomingEventRecord[]> => {
  return loadUpcomingEventsImpl(getSupabaseClient())
})

const fetchPast = cache(async (): Promise<PastEventRecord[]> => {
  return loadPastEventsImpl(getSupabaseClient())
})

export const fetchEventsPageData = cache(async () => {
  const [upcomingEvents, pastEvents] = await Promise.all([fetchUpcoming(), fetchPast()])

  return {
    upcomingEvents,
    pastEvents,
  }
})
