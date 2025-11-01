export type UpcomingEventRecord = {
  id: string | number
  title: string
  date: string
  time: string
  type: "Community" | "Corporate" | string
  location: string
  attendees: number
  description: string
  speakers: string[]
  status: string
  registrationUrl: string
}

export type PastEventRecord = {
  id?: string | number
  title: string
  date: string
  type: "Community" | "Corporate" | string
  attendees: number
  impact: string
  description: string
  learnUrl: string
}

// Supabase is now the primary source of truth for events. These fallbacks are intentionally
// empty so that the UI renders dedicated empty states when remote data is unavailable.
export const upcomingEventsFallback: UpcomingEventRecord[] = []

export const pastEventsFallback: PastEventRecord[] = []
