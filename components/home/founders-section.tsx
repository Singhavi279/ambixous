import { Mail, Linkedin } from "lucide-react"

const founders = [
  {
    name: "Riti Gupta",
    role: "Community Evangelist · Brand Strategist · Storyteller-in-Chief",
    description:
      "A community builder and strategist, twice over a community founder. Known for creating authentic connections through narrative, design, and execution.",
    linkedin: "https://www.linkedin.com/in/ritigupta05/",
    email: "codework.riti@gmail.com",
    initials: "RG",
    accent: "ambixous-neon",
  },
  {
    name: "Avnish Singh",
    role: "Public Speaker · Product Manager · Community-Driven Builder",
    description:
      "A product professional with hands-on experience building and scaling at startups and enterprises. Known for turning bold ideas into measurable, high-impact growth.",
    linkedin: "https://www.linkedin.com/in/singhavi279/",
    email: "t20avnish@gmail.com",
    initials: "AS",
    accent: "signal-blue",
  },
]

export function FoundersSection() {
  return (
    <section
      aria-labelledby="home-founders-title"
      className="relative bg-light-ash text-electric-ink"
    >
      <div className="container-width section-padding py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500 sm:text-xs">
            The founders
          </p>
          <h2
            id="home-founders-title"
            className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          >
            The humans behind{" "}
            <span className="text-slate-500">the hustle.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Ambixous was co-built to blend community-first thinking with executional
            excellence. Two operators, one mission, and a network that scales.
          </p>
        </div>

        {/* Founders grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 md:grid-cols-2 md:gap-6">
          {founders.map((founder) => (
            <article
              key={founder.name}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(2,4,9,0.10)] sm:p-8"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  founder.accent === "ambixous-neon"
                    ? "bg-gradient-to-r from-ambixous-neon to-transparent"
                    : "bg-gradient-to-r from-signal-blue to-transparent"
                }`}
              />

              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                    founder.accent === "ambixous-neon"
                      ? "bg-ambixous-neon/15 text-ambixous-neon"
                      : "bg-signal-blue/15 text-signal-blue"
                  }`}
                  aria-hidden="true"
                >
                  {founder.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-electric-ink sm:text-2xl">
                    {founder.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                    {founder.role}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
                {founder.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on LinkedIn`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-electric-ink transition-colors hover:border-[#0A66C2]/30 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                >
                  <Linkedin size={13} aria-hidden="true" />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${founder.email}`}
                  aria-label={`Email ${founder.name}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-electric-ink transition-colors hover:border-sun-coral/30 hover:bg-sun-coral/10 hover:text-sun-coral"
                >
                  <Mail size={13} aria-hidden="true" />
                  Email
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Origin */}
        <div className="mt-10 rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 sm:mt-12 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500 sm:text-xs">
            Origin story
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
            Ambixous began as small conversations about blending community impact with
            business growth. Today it is a 5,000+ member grassroots-to-global network of
            founders, investors, professionals, and students turning shared ideas into
            lasting impact.
          </p>
        </div>
      </div>
    </section>
  )
}
