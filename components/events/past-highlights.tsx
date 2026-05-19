import { Calendar, Users, Award } from "lucide-react"

export function PastHighlights() {
  return (
    <section className="py-24 bg-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-12 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-warm-white">
              The <span className="text-gradient">Impact</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-gray max-w-3xl mx-auto">
              Our events have connected 5,000+ professionals and students — accelerating
              careers, closing deals, and building skills that last.
            </p>
          </div>

          {/* Overall Impact Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3 rounded-3xl border border-slate-gray/15 bg-slate-900/40 p-8 transition-colors hover:border-ambixous-neon/40">
              <div className="flex justify-center">
                <div className="p-4 bg-ambixous-neon/20 rounded-2xl">
                  <Calendar className="text-ambixous-neon" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-ambixous-neon">50+</div>
              <div className="text-slate-gray">
                Events Hosted — in the last 24 months
              </div>
            </div>
            <div className="text-center space-y-3 rounded-3xl border border-slate-gray/15 bg-slate-900/40 p-8 transition-colors hover:border-signal-blue/40">
              <div className="flex justify-center">
                <div className="p-4 bg-signal-blue/20 rounded-2xl">
                  <Users className="text-signal-blue" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-signal-blue">5000+</div>
              <div className="text-slate-gray">
                Total Participants — engaged in learning, networking, and growth
              </div>
            </div>
            <div className="text-center space-y-3 rounded-3xl border border-slate-gray/15 bg-slate-900/40 p-8 transition-colors hover:border-sun-coral/40">
              <div className="flex justify-center">
                <div className="p-4 bg-sun-coral/20 rounded-2xl">
                  <Award className="text-sun-coral" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-sun-coral">98%</div>
              <div className="text-slate-gray">
                Satisfaction Rate — participants rated their experiences as highly valuable
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
