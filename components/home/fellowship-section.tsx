"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Calendar, Briefcase, Trophy } from "lucide-react"

const fellowRows: { name: string; image: string }[][] = [
  [
    { name: "Abhay Mishra", image: "/creatorcohort/fellows/abhay.png" },
    { name: "Jiya Tomar", image: "/creatorcohort/fellows/jiya.png" },
    { name: "Kavisha Mathur", image: "/creatorcohort/fellows/kavisha.png" },
    { name: "Krishna N Mehta", image: "/creatorcohort/fellows/krishnamehta.png" },
    { name: "Krishna Sharma", image: "/creatorcohort/fellows/krishnasharma.png" },
    { name: "Lavanya Dua", image: "/creatorcohort/fellows/lavanya.png" },
  ],
  [
    { name: "Prashasti Agarwal", image: "/creatorcohort/fellows/prashashti.png" },
    { name: "Shrishti Vaish", image: "/creatorcohort/fellows/shristi.png" },
    { name: "Siya Choudhary", image: "/creatorcohort/fellows/siya.png" },
    { name: "Srujal Pawar", image: "/creatorcohort/fellows/srujal.png" },
    { name: "Surya Gupta", image: "/creatorcohort/fellows/surya.png" },
    { name: "Vedansh Chugh", image: "/creatorcohort/fellows/vedansh.png" },
  ],
]

export function FellowshipSection() {
  return (
    <section className="relative overflow-hidden bg-electric-ink py-20 md:py-28">
      {/* Ambient cinematic background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(180,255,0,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_85%_100%,rgba(31,182,255,0.08),transparent_60%)]" />
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-ambixous-neon/[0.05] blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-[#1FB6FF]/[0.05] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container-width section-padding relative z-10">
        {/* Outer luminous frame */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-ambixous-neon/15 bg-gradient-to-b from-white/[0.03] to-transparent p-8 backdrop-blur-md sm:p-12 lg:p-16">
          {/* Inner gradient accent */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-ambixous-neon/60 to-transparent" />
            <div className="absolute -bottom-px left-1/2 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#1FB6FF]/40 to-transparent" />
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
            {/* Left: content */}
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-ambixous-neon/30 bg-ambixous-neon/[0.08] px-4 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ambixous-neon opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ambixous-neon" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-ambixous-neon">
                  Live Now · Cohort 01
                </span>
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.4em] text-warm-white/40">
                A Flagship Ambixous Initiative
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-warm-white sm:text-5xl lg:text-6xl">
                India&apos;s first
                <br />
                <span className="bg-gradient-to-r from-ambixous-neon to-[#1FB6FF] bg-clip-text text-transparent">
                  Creator Fellowship.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-gray sm:text-lg">
                A 13-week cohort turning India&apos;s creators into{" "}
                <span className="font-semibold text-warm-white">creator-entrepreneurs</span>.
                Senior industry mentors, real brand briefs, and independent jury rounds.
              </p>

              {/* Stats strip */}
              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-4">
                {[
                  { value: "12", label: "Fellows", icon: Users },
                  { value: "13", label: "Weeks", icon: Calendar },
                  { value: "6", label: "Projects", icon: Briefcase },
                  { value: "3", label: "Briefs", icon: Trophy },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="group/cell relative bg-electric-ink/80 px-4 py-4 transition-colors hover:bg-white/[0.03] sm:px-5 sm:py-5"
                  >
                    <s.icon className="mb-2 h-3.5 w-3.5 text-warm-white/30 transition-colors group-hover/cell:text-ambixous-neon" />
                    <div className="text-2xl font-bold text-warm-white sm:text-3xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-warm-white/35">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="group/cta bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-7 py-6 text-base shadow-lg hover:shadow-ambixous-neon/30 transition-all duration-300"
                >
                  <Link href="/creator-fellowship/cohort-1" className="inline-flex items-center gap-2">
                    Explore the Fellowship
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover/cta:translate-x-1"
                    />
                  </Link>
                </Button>
                <Link
                  href="/creator-fellowship/cohort-1#fellows"
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-medium text-warm-white/85 backdrop-blur transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-warm-white"
                >
                  Meet the fellows
                </Link>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.32em] text-warm-white/30">
                Mar 29 to Jun 27, 2026 · Founder × Creator Demo Day
              </p>

              {/* Mobile and tablet only: condensed cohort proof */}
              <div className="mt-8 flex items-center gap-4 lg:hidden">
                <div className="flex">
                  {fellowRows[0].slice(0, 6).map((f, i) => (
                    <div
                      key={f.name}
                      className="relative -ml-2.5 first:ml-0"
                      style={{ zIndex: 6 - i }}
                      title={f.name}
                    >
                      <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-electric-ink bg-white/[0.04] shadow-lg shadow-black/30">
                        <Image
                          src={f.image}
                          alt=""
                          width={44}
                          height={44}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-warm-white">12 fellows · 6 niches</p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-warm-white/40">
                    Cohort 01 · Class of 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Right: fellow showcase */}
            <div className="relative hidden lg:block">
              {/* Backdrop glow */}
              <div className="absolute inset-0 -m-8 rounded-[2rem] bg-gradient-to-br from-ambixous-neon/10 via-transparent to-[#1FB6FF]/10 blur-2xl" />

              <div className="relative">
                {/* Editorial frame card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-7 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-ambixous-neon">
                        Cohort 01
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-warm-white/40">
                        Class of 2026
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-ambixous-neon/30 bg-ambixous-neon/[0.08]">
                      <Sparkles size={14} className="text-ambixous-neon" />
                    </div>
                  </div>

                  {/* Cohort grid: 2 rows of 6 fellows */}
                  <div className="mt-8 space-y-2.5">
                    {fellowRows.map((row, rowIdx) => (
                      <div
                        key={rowIdx}
                        className="flex items-center"
                        style={{ paddingLeft: rowIdx === 1 ? "1rem" : 0 }}
                      >
                        {row.map((f, i) => (
                          <div
                            key={f.name}
                            title={f.name}
                            className="group/avatar relative -ml-2.5 transition-transform duration-300 hover:z-10 hover:-translate-y-1 first:ml-0"
                            style={{ zIndex: row.length - i }}
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-electric-ink bg-white/[0.04] shadow-lg shadow-black/40 transition-all duration-300 group-hover/avatar:border-ambixous-neon">
                              <Image
                                src={f.image}
                                alt={f.name}
                                width={56}
                                height={56}
                                className="h-full w-full object-cover object-top"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3 text-center">
                    {[
                      { v: "6", l: "Niches" },
                      { v: "11", l: "Mentors" },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                      >
                        <div className="text-2xl font-bold text-warm-white">{m.v}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-warm-white/40">
                          {m.l}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {["Lifestyle", "Tech", "Gaming", "Marketing", "MedTech", "Motivational"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-warm-white/55"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Floating spec card */}
                <div className="absolute -bottom-6 -right-4 rounded-2xl border border-ambixous-neon/25 bg-electric-ink/95 px-4 py-3 backdrop-blur-md shadow-2xl shadow-ambixous-neon/10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-ambixous-neon">
                    Final Cut
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-warm-white">
                    Demo Day · Jun 27
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
