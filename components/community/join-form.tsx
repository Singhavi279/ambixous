"use client"

import { useRef, useState } from "react"
import { ClipboardList, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSetuCjRbgIeiRmfkQ7dG61OcnnqUja6G8K7NbvEygYZt6GEWQ/viewform"

/**
 * Click-to-load facade for the Google Form. The iframe (and the third-party
 * cookies and ~1 MB of Google scripts it brings) only loads when a visitor
 * asks for it, so the page stays fast and cookie-free until then.
 */
export function JoinForm() {
  const [open, setOpen] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  if (open) {
    return (
      <div className="bg-white rounded-xl overflow-hidden">
        <iframe
          ref={frameRef}
          src={`${FORM_URL}?embedded=true`}
          width="100%"
          height="600"
          title="Ambixous Community registration form"
          className="w-full border-0"
          onLoad={() => frameRef.current?.focus()}
        >
          Loading…
        </iframe>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10">
      <ClipboardList className="text-ambixous-neon" size={32} aria-hidden="true" />
      <p className="max-w-md text-slate-gray">
        The form takes about two minutes. It opens here, inside the page.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          onClick={() => setOpen(true)}
          className="min-h-11 bg-ambixous-neon font-semibold text-electric-ink hover:bg-ambixous-neon/90 focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-electric-ink"
        >
          Open the join form
        </Button>
        <a
          href={FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-warm-white underline underline-offset-4 hover:text-ambixous-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ambixous-neon"
        >
          Open in Google Forms
          <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  )
}
