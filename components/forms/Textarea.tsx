"use client"

import { forwardRef } from "react"
import type { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const baseStyles =
  "block w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref
) {
  return <textarea ref={ref} rows={rows} className={cn(baseStyles, className)} {...props} />
})
