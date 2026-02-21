"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

export function EventsBanner() {
    const bannerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed")
                    }
                })
            },
            { threshold: 0.1 }
        )

        const el = bannerRef.current
        if (el) observer.observe(el)
        return () => { if (el) observer.unobserve(el) }
    }, [])

    return (
        <section className="w-full px-4 sm:px-6 py-10">
            <div className="max-w-5xl mx-auto">
                {/* Section label */}
                <p className="text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-gray mb-6 font-inter">
                    Our Community in Action
                </p>

                {/* Banner — 3D Lifted */}
                <div ref={bannerRef} className="scroll-reveal">
                    <div className="banner-3d-lift">
                        <div className="banner-3d-target rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.08]">
                            <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] md:aspect-[4/1]">
                                <Image
                                    src="/bottom.png"
                                    alt="Ambixous events collage — Build. Connect. Grow."
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1120px"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reflection */}
                    <div className="banner-reflection mt-0 opacity-15 blur-[2px] pointer-events-none hidden sm:block" aria-hidden="true">
                        <div className="rounded-xl overflow-hidden" style={{ transform: "scaleY(-1)" }}>
                            <div className="relative w-full aspect-[4/1]">
                                <Image
                                    src="/bottom.png"
                                    alt=""
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                    sizes="(max-width: 1024px) 90vw, 1120px"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
