import { z } from "zod"

export const EVENT_STATUS_OPTIONS = [
  "draft",
  "published",
  "limited",
  "closed",
  "cancelled",
  "archived",
] as const

export const EVENT_FORMAT_OPTIONS = ["in_person", "virtual", "hybrid"] as const

const toNullableString = () =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((value) => {
      if (typeof value !== "string") {
        return null
      }
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
    })

const optionalUrl = (label: string) =>
  toNullableString().superRefine((value, ctx) => {
    if (value === null) {
      return
    }

    const isValid = typeof URL.canParse === "function" ? URL.canParse(value) : (() => {
      try {
        const parsed = new URL(value)
        void parsed
        return true
      } catch {
        return false
      }
    })()

    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must be a valid URL`,
      })
    }
  })

const optionalInteger = (label: string) =>
  z
    .preprocess((value) => {
      if (value === "" || value === undefined || value === null) {
        return undefined
      }
      return value
    }, z.coerce.number({ invalid_type_error: `${label} must be a number` }).int({ message: `${label} must be an integer` }).nonnegative({ message: `${label} cannot be negative` }).optional())
    .transform((value) => value ?? null)

const optionalBoolean = () =>
  z
    .union([z.boolean(), z.string(), z.number(), z.undefined(), z.null()])
    .transform((value) => {
      if (value === undefined || value === null) {
        return false
      }
      if (typeof value === "boolean") {
        return value
      }
      if (typeof value === "number") {
        return value === 1
      }
      const normalized = value.toString().trim().toLowerCase()
      if (["true", "1", "yes", "on"].includes(normalized)) {
        return true
      }
      if (["false", "0", "no", "off"].includes(normalized)) {
        return false
      }
      return false
    })

const requiredDateTime = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .transform((value, ctx) => {
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid date`,
        })
        return z.NEVER
      }
      return parsed.toISOString()
    })

const optionalDateTime = (label: string) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((value, ctx) => {
      if (typeof value !== "string") {
        return null
      }
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        return null
      }
      const parsed = new Date(trimmed)
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid date`,
        })
        return z.NEVER
      }
      return parsed.toISOString()
    })

const slugSchema = z
  .string({ required_error: "Slug is required" })
  .trim()
  .min(1, "Slug is required")
  .max(255, "Slug must be 255 characters or fewer")
  .transform((value, ctx) => {
    const normalized = value.toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
      })
      return z.NEVER
    }
    return normalized
  })

const titleSchema = z
  .string({ required_error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(255, "Title must be 255 characters or fewer")

const timezoneSchema = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") {
      return "Asia/Kolkata"
    }
    const trimmed = value.trim()
    return trimmed.length === 0 ? "Asia/Kolkata" : trimmed
  })

const formatSchema = z
  .preprocess((value) => {
    if (value === "" || value === undefined || value === null) {
      return undefined
    }
    if (typeof value === "string") {
      return value.trim()
    }
    return value
  }, z.enum(EVENT_FORMAT_OPTIONS).default("in_person"))

const statusSchema = z
  .preprocess((value) => {
    if (typeof value === "string") {
      return value.trim()
    }
    return value
  }, z.enum(EVENT_STATUS_OPTIONS).default("draft"))

const eventBaseSchema = z
  .object({
    slug: slugSchema,
    title: titleSchema,
    subtitle: toNullableString(),
    summary: toNullableString(),
    description: toNullableString(),
    type_id: z
      .string({ required_error: "Event type is required" })
      .trim()
      .uuid({ message: "Event type must be a valid UUID" }),
    format: formatSchema,
    venue_name: toNullableString(),
    venue_address: toNullableString(),
    venue_city: toNullableString(),
    venue_state: toNullableString(),
    venue_country: toNullableString(),
    registration_url: optionalUrl("Registration URL"),
    recap_url: optionalUrl("Recap URL"),
    expected_attendees: optionalInteger("Expected attendees"),
    status: statusSchema,
    start_at: requiredDateTime("Start date"),
    end_at: requiredDateTime("End date"),
    timezone: timezoneSchema,
    hero_media_url: optionalUrl("Hero media URL"),
    display_order: optionalInteger("Display order"),
    is_featured: optionalBoolean(),
    published_at: optionalDateTime("Published date"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (new Date(data.end_at).getTime() < new Date(data.start_at).getTime()) {
      ctx.addIssue({
        path: ["end_at"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after the start date",
      })
    }
  })

export const createEventSchema = eventBaseSchema

export const updateEventSchema = eventBaseSchema.extend({
  id: z.string({ required_error: "Event id is required" }).trim().uuid({ message: "Event id must be a valid UUID" }),
})

export const deleteEventSchema = z.object({
  id: z.string({ required_error: "Event id is required" }).trim().uuid({ message: "Event id must be a valid UUID" }),
})

export type CreateEventPayload = z.infer<typeof createEventSchema>
export type UpdateEventPayload = z.infer<typeof updateEventSchema>
export type DeleteEventPayload = z.infer<typeof deleteEventSchema>
