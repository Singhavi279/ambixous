"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"

export type EventFormState = {
  errors?: Record<string, string[]>
  message?: string
}

const optionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  })

const optionalUrl = optionalString.refine((value) => {
  if (!value) return true
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}, "Enter a valid URL")

const expectedAttendeesField = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value, ctx) => {
    if (value === undefined || value === null) return null
    const stringValue = typeof value === "number" ? String(value) : value.trim()
    if (!stringValue) return null

    const parsed = Number(stringValue)
    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected attendees must be a non-negative number",
      })
      return z.NEVER
    }

    return Math.round(parsed)
  })

const displayOrderField = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value, ctx) => {
    if (value === undefined || value === null) return null
    const stringValue = typeof value === "number" ? String(value) : value.trim()
    if (!stringValue) return null

    const parsed = Number(stringValue)
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Display order must be a number",
      })
      return z.NEVER
    }

    return Math.round(parsed)
  })

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

const dateField = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .refine((value) => value.length > 0, `${field} is required`)
    .refine((value) => DATETIME_LOCAL_PATTERN.test(value), `Provide a valid ${field.toLowerCase()}`)

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>()

const getZonedFormatter = (timeZone: string) => {
  const cacheKey = timeZone
  if (!zonedFormatterCache.has(cacheKey)) {
    zonedFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    )
  }

  return zonedFormatterCache.get(cacheKey)!
}

type DateTimeParseResult =
  | { success: true; iso: string }
  | { success: false; errorField: "datetime" | "timezone"; message: string }

const toNumber = (value: string) => Number.parseInt(value, 10)

const getZonedInfo = (formatter: Intl.DateTimeFormat, utcMs: number) => {
  const parts = formatter.formatToParts(new Date(utcMs))
  const map = new Map<string, string>()

  for (const part of parts) {
    if (part.type !== "literal") {
      map.set(part.type, part.value)
    }
  }

  const year = map.get("year")
  const month = map.get("month")
  const day = map.get("day")
  const hour = map.get("hour")
  const minute = map.get("minute")
  const second = map.get("second") ?? "00"

  if (!year || !month || !day || !hour || !minute) {
    return null
  }

  const formatted = `${year}-${month}-${day}T${hour}:${minute}:${second}`
  const asUtc = Date.UTC(
    toNumber(year),
    toNumber(month) - 1,
    toNumber(day),
    toNumber(hour),
    toNumber(minute),
    toNumber(second)
  )

  return { formatted, asUtc }
}

const parseDateTimeInTimezone = (value: string, timeZone: string, fieldLabel: string): DateTimeParseResult => {
  const match = DATETIME_LOCAL_PATTERN.exec(value)
  if (!match) {
    return { success: false, errorField: "datetime", message: `Provide a valid ${fieldLabel}` }
  }

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match
  const secondNormalized = secondStr ?? "00"

  const desiredUtc = Date.UTC(
    toNumber(yearStr),
    toNumber(monthStr) - 1,
    toNumber(dayStr),
    toNumber(hourStr),
    toNumber(minuteStr),
    toNumber(secondNormalized)
  )

  let formatter: Intl.DateTimeFormat
  try {
    formatter = getZonedFormatter(timeZone)
  } catch {
    return { success: false, errorField: "timezone", message: "Provide a valid timezone" }
  }

  let utcMs = desiredUtc

  for (let i = 0; i < 5; i += 1) {
    const zonedInfo = getZonedInfo(formatter, utcMs)
    if (!zonedInfo) {
      break
    }

    if (zonedInfo.formatted === `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondNormalized}`) {
      return { success: true, iso: new Date(utcMs).toISOString() }
    }

    const diff = desiredUtc - zonedInfo.asUtc
    if (diff === 0) {
      break
    }

    utcMs += diff
  }

  const finalInfo = getZonedInfo(formatter, utcMs)

  if (finalInfo && finalInfo.formatted === `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondNormalized}`) {
    return { success: true, iso: new Date(utcMs).toISOString() }
  }

  return { success: false, errorField: "datetime", message: `Provide a valid ${fieldLabel}` }
}

const formatField = z.enum(["in_person", "virtual", "hybrid"], {
  required_error: "Select a format",
})

const statusField = z.enum(["draft", "published", "limited", "closed", "cancelled", "archived"], {
  required_error: "Select a status",
})

const eventSchema = z
  .object({
    slug: z
      .string({ required_error: "Slug is required" })
      .trim()
      .min(1, "Slug is required"),
    title: z
      .string({ required_error: "Title is required" })
      .trim()
      .min(1, "Title is required"),
    summary: optionalString,
    description: optionalString,
    type_id: z
      .string({ required_error: "Select an event type" })
      .trim()
      .uuid({ message: "Select an event type" }),
    format: formatField,
    status: statusField,
    start_at: dateField("Start date"),
    end_at: dateField("End date"),
    timezone: z
      .string({ required_error: "Timezone is required" })
      .trim()
      .min(1, "Timezone is required"),
    venue_name: optionalString,
    venue_city: optionalString,
    venue_country: optionalString,
    registration_url: optionalUrl,
    recap_url: optionalUrl,
    expected_attendees: expectedAttendeesField,
    display_order: displayOrderField,
  })
  .superRefine((values, ctx) => {
    let timezoneIssueReported = false

    const normalize = (field: "start_at" | "end_at", label: string) => {
      const result = parseDateTimeInTimezone(values[field], values.timezone, label.toLowerCase())

      if (!result.success) {
        const path = result.errorField === "timezone" ? ["timezone"] : [field]

        if (result.errorField === "timezone") {
          if (!timezoneIssueReported) {
            ctx.addIssue({
              path,
              code: z.ZodIssueCode.custom,
              message: result.message,
            })
            timezoneIssueReported = true
          }
        } else {
          ctx.addIssue({
            path,
            code: z.ZodIssueCode.custom,
            message: result.message,
          })
        }

        return null
      }

      values[field] = result.iso
      return result.iso
    }

    const startIso = normalize("start_at", "Start date")
    const endIso = normalize("end_at", "End date")

    if (startIso && endIso) {
      const start = new Date(startIso)
      const end = new Date(endIso)

      if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          path: ["end_at"],
          code: z.ZodIssueCode.custom,
          message: "End date must be after the start date",
        })
      }
    }
  })

export type EventFormInput = z.input<typeof eventSchema>

type EventPayload = z.infer<typeof eventSchema>

const mapError = (result: z.SafeParseError<EventPayload>) => {
  const { fieldErrors, formErrors } = result.error.flatten()
  const errors: Record<string, string[]> = { ...fieldErrors }

  if (formErrors.length) {
    errors._form = formErrors
  }

  return { errors }
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return {
      errors: {
        _form: ["Supabase credentials are missing. Configure the environment variables to continue."],
      },
    }
  }

  const formValues = Object.fromEntries(formData.entries())
  const parsed = eventSchema.safeParse(formValues)

  if (!parsed.success) {
    return mapError(parsed)
  }

  const payload = parsed.data

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return {
      errors: { _form: [authError.message] },
    }
  }

  if (!user) {
    return {
      errors: { _form: ["You must be signed in to create events."] },
    }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary,
      description: payload.description,
      type_id: payload.type_id,
      format: payload.format,
      status: payload.status,
      start_at: payload.start_at,
      end_at: payload.end_at,
      timezone: payload.timezone,
      venue_name: payload.venue_name,
      venue_city: payload.venue_city,
      venue_country: payload.venue_country,
      registration_url: payload.registration_url,
      recap_url: payload.recap_url,
      expected_attendees: payload.expected_attendees,
      display_order: payload.display_order,
    })
    .select("id")
    .single()

  if (error || !data) {
    return {
      errors: { _form: [error?.message ?? "Failed to create the event."] },
    }
  }

  revalidatePath("/(admin)/events")
  redirect(`/(admin)/events/${data.id}/edit`)
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return {
      errors: {
        _form: ["Supabase credentials are missing. Configure the environment variables to continue."],
      },
    }
  }

  const formValues = Object.fromEntries(formData.entries())
  const parsed = eventSchema.safeParse(formValues)

  if (!parsed.success) {
    return mapError(parsed)
  }

  const payload = parsed.data

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return {
      errors: { _form: [authError.message] },
    }
  }

  if (!user) {
    return {
      errors: { _form: ["You must be signed in to update events."] },
    }
  }

  const { error } = await supabase
    .from("events")
    .update({
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary,
      description: payload.description,
      type_id: payload.type_id,
      format: payload.format,
      status: payload.status,
      start_at: payload.start_at,
      end_at: payload.end_at,
      timezone: payload.timezone,
      venue_name: payload.venue_name,
      venue_city: payload.venue_city,
      venue_country: payload.venue_country,
      registration_url: payload.registration_url,
      recap_url: payload.recap_url,
      expected_attendees: payload.expected_attendees,
      display_order: payload.display_order,
    })
    .eq("id", eventId)

  if (error) {
    return {
      errors: { _form: [error.message] },
    }
  }

  revalidatePath("/(admin)/events")
  revalidatePath(`/(admin)/events/${eventId}/edit`)

  return {
    message: "Event updated successfully.",
  }
}
