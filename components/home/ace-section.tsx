import Link from "next/link"
import { ArrowUpRight, Zap, FileText, Mic, CheckCircle2 } from "lucide-react"
import { Magnetic } from "@/components/motion/magnetic"

const features = [
  {
    icon: Mic,
    title: "Unlimited mock interviews",
    description: "Practice rounds tailored to your target role, recorded for review.",
  },
  {
    icon: FileText,
    title: "Resume reviews",
    description: "Specific, recruiter-grade feedback from Ambixous practitioners.",
  },
  {
    icon: Zap,
    title: "Completely free",
    description: "No paywall, no premium tier, no credit card. Built for the community.",
  },
]

export function AceSection() {
  return (
    <section
      aria-labelledby="home-ace-title"
      className="relative overflow-hidden bg-electric-ink text-warm-white"
    >
      {/* Ambient backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_85%_15%,rgba(180,255,0,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_10%_90%,rgba(31,182,255,0.06),transparent_70%)]" />
        <div className="absolute -right-20 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full bg-ambixous-neon/[0.05] blur-[120px]" />
      </div>

      <div className="container-width section-padding relative z-10 py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ambixous-neon/30 bg-ambixous-neon/[0.08] px-3.5 py-1.5">
              <Zap size={12} className="text-ambixous-neon" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-ambixous-neon sm:text-xs">
                ACE · Career Studio
              </span>
            </div>

            <h2
              id="home-ace-title"
              className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Land the role.{" "}
              <span className="bg-gradient-to-r from-ambixous-neon to-signal-blue bg-clip-text text-transparent">
                Unlimited prep.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-gray sm:text-lg">
              ACE by Ambixous is a free career studio for early-career professionals.
              Unlimited mock interviews and resume reviews, run by Ambixous practitioners
              who have shipped at scale.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ambixous-neon/15">
                    <f.icon size={16} className="text-ambixous-neon" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-warm-white sm:text-base">
                      {f.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-gray sm:text-sm">
                      {f.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Magnetic strength={0.26}>
                <Link
                  href="https://ace.ambixous.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ambixous-neon px-7 text-sm font-bold text-electric-ink shadow-lg shadow-ambixous-neon/20 transition-all hover:shadow-ambixous-neon/40 active:scale-[0.99] sm:w-auto sm:text-base"
                >
                  Start with ACE
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* Stat / proof card */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-ambixous-neon/10 via-transparent to-signal-blue/10 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-7 backdrop-blur-md sm:p-9">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-ambixous-neon">
                    Live now
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.28em] text-warm-white/40">
                    ace.ambixous.in
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-ambixous-neon/30 bg-ambixous-neon/[0.08]">
                  <Zap size={14} className="text-ambixous-neon" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                  <p className="text-3xl font-bold text-warm-white sm:text-4xl">∞</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-warm-white/45">
                    Mock interviews
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                  <p className="text-3xl font-bold text-warm-white sm:text-4xl">₹0</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-warm-white/45">
                    Price, forever
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-2.5">
                {[
                  "Role-specific interview templates",
                  "Resume scored against real recruiter rubrics",
                  "Reviewers from product, design, and engineering",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-ambixous-neon"
                      aria-hidden="true"
                    />
                    <span className="text-xs leading-relaxed text-slate-gray sm:text-sm">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
