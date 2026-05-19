"use client"

import { useEffect, useRef, useState } from "react"

type Event = {
  date: string
  agenda: string
  journey: string
  isMilestone: boolean
}

const journeyBadge = (journey: string) => {
  if (!journey) return "bg-white/[0.04] text-white/40 border-white/[0.06]"
  if (journey === "START")
    return "bg-[#B4FF00]/15 text-[#B4FF00] border-[#B4FF00]/30"
  if (journey === "GRADUATION")
    return "bg-amber-500/15 text-amber-300 border-amber-500/30"
  if (journey === "EXPLORE")
    return "bg-purple-500/15 text-purple-300 border-purple-500/30"
  return "bg-white/[0.06] text-white/50 border-white/[0.08]"
}

export default function CinematicTimeline({ events }: { events: Event[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const container = containerRef.current
      const line = lineRef.current
      if (!container || !line) return

      const rect = container.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height
      const scrolled = Math.min(total, Math.max(0, vh * 0.55 - rect.top))
      const progress = total > 0 ? Math.min(1, scrolled / total) : 0
      line.style.transform = `scaleY(${progress})`

      const viewCenter = vh * 0.5
      let closest = 0
      let minDist = Infinity
      itemsRef.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const c = r.top + r.height / 2
        const d = Math.abs(c - viewCenter)
        if (d < minDist) {
          minDist = d
          closest = i
        }
      })
      setActiveIdx(closest)
      raf = 0
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Track */}
      <div className="absolute left-4 top-0 h-full w-px bg-white/[0.06] sm:left-1/2 sm:-translate-x-px" />
      {/* Filled line */}
      <div
        ref={lineRef}
        className="absolute left-4 top-0 h-full w-px origin-top bg-gradient-to-b from-[#B4FF00] via-[#1FB6FF] to-transparent sm:left-1/2 sm:-translate-x-px"
        style={{
          transform: "scaleY(0)",
          boxShadow: "0 0 20px rgba(180,255,0,0.35)",
        }}
      />

      <div className="space-y-2 sm:space-y-3">
        {events.map((event, i) => {
          const active = i === activeIdx
          const isRight = i % 2 === 1
          return (
            <div
              key={i}
              ref={(el) => {
                if (el) itemsRef.current[i] = el
              }}
              className={`relative flex items-start gap-6 py-3 transition-all duration-500 sm:gap-0 ${
                isRight ? "sm:flex-row-reverse" : "sm:flex-row"
              } ${active ? "opacity-100" : "opacity-55"}`}
            >
              {/* Content frame */}
              <div
                className={`flex-1 pl-10 sm:pl-0 ${
                  isRight ? "sm:pl-12" : "sm:pr-12 sm:text-right"
                }`}
              >
                <div
                  className={`inline-block rounded-xl border px-4 py-3 backdrop-blur transition-all duration-500 ${
                    active
                      ? "border-white/[0.12] bg-white/[0.05] shadow-[0_0_30px_rgba(180,255,0,0.08)]"
                      : "border-white/[0.04] bg-white/[0.015]"
                  }`}
                >
                  {event.journey && (
                    <span
                      className={`mb-2 inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${journeyBadge(
                        event.journey
                      )}`}
                    >
                      {event.journey}
                    </span>
                  )}
                  <p
                    className={`text-sm font-medium leading-snug sm:text-base ${
                      active ? "text-white" : "text-white/70"
                    }`}
                  >
                    {event.agenda}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/30">
                    {event.date}
                  </p>
                </div>
              </div>

              {/* Dot */}
              <div className="absolute left-4 top-7 -translate-x-1/2 sm:left-1/2">
                <div
                  className={`relative flex h-3 w-3 items-center justify-center rounded-full transition-all duration-500 ${
                    event.isMilestone
                      ? active
                        ? "scale-150 bg-[#B4FF00] shadow-[0_0_20px_rgba(180,255,0,0.8)]"
                        : "bg-[#B4FF00]/60"
                      : active
                        ? "scale-125 bg-white/60"
                        : "bg-white/15"
                  }`}
                >
                  {active && event.isMilestone && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B4FF00] opacity-50" />
                  )}
                </div>
              </div>

              <div className="hidden flex-1 sm:block" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
