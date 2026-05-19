import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Sparkles, Briefcase, CalendarCheck2 } from "lucide-react"
import { Magnetic } from "@/components/motion/magnetic"

type ProductCard = {
  label: string
  title: string
  meta: string
  href: string
  icon: LucideIcon
  iconClass: string
  external?: boolean
}

const products: ProductCard[] = [
  {
    label: "Cohort 01 · Live",
    title: "Creator Fellowship",
    meta: "13 weeks. 12 fellows. 6 real projects.",
    href: "/creator-fellowship/cohort-1",
    icon: Sparkles,
    iconClass: "border-ambixous-neon/30 text-ambixous-neon",
  },
  {
    label: "Career Studio",
    title: "ACE by Ambixous",
    meta: "Unlimited free mock interviews and resume reviews.",
    href: "https://ace.ambixous.in",
    external: true,
    icon: Briefcase,
    iconClass: "border-signal-blue/30 text-signal-blue",
  },
  {
    label: "Calendar",
    title: "Live Events",
    meta: "Bootcamps, panels, and founder mixers across India.",
    href: "/events",
    icon: CalendarCheck2,
    iconClass: "border-sun-coral/30 text-sun-coral",
  },
]

export function HeroSection() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate flex min-h-[100dvh] items-center overflow-hidden bg-electric-ink text-warm-white"
    >
      {/* Ambient backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(180,255,0,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_85%_90%,rgba(31,182,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_15%_60%,rgba(255,105,120,0.04),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute -left-24 top-1/4 h-[360px] w-[360px] rounded-full bg-ambixous-neon/[0.06] blur-[120px] sm:h-[520px] sm:w-[520px]" />
        <div className="absolute -right-24 bottom-1/4 h-[360px] w-[360px] rounded-full bg-signal-blue/[0.06] blur-[120px] sm:h-[520px] sm:w-[520px]" />
      </div>

      <div className="container-width section-padding relative z-10 w-full pb-16 pt-20 sm:pt-24 lg:py-32">
        {/* Status pulse */}
        <Link
          href="/creator-fellowship/cohort-1"
          aria-label="Creator Fellowship Cohort 01 is live"
          className="inline-flex items-center gap-2.5 rounded-full border border-ambixous-neon/30 bg-ambixous-neon/[0.08] px-3.5 py-1.5 backdrop-blur transition hover:border-ambixous-neon/60 hover:bg-ambixous-neon/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ambixous-neon focus-visible:ring-offset-2 focus-visible:ring-offset-electric-ink"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ambixous-neon opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ambixous-neon" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-ambixous-neon sm:text-xs">
            Creator Fellowship Cohort 01 is live
          </span>
        </Link>

        {/* Headline */}
        <h1
          id="home-hero-title"
          className="mt-6 max-w-4xl text-balance text-[2.55rem] font-extrabold leading-[1.02] tracking-tight sm:mt-7 sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.25rem]"
        >
          Build. Connect.
          <br />
          <span className="bg-gradient-to-r from-ambixous-neon to-signal-blue bg-clip-text text-transparent">
            Grow. Together.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-slate-gray sm:mt-6 sm:text-lg md:text-xl">
          Ambixous is where India&apos;s creators, students, and operators turn ambition
          into outcomes. Real briefs, senior mentors, and a community that ships.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <Magnetic strength={0.26}>
            <Link
              href="/creator-fellowship/cohort-1"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ambixous-neon px-6 text-sm font-bold text-electric-ink shadow-lg shadow-ambixous-neon/20 transition-all hover:shadow-ambixous-neon/40 active:scale-[0.99] sm:w-auto sm:px-7 sm:text-base"
            >
              Explore the Fellowship
              <ArrowRight
                size={18}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Magnetic>
          <Magnetic strength={0.22}>
            <Link
              href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] px-6 text-sm font-semibold text-warm-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.08] active:scale-[0.99] sm:w-auto sm:px-7 sm:text-base"
            >
              Join the community
              <Sparkles
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:rotate-12"
              />
            </Link>
          </Magnetic>
        </div>

        {/* Product anchor strip */}
        <div className="mt-14 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3">
          {products.map((it) => (
            <Link
              key={it.title}
              href={it.href}
              target={it.external ? "_blank" : undefined}
              rel={it.external ? "noopener noreferrer" : undefined}
              className="group relative flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:translate-y-0"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white/[0.04] ${it.iconClass}`}
              >
                <it.icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 pr-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-warm-white/45">
                  {it.label}
                </p>
                <h2 className="mt-1 text-base font-semibold text-warm-white">{it.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-gray">{it.meta}</p>
              </div>
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="absolute right-4 top-5 text-warm-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-warm-white/70"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
