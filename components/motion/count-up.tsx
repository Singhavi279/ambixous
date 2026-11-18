"use client"

import { useEffect, useRef, useState } from "react"

type CountUpProps = {
  value: number
  suffix?: string
  durationMs?: number
}

const format = (n: number) => n.toLocaleString("en-IN")

/**
 * Progressive-enhancement counter.
 *
 * The real figure is in the server HTML and stays in the DOM until the number
 * actually starts scrolling into view, so crawlers, AI answer engines, link
 * previews, no-JS visitors and anyone who never scrolls to it always get the
 * true value. Only then does it count up from 0. Numbers already on screen at
 * load are left alone (no flash), and prefers-reduced-motion skips the effect.
 * While animating, the moving digits are hidden from assistive tech and the
 * real value is exposed in a visually hidden span.
 */
export function CountUp({ value, suffix = "", durationMs = 1600 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let initial = true
    const observer = new IntersectionObserver(([entry]) => {
      // The first callback reports the state at load: if it's already visible, keep the real figure.
      if (initial) {
        initial = false
        if (entry.isIntersecting) observer.disconnect()
        return
      }
      if (!entry.isIntersecting) return
      observer.disconnect()
      setAnimating(true)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / durationMs, 1)
        setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))))
        if (t < 1) frame = requestAnimationFrame(tick)
        else setAnimating(false)
      }
      setDisplay(0)
      frame = requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, durationMs])

  const text = `${format(display)}${suffix}`
  return (
    <span ref={ref} className="tabular-nums" data-count-up>
      {animating ? (
        <>
          <span aria-hidden="true">{text}</span>
          <span className="sr-only">{`${format(value)}${suffix}`}</span>
        </>
      ) : (
        text
      )}
    </span>
  )
}
