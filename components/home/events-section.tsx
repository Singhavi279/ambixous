import Link from "next/link"
import { Calendar, MapPin, Users, ArrowRight, Globe, Building2 } from "lucide-react"

type Mode = "Online" | "Offline"

const featured = [
  {
    title: "Tech Meetup: AI and Future Skills",
    date: "December 13, 2025",
    type: "Community",
    mode: "Offline" as Mode,
    location: "Times Internet, Noida",
    attendees: 263,
    description:
      "A 5-hour meetup of hands-on AI workshops, HR panels, and keynotes for professionals exploring practical AI and future-of-work skills.",
    href: "https://www.commudle.com/communities/ambixous/events/tech-meetup-ai-future-skills",
  },
  {
    title: "Women's Health Innovation Forum",
    date: "November 28, 2025",
    type: "Corporate",
    mode: "Offline" as Mode,
    location: "The Iconic Corenthum, Noida",
    attendees: 50,
    description:
      "An invitation-only forum for gynaecologists, fertility specialists, and women's health innovators to build cross-functional collaboration.",
    href: "https://www.commudle.com/communities/ambixous/events/women-s-health-innovation-forum",
  },
  {
    title: "AI-Driven QA Bootcamp feat. FAANG",
    date: "September 21, 2025",
    type: "Community",
    mode: "Online" as Mode,
    location: "Online",
    attendees: 228,
    description:
      "Two days of QA testing with practitioners from Microsoft, Amazon, Google, and Deutsche Telekom. Hands-on bug hunting on real platforms.",
    href: "https://www.commudle.com/communities/ambixous/events/ai-driven-bootcamp-roadmap-to-certified-qa-engineer-feat-faang",
  },
]

export function EventsSection() {
  return (
    <section
      aria-labelledby="home-events-title"
      className="relative overflow-hidden bg-electric-ink text-warm-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_10%,rgba(31,182,255,0.06),transparent_60%)]" />
      </div>

      <div className="container-width section-padding relative z-10 py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-warm-white/40 sm:text-xs">
              Live events
            </p>
            <h2
              id="home-events-title"
              className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              From panels to bootcamps to{" "}
              <span className="bg-gradient-to-r from-ambixous-neon to-signal-blue bg-clip-text text-transparent">
                founder lounges.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-gray sm:text-base">
              Curated rooms for India&apos;s creators and operators. Practitioner-led,
              cross-domain, and built for outcomes.
            </p>
          </div>

          <Link
            href="/events"
            className="group hidden items-center gap-2 self-end rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-warm-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.08] sm:inline-flex"
          >
            View all events
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => (
            <Link
              key={e.title}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:translate-y-0 sm:p-7"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={
                    e.type === "Community"
                      ? "rounded-full bg-ambixous-neon/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ambixous-neon"
                      : "rounded-full bg-signal-blue/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal-blue"
                  }
                >
                  {e.type}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warm-white/70">
                  {e.mode === "Online" ? (
                    <Globe size={10} aria-hidden="true" />
                  ) : (
                    <Building2 size={10} aria-hidden="true" />
                  )}
                  {e.mode}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-warm-white group-hover:text-ambixous-neon sm:text-xl">
                {e.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-gray line-clamp-3">
                {e.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-gray sm:text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-ambixous-neon shrink-0" aria-hidden="true" />
                  <span>{e.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-signal-blue shrink-0" aria-hidden="true" />
                  <span>{e.attendees}+ attended</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <MapPin size={13} className="text-sun-coral shrink-0" aria-hidden="true" />
                  <span className="truncate">{e.location}</span>
                </div>
              </div>

              <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-white/80 transition-colors group-hover:text-ambixous-neon">
                View on Commudle
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile-only "View all" */}
        <div className="mt-8 sm:hidden">
          <Link
            href="/events"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-warm-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.08] active:scale-[0.99]"
          >
            View all events
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
