import { Button } from "@/components/ui/button"
import { MessageCircle, Heart, Users, Sparkles } from "lucide-react"
import Link from "next/link"

export function CommunityHero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden pt-20 sm:pt-24">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-ambixous-neon/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-signal-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="text-warm-white">This isn't just a network.</span>
                <br />
                <span className="text-gradient">It's a vibe.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-gray max-w-3xl leading-relaxed">
                Ambixous Community is our non-profit playground for the curious. A space to upskill, grow, and belong.
              </p>
            </div>

            {/* Primary and Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-ambixous-neon/25 transition-all duration-200 hover:scale-105 group"
              >
                <a
                  href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle size={20} />
                  Join Our WhatsApp Community
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-transparent text-ambixous-neon hover:bg-ambixous-neon hover:text-electric-ink font-bold px-8 py-4 rounded-xl border-2 border-ambixous-neon transition-all duration-200 hover:scale-105 group"
              >
                <Link href="#join-process" className="flex items-center gap-2">
                  <Heart size={20} className="group-hover:scale-110 transition-transform duration-200" />
                  Volunteer With Us
                </Link>
              </Button>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-ambixous-neon">5000+</div>
                <div className="text-sm text-slate-gray">Members</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-signal-blue">100+</div>
                <div className="text-sm text-slate-gray">Mentors</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-sun-coral">150+</div>
                <div className="text-sm text-slate-gray">Referrals</div>
              </div>
            </div>
          </div>

          {/* Enhanced Community Illustration */}
          <div className="relative animate-slide-up delay-300">
            <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
              {/* Central Community Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Central Core - Community Symbol */}
                  <div className="w-40 h-40 bg-gradient-to-br from-ambixous-neon/30 to-signal-blue/30 rounded-full flex items-center justify-center animate-pulse-slow shadow-2xl border-4 border-ambixous-neon/20">
                    <Users className="text-ambixous-neon" size={48} />
                  </div>

                  {/* Floating Community Elements */}
                  <div className="absolute -top-12 -left-12 animate-float">
                    <div className="w-12 h-12 bg-ambixous-neon/40 rounded-full flex items-center justify-center">
                      <Heart className="text-ambixous-neon" size={16} />
                    </div>
                  </div>

                  <div className="absolute -top-12 -right-12 animate-float" style={{ animationDelay: "1s" }}>
                    <div className="w-12 h-12 bg-signal-blue/40 rounded-full flex items-center justify-center">
                      <Sparkles className="text-signal-blue" size={16} />
                    </div>
                  </div>

                  <div className="absolute -bottom-12 -left-12 animate-float" style={{ animationDelay: "2s" }}>
                    <div className="w-12 h-12 bg-sun-coral/40 rounded-full flex items-center justify-center">
                      <MessageCircle className="text-sun-coral" size={16} />
                    </div>
                  </div>

                  <div className="absolute -bottom-12 -right-12 animate-float" style={{ animationDelay: "3s" }}>
                    <div className="w-12 h-12 bg-ambixous-neon/40 rounded-full flex items-center justify-center">
                      <Users className="text-ambixous-neon" size={16} />
                    </div>
                  </div>

                  {/* Connection Rings */}
                  <div className="absolute inset-0">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      <defs>
                        <linearGradient id="communityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B4FF00" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#1FB6FF" stopOpacity="0.4" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="url(#communityGradient)"
                        strokeWidth="2"
                        strokeDasharray="6,6"
                        className="animate-spin"
                        style={{ animationDuration: "25s" }}
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="110"
                        fill="none"
                        stroke="url(#communityGradient)"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        className="animate-spin"
                        style={{ animationDuration: "35s", animationDirection: "reverse" }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Community Values */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "800ms" }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-slate-gray leading-relaxed">
              <span className="text-ambixous-neon font-semibold">Real-life mentors</span> •
              <span className="text-signal-blue font-semibold"> Learning sprints</span> •
              <span className="text-sun-coral font-semibold"> Community events</span> •
              <span className="text-ambixous-neon font-semibold"> No cost, just value</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
