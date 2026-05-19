import { Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    quote:
      "It was a blast kicking things off, glad the energy was there from the start. Excited for the next one.",
    author: "Yug",
    role: "Deputy Manager, Airtel",
    initials: "YU",
  },
  {
    id: 2,
    quote:
      "Your trust gave me the confidence to deliver today's session. Grateful for the seamless work.",
    author: "Anoushka",
    role: "SWE II, Microsoft",
    initials: "AN",
  },
  {
    id: 3,
    quote:
      "It was a blast interacting with everyone and fellow speakers. Excited for more collaborations.",
    author: "Shruti Arora",
    role: "DevRel, Commudle",
    initials: "SA",
  },
  {
    id: 4,
    quote:
      "Thank you for the kind words and for organising this interactive event. Truly an experience.",
    author: "Shruti Sinha",
    role: "Design Manager, Airtel",
    initials: "SS",
  },
  {
    id: 5,
    quote:
      "Incredibly well-organised event, delighted to be part of it. Loved the energy and the insights.",
    author: "Hitesh Lakhyani",
    role: "Design Leader, Tata 1mg",
    initials: "HL",
  },
  {
    id: 6,
    quote:
      "Thank you for making an event like this to inspire people. You all brought such energy.",
    author: "Tia V",
    role: "AI Specialist, PR Department of Thailand",
    initials: "TV",
  },
]

export function TestimonialsSection() {
  return (
    <section
      aria-labelledby="home-testimonials-title"
      className="relative bg-light-ash text-electric-ink"
    >
      <div className="py-20 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="container-width section-padding">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500 sm:text-xs">
              Words from the room
            </p>
            <h2
              id="home-testimonials-title"
              className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              What practitioners say{" "}
              <span className="text-slate-500">after the show.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Unedited reactions from speakers, panellists, and partners who have shipped
              with us at Ambixous events.
            </p>
            <p className="mt-3 hidden text-xs text-slate-500 sm:block">
              Swipe to read more.
            </p>
          </div>
        </div>

        {/* Snap carousel */}
        <div className="mt-10 sm:mt-12">
          <div
            role="region"
            aria-label="Testimonials"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:gap-5 sm:px-6 lg:gap-6 lg:px-12 [scrollbar-width:thin]"
            style={{ scrollPaddingInline: "1rem" }}
          >
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="group relative flex w-[85vw] shrink-0 snap-center flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(2,4,9,0.06)] ring-1 ring-slate-200 transition-shadow hover:shadow-[0_18px_50px_rgba(2,4,9,0.10)] sm:w-[420px] sm:p-8 lg:w-[460px]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ambixous-neon/15 text-ambixous-neon">
                    <Quote size={18} aria-hidden="true" />
                  </div>
                  <div
                    className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400"
                    aria-hidden="true"
                  >
                    {t.initials}
                  </div>
                </div>

                <blockquote className="mt-5 flex-1 text-lg font-medium leading-snug text-electric-ink sm:text-xl">
                  <span aria-hidden="true">&ldquo;</span>
                  {t.quote}
                  <span aria-hidden="true">&rdquo;</span>
                </blockquote>

                <footer className="mt-6">
                  <p className="text-sm font-bold text-electric-ink sm:text-base">
                    {t.author}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-signal-blue sm:text-sm">
                    {t.role}
                  </p>
                </footer>
              </article>
            ))}

            {/* trailing spacer so last card has snap-room */}
            <div aria-hidden="true" className="shrink-0 w-4 sm:w-6 lg:w-12" />
          </div>
        </div>
      </div>
    </section>
  )
}
