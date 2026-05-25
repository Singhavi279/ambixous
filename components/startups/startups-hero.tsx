"use client"

import { Button } from "@/components/ui/button"
import { Mail, MessageCircle, Rocket, Target, Zap } from "lucide-react"

export function StartupsHero() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hey Avnish, I need to know more about Ambixous")
    window.open(`https://wa.me/7417914565?text=${message}`, "_blank")
  }

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden pt-20 sm:pt-24">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-signal-blue/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ambixous-neon/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="text-warm-white"> Smart Brands</span>{" "}
                <span className="text-gradient">Don't Just</span>
                <br />
                <span className="text-warm-white">Grow</span><br /> <span className="text-gradient"> They Connect</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-gray max-w-2xl leading-relaxed">
                At Ambixous Innovations LLP, we craft business growth strategies and brand activations that resonate, convert, and build lasting engagement, loyalty, and sales.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-signal-blue text-electric-ink hover:bg-signal-blue/90 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-signal-blue/25 transition-all duration-200 hover:scale-105 group"
              >
                <a href="mailto:hi.ambixous@gmail.com" className="flex items-center gap-2">
                  <Mail size={20} />
                  Email Us
                </a>
              </Button>
              <Button
                size="lg"
                onClick={handleWhatsAppClick}
                className="bg-transparent text-ambixous-neon hover:bg-ambixous-neon hover:text-electric-ink font-bold px-8 py-4 rounded-xl border-2 border-ambixous-neon transition-all duration-200 hover:scale-105 group"
              >
                <MessageCircle size={20} className="mr-2" />
                WhatsApp Us
              </Button>
            </div>
          </div>

          {/* Business Growth Illustration */}
          <div className="relative animate-slide-up delay-300">
            <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
              {/* Central Growth Chart */}
              <div className="relative">
                <div className="w-48 h-48 bg-gradient-to-br from-signal-blue/20 to-ambixous-neon/20 rounded-2xl flex items-center justify-center animate-pulse-slow shadow-2xl">
                  <Target className="text-signal-blue" size={64} />
                </div>

                {/* Growth Indicators */}
                <div className="absolute -top-12 -left-12 animate-float">
                  <div className="w-16 h-16 bg-ambixous-neon/30 rounded-xl flex items-center justify-center rotate-12">
                    <Rocket className="text-ambixous-neon" size={24} />
                  </div>
                </div>

                <div className="absolute -top-12 -right-12 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="w-16 h-16 bg-signal-blue/30 rounded-xl flex items-center justify-center -rotate-12">
                    <Zap className="text-signal-blue" size={24} />
                  </div>
                </div>

                {/* Growth Bars */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {[40, 60, 80, 100, 85].map((height, index) => (
                    <div
                      key={index}
                      className="w-4 bg-gradient-to-t from-signal-blue to-ambixous-neon rounded-t animate-pulse-slow"
                      style={{
                        height: `${height}px`,
                        animationDelay: `${index * 200}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Elements */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-signal-blue/10 rounded-2xl rotate-12 animate-pulse"></div>
                <div
                  className="absolute bottom-0 left-0 w-32 h-32 bg-ambixous-neon/10 rounded-3xl -rotate-12 animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
