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

const dateField = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .transform((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} is required` })
        return z.NEVER
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Provide a valid ${field.toLowerCase()}` })
        return z.NEVER
      }
      return date.toISOString()
    })

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
    const start = new Date(values.start_at)
    const end = new Date(values.end_at)
    if (end.getTime() < start.getTime()) {
      ctx.addIssue({
        path: ["end_at"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after the start date",
      })
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
