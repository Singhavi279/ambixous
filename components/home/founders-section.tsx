import { Mail, Linkedin } from "lucide-react"
import Image from "next/image"
import { founders } from "@/lib/founders"

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
            Ambixous is built by operators across community, product, and design.
            Three leaders, one mission, and a network that scales.
          </p>
        </div>

        {/* Founders grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 md:grid-cols-3 md:gap-6">
          {founders.map((founder) => (
            <article
              key={founder.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(2,4,9,0.10)] sm:p-7"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  founder.accent === "ambixous-neon"
                    ? "bg-gradient-to-r from-ambixous-neon to-transparent"
                    : founder.accent === "signal-blue"
                      ? "bg-gradient-to-r from-signal-blue to-transparent"
                      : "bg-gradient-to-r from-sun-coral to-transparent"
                }`}
              />
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100 ${
                  founder.accent === "ambixous-neon"
                    ? "bg-ambixous-neon/15"
                    : founder.accent === "signal-blue"
                      ? "bg-signal-blue/15"
                      : "bg-sun-coral/15"
                } opacity-60`}
              />

              <div className="relative flex flex-col items-start gap-5">
                <div
                  className={`rounded-full p-1.5 ${
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
                    width={128}
                    height={128}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white sm:h-28 sm:w-28"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-electric-ink sm:text-2xl">
                    {founder.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 sm:min-h-[3.75rem] sm:text-sm">
                    {founder.role}
                  </p>
                </div>
              </div>

              <p className="relative mt-5 flex-1 text-sm leading-relaxed text-slate-600">
                {founder.description}
              </p>

              <div className="relative mt-6 flex flex-wrap gap-2 pt-1">
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
            founders, investors, professionals, designers, and students turning shared
            ideas into lasting impact.
          </p>
        </div>
      </div>
    </section>
  )
}
