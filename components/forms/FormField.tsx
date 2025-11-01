import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
  description?: string
  error?: string
  required?: boolean
}

export function FormField({
  label,
  htmlFor,
  children,
  className,
  description,
  error,
  required,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-200">
          {label}
          {required ? <span className="ml-1 text-rose-400">*</span> : null}
        </label>
        {error ? <span className="text-xs font-medium text-rose-400">{error}</span> : null}
      </div>
      {description ? <p className="text-xs text-slate-400">{description}</p> : null}
      {children}
    </div>
  )
}
