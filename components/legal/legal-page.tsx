import type { ReactNode } from "react"

export function LegalPage({
    title,
    lastUpdated,
    intro,
    children,
}: {
    title: string
    lastUpdated: string
    intro?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="bg-electric-ink min-h-screen">
            <div className="container-width section-padding py-16 sm:py-20">
                <div className="mx-auto max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ambixous-neon">
                        Legal
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-warm-white sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-3 text-sm text-slate-gray">
                        Last updated: {lastUpdated}
                    </p>
                    {intro && (
                        <div className="mt-6 text-base leading-relaxed text-slate-gray">
                            {intro}
                        </div>
                    )}
                    <div className="legal-prose mt-10 space-y-8">{children}</div>
                </div>
            </div>
        </div>
    )
}

export function Section({
    id,
    heading,
    children,
}: {
    id?: string
    heading: string
    children: ReactNode
}) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-warm-white sm:text-2xl">
                {heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-gray">
                {children}
            </div>
        </section>
    )
}
