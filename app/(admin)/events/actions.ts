"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient"
import {
  createEventSchema,
  deleteEventSchema,
  updateEventSchema,
  type CreateEventPayload,
  type DeleteEventPayload,
} from "@/lib/validation/events"

type ActionErrors = Record<string, string[]>

type ActionResponse<T = Record<string, never>> =
  | { success: true; data?: T }
  | { success: false; errors?: ActionErrors; message: string }

const normalizeInput = (input: FormData | Record<string, unknown> | null | undefined) => {
  if (input instanceof FormData) {
    const payload: Record<string, unknown> = {}
    input.forEach((value, key) => {
      if (typeof value === "string") {
        payload[key] = value
      }
    })
    return payload
  }

  if (typeof input === "object" && input !== null) {
    return input
  }

  return {}
}

const collectZodErrors = (error: ZodError): ActionErrors => {
  return error.issues.reduce<ActionErrors>((acc, issue) => {
    const key = issue.path.join(".") || "_"
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(issue.message)
    return acc
  }, {})
}

export const createEvent = async (
  input: FormData | Record<string, unknown>
): Promise<ActionResponse<{ id: string }>> => {
  let supabase: ReturnType<typeof getSupabaseAdminClient>

  try {
    supabase = getSupabaseAdminClient()
  } catch (error) {
    console.error("Supabase admin client is not configured", error)
    return {
      success: false,
      message: "Supabase is not configured for admin operations.",
    }
  }
  const parsed = createEventSchema.safeParse(normalizeInput(input))

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid event data.",
      errors: collectZodErrors(parsed.error),
    }
  }

  const payload: CreateEventPayload = parsed.data

  const { data, error } = await supabase.from("events").insert(payload).select("id").single()

  if (error) {
    console.error("Failed to create event", error)
    return {
      success: false,
      message: "Failed to create event.",
    }
  }

  await revalidatePath("/events")

  return {
    success: true,
    data: { id: data.id },
  }
}

export const updateEvent = async (
  input: FormData | Record<string, unknown>
): Promise<ActionResponse<{ id: string }>> => {
  let supabase: ReturnType<typeof getSupabaseAdminClient>

  try {
    supabase = getSupabaseAdminClient()
  } catch (error) {
    console.error("Supabase admin client is not configured", error)
    return {
      success: false,
      message: "Supabase is not configured for admin operations.",
    }
  }
  const parsed = updateEventSchema.safeParse(normalizeInput(input))

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid event data.",
      errors: collectZodErrors(parsed.error),
    }
  }

  const { id, ...values } = parsed.data
  const updates: CreateEventPayload = values

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Failed to update event", error)
    return {
      success: false,
      message: "Failed to update event.",
    }
  }

  if (!data) {
    return {
      success: false,
      message: "Event not found.",
    }
  }

  await revalidatePath("/events")

  return {
    success: true,
    data: { id: data.id },
  }
}

export const deleteEvent = async (
  input: FormData | Record<string, unknown>
): Promise<ActionResponse<{ id: string }>> => {
  let supabase: ReturnType<typeof getSupabaseAdminClient>

  try {
    supabase = getSupabaseAdminClient()
  } catch (error) {
    console.error("Supabase admin client is not configured", error)
    return {
      success: false,
      message: "Supabase is not configured for admin operations.",
    }
  }
  const parsed = deleteEventSchema.safeParse(normalizeInput(input))

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid event data.",
      errors: collectZodErrors(parsed.error),
    }
  }

  const payload: DeleteEventPayload = parsed.data

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", payload.id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Failed to delete event", error)
    return {
      success: false,
      message: "Failed to delete event.",
    }
  }

  if (!data) {
    return {
      success: false,
      message: "Event not found.",
    }
  }

  await revalidatePath("/events")

  return {
    success: true,
    data: { id: data.id },
  }
}
