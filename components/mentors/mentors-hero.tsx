import { Users, Briefcase, Rocket } from "lucide-react"

export function MentorsHero() {
    return (
        <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-ambixous-neon/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-signal-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-sun-coral/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="container-width section-padding relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Text Content */}
                    <div className="space-y-6 animate-fade-in">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                            <span className="text-warm-white">Meet Our </span>
                            <span className="text-gradient">Mentors</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-gray leading-relaxed max-w-2xl mx-auto">
                            Connect with industry leaders, successful founders, and growth experts who are shaping the future of India&apos;s startup ecosystem.
                        </p>
                    </div>

                    {/* Floating Icons */}
                    <div className="relative mt-12 flex justify-center items-center gap-8 animate-slide-up">
                        <div className="animate-float" style={{ animationDelay: "0s" }}>
                            <div className="w-16 h-16 bg-ambixous-neon/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-ambixous-neon/30">
                                <Rocket className="text-ambixous-neon" size={28} />
                            </div>
                        </div>
                        <div className="animate-float" style={{ animationDelay: "1s" }}>
                            <div className="w-20 h-20 bg-signal-blue/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-signal-blue/30">
                                <Users className="text-signal-blue" size={32} />
                            </div>
                        </div>
                        <div className="animate-float" style={{ animationDelay: "2s" }}>
                            <div className="w-16 h-16 bg-sun-coral/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-sun-coral/30">
                                <Briefcase className="text-sun-coral" size={28} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
