"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { founders } from "@/lib/founders"

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

                {/* Founder portraits */}
                <div
                    ref={imageRef}
                    className="scroll-reveal w-full max-w-xl"
                >
                    <div className="image-3d-lift">
                        <div className="image-3d-target rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm">
                            <div className="grid grid-cols-3 gap-3 sm:gap-5">
                                {founders.map((founder) => (
                                    <div key={founder.name} className="flex flex-col items-center text-center">
                                        <div
                                            className={`rounded-full p-1 ${
                                                founder.accent === "ambixous-neon"
                                                    ? "bg-ambixous-neon/20"
                                                    : founder.accent === "signal-blue"
                                                        ? "bg-signal-blue/20"
                                                        : "bg-sun-coral/20"
                                            }`}
                                        >
                                            <Image
                                                src={founder.photo}
                                                alt={`${founder.name}, Cofounder of Ambixous`}
                                                width={112}
                                                height={112}
                                                priority
                                                className="h-20 w-20 rounded-full object-cover ring-2 ring-white/15 sm:h-24 sm:w-24"
                                                sizes="96px"
                                            />
                                        </div>
                                        <p className="mt-3 text-xs font-semibold text-warm-white sm:text-sm">
                                            {founder.name}
                                        </p>
                                        <p className="text-[11px] text-slate-gray">Cofounder</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
