"use client"

import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const baseStyles =
  "block w-full appearance-none rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(baseStyles, className)} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">▾</span>
    </div>
  )
})
