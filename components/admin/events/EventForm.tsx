"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"
import type { EventFormInput, EventFormState } from "@/app/(admin)/events/actions"
import { FormField } from "@/components/forms/FormField"
import { TextInput } from "@/components/forms/TextInput"
import { Textarea } from "@/components/forms/Textarea"
import { Select } from "@/components/forms/Select"
import { cn } from "@/lib/utils"

type EventTypeOption = {
  id: string
  label: string
}

type EventFormProps = {
  eventTypes: EventTypeOption[]
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>
  initialValues?: Partial<EventFormInput>
  submitLabel?: string
  footer?: ReactNode
}

const formatOptions = [
  { value: "in_person", label: "In-person" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
]

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "limited", label: "Limited" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
]

type ErrorMap = Record<string, string[] | undefined>

const getFieldError = (errors: ErrorMap | undefined, key: string) => {
  if (!errors) return undefined
  const value = errors[key]
  return value && value.length > 0 ? value[0] : undefined
}

const toLocalDateTime = (iso?: string | null) => {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const tzOffset = date.getTimezoneOffset() * 60000
  const localTime = new Date(date.getTime() - tzOffset)
  return localTime.toISOString().slice(0, 16)
}

const toInputValue = (value?: string | null) => value ?? ""

const Alert = ({
  variant = "error",
  children,
}: {
  variant?: "error" | "success"
  children: ReactNode
}) => {
  const styles =
    variant === "error"
      ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
      : "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"

  return <div className={cn("rounded-md border px-3 py-2 text-sm", styles)}>{children}</div>
}

const SubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  )
}

export function EventForm({ eventTypes, action, initialValues, submitLabel = "Save changes", footer }: EventFormProps) {
  const [state, formAction] = useFormState<EventFormState>(action, { errors: {} })

  const typeOptions = useMemo(() => {
    if (eventTypes.length > 0) {
      return eventTypes
    }

    return []
  }, [eventTypes])

  const fieldErrors = state.errors
  const formError = fieldErrors?._form?.[0]

  return (
    <form action={formAction} className="space-y-8">
      {formError ? <Alert>{formError}</Alert> : null}
      {state.message ? <Alert variant="success">{state.message}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          label="Title"
          htmlFor="title"
          required
          error={getFieldError(fieldErrors, "title")}
          description="Public title displayed across the website."
        >
          <TextInput id="title" name="title" defaultValue={toInputValue(initialValues?.title)} required />
        </FormField>
        <FormField
          label="Slug"
          htmlFor="slug"
          required
          error={getFieldError(fieldErrors, "slug")}
          description="Used in URLs, lowercase with dashes."
        >
          <TextInput id="slug" name="slug" defaultValue={toInputValue(initialValues?.slug)} required />
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          label="Event type"
          htmlFor="type_id"
          required
          error={getFieldError(fieldErrors, "type_id")}
          description="Choose the category that best represents the event."
        >
          <Select id="type_id" name="type_id" defaultValue={toInputValue(initialValues?.type_id ?? undefined)} required>
            <option value="">Select a type</option>
            {typeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Status"
          htmlFor="status"
          required
          error={getFieldError(fieldErrors, "status")}
          description="Control visibility across the public site."
        >
          <Select id="status" name="status" defaultValue={toInputValue(initialValues?.status)} required>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          label="Format"
          htmlFor="format"
          required
          error={getFieldError(fieldErrors, "format")}
          description="How attendees participate in the event."
        >
          <Select id="format" name="format" defaultValue={toInputValue(initialValues?.format)} required>
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Expected attendees"
          htmlFor="expected_attendees"
          error={getFieldError(fieldErrors, "expected_attendees")}
          description="Optional forecast for planning capacity."
        >
          <TextInput
            id="expected_attendees"
            name="expected_attendees"
            type="number"
            min={0}
            step={1}
            defaultValue={initialValues?.expected_attendees?.toString() ?? ""}
          />
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          label="Start date"
          htmlFor="start_at"
          required
          error={getFieldError(fieldErrors, "start_at")}
        >
          <TextInput
            id="start_at"
            name="start_at"
            type="datetime-local"
            defaultValue={toLocalDateTime(initialValues?.start_at ?? null)}
            required
          />
        </FormField>
        <FormField
          label="End date"
          htmlFor="end_at"
          required
          error={getFieldError(fieldErrors, "end_at")}
        >
          <TextInput
            id="end_at"
            name="end_at"
            type="datetime-local"
            defaultValue={toLocalDateTime(initialValues?.end_at ?? null)}
            required
          />
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          label="Timezone"
          htmlFor="timezone"
          required
          error={getFieldError(fieldErrors, "timezone")}
          description="IANA timezone identifier such as Asia/Kolkata."
        >
          <TextInput id="timezone" name="timezone" defaultValue={toInputValue(initialValues?.timezone)} required />
        </FormField>
        <FormField
          label="Display order"
          htmlFor="display_order"
          description="Lower numbers appear first in listings."
          error={getFieldError(fieldErrors, "display_order")}
        >
          <TextInput
            id="display_order"
            name="display_order"
            type="number"
            step={1}
            defaultValue={initialValues?.display_order?.toString() ?? ""}
          />
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FormField label="Venue name" htmlFor="venue_name" error={getFieldError(fieldErrors, "venue_name")}>
          <TextInput id="venue_name" name="venue_name" defaultValue={toInputValue(initialValues?.venue_name)} />
        </FormField>
        <FormField label="City" htmlFor="venue_city" error={getFieldError(fieldErrors, "venue_city")}>
          <TextInput id="venue_city" name="venue_city" defaultValue={toInputValue(initialValues?.venue_city)} />
        </FormField>
        <FormField label="Country" htmlFor="venue_country" error={getFieldError(fieldErrors, "venue_country")}>
          <TextInput id="venue_country" name="venue_country" defaultValue={toInputValue(initialValues?.venue_country)} />
        </FormField>
      </div>

      <FormField label="Summary" htmlFor="summary" error={getFieldError(fieldErrors, "summary")}>
        <Textarea id="summary" name="summary" rows={3} defaultValue={toInputValue(initialValues?.summary ?? undefined)} />
      </FormField>

      <FormField label="Description" htmlFor="description" error={getFieldError(fieldErrors, "description")}>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={toInputValue(initialValues?.description ?? undefined)}
        />
      </FormField>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField label="Registration URL" htmlFor="registration_url" error={getFieldError(fieldErrors, "registration_url")}>
          <TextInput
            id="registration_url"
            name="registration_url"
            type="url"
            placeholder="https://"
            defaultValue={toInputValue(initialValues?.registration_url)}
          />
        </FormField>
        <FormField label="Recap URL" htmlFor="recap_url" error={getFieldError(fieldErrors, "recap_url")}>
          <TextInput
            id="recap_url"
            name="recap_url"
            type="url"
            placeholder="https://"
            defaultValue={toInputValue(initialValues?.recap_url)}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SubmitButton label={submitLabel} />
          <Link
            href="/(admin)/events"
            className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
          >
            Cancel
          </Link>
        </div>
        {footer ?? null}
      </div>
    </form>
  )
}
