const partners = [
  "Adani",
  "Adani Digital Labs",
  "Adobe",
  "Airtel",
  "Amazon",
  "American Express",
  "ARC Document Solutions",
  "Astrotalk",
  "Cadre Tech",
  "Capgemini",
  "ClassCover",
  "Commudle",
  "Cradlewise",
  "Deloitte",
  "Deutsche Telekom Digital Labs",
  "EPAM",
  "Expedia Group",
  "Factacy.ai",
  "Financial Express",
  "FreeStand",
  "HARMAN International",
  "IIT Delhi",
  "Info Edge India",
  "Leap Wallet",
  "Lenskart",
  "Maruti Suzuki",
  "Microsoft",
  "MyCTO",
  "Netskope",
  "NIT Andhra",
  "Ola",
  "Payoneer",
  "Paypal",
  "Paytm",
  "Piyush Academy",
  "Policybazaar",
  "Signo",
  "Tata 1mg",
  "Tata Group",
  "Taylor & Francis Group",
  "Times Internet",
  "Trainman",
]

const stats = [
  { value: "5000+", label: "Community members", accent: "text-ambixous-neon" },
  { value: "100+", label: "Mentors onboarded", accent: "text-signal-blue" },
  { value: "150+", label: "Hiring referrals shared", accent: "text-sun-coral" },
]

export function NetworkSection() {
  return (
    <section
      aria-labelledby="home-network-title"
      className="relative overflow-hidden bg-electric-ink text-warm-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(31,182,255,0.05),transparent_60%)]" />
      </div>

      <div className="relative z-10 py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="container-width section-padding">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-warm-white/40 sm:text-xs">
              Our network
            </p>
            <h2
              id="home-network-title"
              className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Trusted by operators from{" "}
              <span className="bg-gradient-to-r from-ambixous-neon to-signal-blue bg-clip-text text-transparent">
                across the ecosystem.
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-gray sm:text-base">
              Professionals, founders, and decision-makers across India and beyond have
              spoken, mentored, hired, or partnered through Ambixous.
            </p>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative mt-12 sm:mt-14">
          <div className="group flex overflow-hidden">
            <div className="flex w-max animate-marquee gap-3 sm:gap-4 group-hover:[animation-play-state:paused]">
              {[...partners, ...partners].map((partner, idx) => (
                <div
                  key={`${partner}-${idx}`}
                  className="flex shrink-0 items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur sm:px-5 sm:py-3.5"
                >
                  <span className="whitespace-nowrap text-sm font-semibold text-warm-white/85 sm:text-base">
                    {partner}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edge fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-electric-ink to-transparent sm:w-32"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-electric-ink to-transparent sm:w-32"
          />
        </div>

        {/* Stats */}
        <div className="container-width section-padding mt-14 sm:mt-16">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-electric-ink/80 px-6 py-7 text-center sm:py-8"
              >
                <p
                  className={`text-4xl font-bold tracking-tight sm:text-5xl ${stat.accent}`}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.32em] text-warm-white/45 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
