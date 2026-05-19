"use client"

import { useEffect, useRef, type ReactNode } from "react"

type Variant = "up" | "blur" | "right" | "left" | "scale"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: Variant
}

export function Reveal({ children, className = "", delay = 0, variant = "up" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed")
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`scroll-reveal reveal-${variant} ${className}`}>
      {children}
    </div>
  )
}
