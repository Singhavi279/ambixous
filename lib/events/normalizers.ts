import type { PastEventRecord, UpcomingEventRecord } from "@/components/events/data"

export type UpcomingEventRow = {
  id: string
  title: string
  summary: string | null
  description: string | null
  start_at: string | null
  end_at: string | null
  timezone: string | null
  type_label: string | null
  venue_name: string | null
  venue_city: string | null
  venue_country: string | null
  registration_url: string | null
  expected_attendees: number | null
  status: string | null
  speakers: string[] | null
}

export type PastEventRow = {
  id: string
  title: string
  summary: string | null
  description: string | null
  start_at: string | null
  end_at: string | null
  timezone: string | null
  type_label: string | null
  venue_city: string | null
  venue_country: string | null
  registration_url: string | null
  recap_url: string | null
  expected_attendees: number | null
  actual_attendees: number | null
  impact_summary: string | null
}

export const titleCase = (value: string | null | undefined) => {
  if (!value) return ""
  return value
    .split(/[ _\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export const formatDate = (iso: string | null, timezone: string | null) => {
  if (!iso) return ""
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeZone: timezone ?? "UTC",
    }).format(new Date(iso))
  } catch (error) {
    console.warn("Unable to format date", error)
    return ""
  }
}

export const formatTimeRange = (
  startIso: string | null,
  endIso: string | null,
  timezone: string | null
) => {
  if (!startIso || !endIso) return ""
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone ?? "UTC",
    })
    return `${formatter.format(new Date(startIso))} – ${formatter.format(new Date(endIso))}`
  } catch (error) {
    console.warn("Unable to format time range", error)
    return ""
  }
}

export const resolveLocation = (row: UpcomingEventRow | PastEventRow) => {
  const parts = [row.venue_city, row.venue_country].filter(Boolean)
  if (parts.length === 0) {
    return row.venue_city ?? row.venue_country ?? ""
  }
  return parts.join(", ")
}

export const normalizeUpcomingEvent = (
  row: UpcomingEventRow
): UpcomingEventRecord => {
  return {
    id: row.id,
    title: row.title,
    date: formatDate(row.start_at, row.timezone) || "",
    time: formatTimeRange(row.start_at, row.end_at, row.timezone) || "",
    type: row.type_label ?? "Community",
    location: resolveLocation(row) || "",
    attendees: row.expected_attendees ?? 0,
    description: row.summary ?? row.description ?? "",
    speakers: Array.isArray(row.speakers) ? row.speakers.filter(Boolean) : [],
    status: titleCase(row.status) || "Published",
    registrationUrl: row.registration_url ?? "#",
  }
}

export const normalizePastEvent = (row: PastEventRow): PastEventRecord => {
  return {
    id: row.id,
    title: row.title,
    date: formatDate(row.start_at ?? row.end_at, row.timezone) || "",
    type: row.type_label ?? "Community",
    attendees: row.actual_attendees ?? row.expected_attendees ?? 0,
    impact: row.impact_summary ?? "",
    description: row.summary ?? row.description ?? "",
    learnUrl: row.recap_url ?? row.registration_url ?? "#",
  }
}
