"use client"

import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const baseStyles =
  "block w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60"

type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, type = "text", ...props },
  ref
) {
  return <input ref={ref} type={type} className={cn(baseStyles, className)} {...props} />
})
