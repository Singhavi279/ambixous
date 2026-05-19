"use client"

import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"

const STORAGE_KEY = "ambixous_site_intro_v1"
const DURATION_MS = 1800
const REVEAL_MS = 700

type Phase = "loading" | "reveal" | "gone"

export function SiteLoader() {
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")

  useEffect(() => {
    setMounted(true)

    if (typeof window === "undefined") return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const alreadySeen = sessionStorage.getItem(STORAGE_KEY) === "1"

    if (alreadySeen || reducedMotion) {
      setPhase("gone")
      return
    }

    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.floor(eased * 100))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setPhase("reveal")
        window.setTimeout(() => {
          setPhase("gone")
          try {
            sessionStorage.setItem(STORAGE_KEY, "1")
          } catch {
            // sessionStorage may be unavailable in private mode; loader still dismisses
          }
        }, REVEAL_MS)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (phase === "gone") return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = previous
    }
  }, [phase])

  if (!mounted || phase === "gone") return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Ambixous"
      onClick={() => setPhase("gone")}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter") setPhase("gone")
      }}
      tabIndex={0}
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[#05070C] transition-opacity duration-700 ease-out outline-none ${
        phase === "reveal" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient light streams */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[120vh] w-[140vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(180,255,0,0.10),transparent_60%)]" />
        <div className="absolute -bottom-1/2 right-0 h-[80vh] w-[80vw] bg-[radial-gradient(ellipse_at_center,rgba(31,182,255,0.08),transparent_60%)]" />
        <div className="loader-stream absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-[#B4FF00]/60 to-transparent" />
      </div>

      {/* Centered frame */}
      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center px-6 sm:px-10">
        <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-white/35 sm:mb-10 sm:text-[10px] sm:tracking-[0.5em]">
          <span className="h-px w-6 bg-white/20 sm:w-8" />
          Ambixous
          <span className="h-px w-6 bg-white/20 sm:w-8" />
        </div>

        <div className="loader-mark mb-9 flex select-none items-center justify-center sm:mb-12">
          <div className="w-[150px] sm:w-[200px] md:w-[240px]">
            <Logo size="lg" href="" className="w-full h-auto" />
          </div>
        </div>

        <div className="relative h-px w-full overflow-hidden bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B4FF00] via-[#B4FF00] to-[#1FB6FF]"
            style={{ width: `${progress}%`, transition: "width 80ms linear" }}
          />
          <div className="loader-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <div className="mt-3.5 flex w-full items-center justify-between text-[9px] uppercase tracking-[0.28em] text-white/30 sm:mt-4 sm:text-[10px] sm:tracking-[0.3em]">
          <span>Building. Connecting. Growing.</span>
          <span className="tabular-nums text-white/60">
            {String(progress).padStart(3, "0")}
          </span>
        </div>
      </div>
    </div>
  )
}
