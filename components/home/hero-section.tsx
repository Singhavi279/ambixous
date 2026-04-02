import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Building2, Lightbulb, Target } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-ambixous-neon/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-signal-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="text-gradient">Build.</span> <span className="text-warm-white">Connect.</span>{" "}
                <span className="text-gradient">Grow.</span> <span className="text-warm-white">Together.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-gray max-w-2xl leading-relaxed">
                Ambixous is your place to connect people with purpose and businesses with opportunity, so together, we create meaningful impact that lasts.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-ambixous-neon/25 transition-all duration-200 hover:scale-105 group"
              >
                <Link href="/startups" className="flex items-center gap-2">
                  Explore Corporate Solutions
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-transparent text-signal-blue hover:bg-signal-blue hover:text-electric-ink font-bold px-8 py-4 rounded-xl border-2 border-signal-blue transition-all duration-200 hover:scale-105 group"
              >
                <Link href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Join the Community
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform duration-200" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Enhanced Ambixous-Relevant Illustration */}
          <div className="relative animate-slide-up delay-300">
            <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
              {/* Central Hub - Ambixous Logo/Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Central Core */}
                  <div className="w-32 h-32 bg-gradient-to-br from-ambixous-neon to-signal-blue rounded-full flex items-center justify-center animate-pulse-slow shadow-2xl">
                    <span className="text-2xl font-bold text-electric-ink">A</span>
                  </div>

                  {/* Orbiting Elements - Community */}
                  <div className="absolute -top-16 -left-16 animate-float">
                    <div className="w-16 h-16 bg-ambixous-neon/30 rounded-xl flex items-center justify-center rotate-12">
                      <Users className="text-ambixous-neon" size={24} />
                    </div>
                  </div>

                  {/* Orbiting Elements - Business */}
                  <div className="absolute -top-16 -right-16 animate-float" style={{ animationDelay: "1s" }}>
                    <div className="w-16 h-16 bg-signal-blue/30 rounded-xl flex items-center justify-center -rotate-12">
                      <Building2 className="text-signal-blue" size={24} />
                    </div>
                  </div>

                  {/* Orbiting Elements - Innovation */}
                  <div className="absolute -bottom-16 -left-16 animate-float" style={{ animationDelay: "2s" }}>
                    <div className="w-16 h-16 bg-sun-coral/30 rounded-xl flex items-center justify-center rotate-45">
                      <Lightbulb className="text-sun-coral" size={24} />
                    </div>
                  </div>

                  {/* Orbiting Elements - Growth */}
                  <div className="absolute -bottom-16 -right-16 animate-float" style={{ animationDelay: "3s" }}>
                    <div className="w-16 h-16 bg-ambixous-neon/30 rounded-xl flex items-center justify-center -rotate-45">
                      <Target className="text-ambixous-neon" size={24} />
                    </div>
                  </div>

                  {/* Connection Lines */}
                  <div className="absolute inset-0">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      <defs>
                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B4FF00" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#1FB6FF" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="url(#connectionGradient)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-spin"
                        style={{ animationDuration: "20s" }}
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="120"
                        fill="none"
                        stroke="url(#connectionGradient)"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        className="animate-spin"
                        style={{ animationDuration: "30s", animationDirection: "reverse" }}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Background Geometric Shapes */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-ambixous-neon/10 rounded-2xl rotate-12 animate-pulse"></div>
                <div
                  className="absolute bottom-0 left-0 w-32 h-32 bg-signal-blue/10 rounded-3xl -rotate-12 animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute top-1/2 left-0 w-16 h-16 bg-sun-coral/10 rounded-xl rotate-45 animate-pulse"
                  style={{ animationDelay: "2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
