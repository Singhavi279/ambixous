"use client"

import { useEffect, useRef } from "react"

export default function AmbientCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    if (isTouch) return

    const el = ref.current
    if (!el) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx
    let cy = ty
    let raf = 0
    let visible = false

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!visible) {
        visible = true
        el.style.opacity = "1"
      }
    }

    const onLeave = () => {
      visible = false
      el.style.opacity = "0"
    }

    const loop = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      el.style.transform = `translate3d(${cx - 280}px, ${cy - 280}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerleave", onLeave)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[560px] w-[560px] opacity-0 transition-opacity duration-500 mix-blend-screen"
      style={{
        background:
          "radial-gradient(circle at center, rgba(180,255,0,0.10) 0%, rgba(31,182,255,0.05) 30%, transparent 70%)",
        filter: "blur(20px)",
      }}
    />
  )
}
