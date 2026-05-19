import Link from "next/link"
import { Heart, Building2, ArrowUpRight, Sparkles, Briefcase, CalendarCheck2, Users } from "lucide-react"

export function AboutSection() {
  return (
    <section
      aria-labelledby="home-about-title"
      className="relative bg-light-ash text-electric-ink"
    >
      <div className="container-width section-padding py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500 sm:text-xs">
            We are Ambixous
          </p>
          <h2
            id="home-about-title"
            className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Two arms.{" "}
            <span className="text-slate-500">One mission.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Ambixous Innovations LLP operates a creator-entrepreneur community and a
            full-stack growth studio under one roof. The community builds the talent.
            The studio ships the work.
          </p>
        </div>

        {/* Dual model */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 lg:grid-cols-2 lg:gap-6">
          {/* Community arm */}
          <article className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(2,4,9,0.10)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ambixous-neon to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ambixous-neon/15">
                <Heart className="text-ambixous-neon" size={22} aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">
                Community Arm
              </p>
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-tight text-electric-ink sm:text-3xl">
              Ambixous Community
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              A creator-first community of students, designers, engineers, and operators.
              We host live bootcamps, panels, and the flagship Creator Fellowship to turn
              audience into income and ideas into careers.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/creator-fellowship/cohort-1"
                className="group/c flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-electric-ink transition-colors hover:border-ambixous-neon/40 hover:bg-ambixous-neon/10"
              >
                <Sparkles size={14} className="text-ambixous-neon" aria-hidden="true" />
                Fellowship
                <ArrowUpRight
                  size={12}
                  aria-hidden="true"
                  className="ml-auto opacity-50 transition group-hover/c:translate-x-0.5 group-hover/c:opacity-100"
                />
              </Link>
              <Link
                href="/events"
                className="group/c flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-electric-ink transition-colors hover:border-sun-coral/40 hover:bg-sun-coral/10"
              >
                <CalendarCheck2 size={14} className="text-sun-coral" aria-hidden="true" />
                Events
                <ArrowUpRight
                  size={12}
                  aria-hidden="true"
                  className="ml-auto opacity-50 transition group-hover/c:translate-x-0.5 group-hover/c:opacity-100"
                />
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-ambixous-neon">
              <Users size={16} aria-hidden="true" />
              <span>5000+ active community members</span>
            </div>
          </article>

          {/* Business arm */}
          <article className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(2,4,9,0.10)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signal-blue to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-blue/15">
                <Building2 className="text-signal-blue" size={22} aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">
                Business Arm
              </p>
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-tight text-electric-ink sm:text-3xl">
              Ambixous Innovations LLP
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              A growth studio for startups and corporates. Brand briefs, product
              storytelling, creator marketing, and hiring pipelines, executed by
              practitioners pulled from the community itself.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/startups"
                className="group/c flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-electric-ink transition-colors hover:border-signal-blue/40 hover:bg-signal-blue/10"
              >
                <Briefcase size={14} className="text-signal-blue" aria-hidden="true" />
                Startup work
                <ArrowUpRight
                  size={12}
                  aria-hidden="true"
                  className="ml-auto opacity-50 transition group-hover/c:translate-x-0.5 group-hover/c:opacity-100"
                />
              </Link>
              <a
                href="https://ace.ambixous.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group/c flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-electric-ink transition-colors hover:border-ambixous-neon/40 hover:bg-ambixous-neon/10"
              >
                <Sparkles size={14} className="text-ambixous-neon" aria-hidden="true" />
                ACE
                <ArrowUpRight
                  size={12}
                  aria-hidden="true"
                  className="ml-auto opacity-50 transition group-hover/c:translate-x-0.5 group-hover/c:opacity-100"
                />
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-signal-blue">
              <Building2 size={16} aria-hidden="true" />
              <span>End-to-end execution, not slideware</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
