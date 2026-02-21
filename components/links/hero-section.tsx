"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Logo } from "@/components/logo"

export function HeroSection() {
    const imageRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed")
                    }
                })
            },
            { threshold: 0.15 }
        )

        const el = imageRef.current
        if (el) observer.observe(el)
        return () => { if (el) observer.unobserve(el) }
    }, [])

    return (
        <section className="relative pt-8 pb-12 overflow-hidden">
            {/* Ambient glow background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-ambixous-neon/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-signal-blue/[0.03] rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto space-y-8">
                {/* Logo */}
                <div className="animate-fade-in">
                    <Logo size="md" href="/" />
                </div>

                {/* Headline */}
                <div className="space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                        Where <span className="text-gradient">Ambition</span> Meets{" "}
                        <span className="text-gradient">Impact</span>
                    </h1>
                    <p className="text-slate-gray text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                        A bridge between community-driven change and business-driven innovation.
                        Building the next generation of leaders and founders, together.
                    </p>
                </div>

                {/* Founders Photo — 3D Lifted */}
                <div
                    ref={imageRef}
                    className="scroll-reveal w-full max-w-xs sm:max-w-sm md:max-w-md"
                >
                    <div className="image-3d-lift">
                        <div className="image-3d-target rounded-2xl overflow-hidden border border-white/[0.08]">
                            <Image
                                src="/hero.jpg"
                                alt="Riti Gupta and Avnish Singh — Cofounders of Ambixous"
                                width={1248}
                                height={832}
                                priority
                                className="w-full h-auto object-cover"
                                sizes="(max-width: 640px) 320px, (max-width: 768px) 384px, 448px"
                            />
                        </div>
                    </div>

                    {/* Founder captions */}
                    <div className="mt-4 flex justify-center gap-6 text-xs sm:text-sm text-slate-gray">
                        <div className="text-center">
                            <p className="text-warm-white font-semibold">Riti Gupta</p>
                            <p>Cofounder</p>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                            <p className="text-warm-white font-semibold">Avnish Singh</p>
                            <p>Cofounder</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
