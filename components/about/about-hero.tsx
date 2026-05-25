import { Compass, Heart, Zap } from "lucide-react"

export function AboutHero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden pt-20 sm:pt-24">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-ambixous-neon/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-signal-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
                  <span className="text-warm-white">Who</span> <span className="text-gradient">We Are</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-gray leading-relaxed">
                  Born at the intersection of purpose and progress, Ambixous is a corporate innovation partner and community growth platform that accelerates ideas, empowers people, and ignites the startup ecosystem. 
                </p>
                <p className="text-lg text-slate-gray leading-relaxed">
                  We create spaces where individuals learn, brands act, and impact lasts. Join a movement where industry leaders and change-makers converge.
                </p>
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative animate-slide-up delay-300">
              <div className="relative w-full h-96 flex items-center justify-center">
                {/* Mission Compass */}
                <div className="relative">
                  <div className="w-48 h-48 border-4 border-ambixous-neon/30 rounded-full flex items-center justify-center animate-pulse-slow">
                    <div className="w-32 h-32 bg-gradient-to-br from-ambixous-neon/20 to-signal-blue/20 rounded-full flex items-center justify-center">
                      <Compass className="text-ambixous-neon" size={48} />
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-8 -right-8 animate-float">
                    <div className="w-16 h-16 bg-signal-blue/20 rounded-full flex items-center justify-center">
                      <Zap className="text-signal-blue" size={24} />
                    </div>
                  </div>

                  <div className="absolute -bottom-8 -left-8 animate-float" style={{ animationDelay: "2s" }}>
                    <div className="w-16 h-16 bg-sun-coral/20 rounded-full flex items-center justify-center">
                      <Heart className="text-sun-coral" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
