"use client"

import { useEffect, useRef } from "react"

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let raf = 0
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0
      el.style.transform = `scaleX(${p})`
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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px bg-white/[0.04]"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-[#B4FF00] via-[#B4FF00] to-[#1FB6FF]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  )
}
