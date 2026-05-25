"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, Zap } from "lucide-react"

export function EventsHero() {
  const [activeFilter, setActiveFilter] = useState<"All" | "Community" | "Corporate">("All")

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-electric-ink via-electric-ink to-slate-900 overflow-hidden pt-20 sm:pt-24">
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
                <span className="text-warm-white">Events That</span> <span className="text-gradient">Activate.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-gray max-w-2xl leading-relaxed">
                From intimate learning sessions to large-scale corporate experiences, every event we create is designed to spark connections and drive meaningful outcomes.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-4">
              {(["All", "Community", "Corporate"] as const).map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter
                      ? "bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-6 py-3 rounded-xl shadow-lg"
                      : "bg-transparent text-slate-gray hover:text-ambixous-neon hover:border-ambixous-neon font-bold px-6 py-3 rounded-xl border-2 border-slate-gray transition-all duration-200"
                  }
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Events Illustration */}
          <div className="relative animate-slide-up delay-300">
            <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
              {/* Central Event Hub */}
              <div className="relative">
                <div className="w-48 h-48 bg-gradient-to-br from-ambixous-neon/20 to-signal-blue/20 rounded-2xl flex items-center justify-center animate-pulse-slow shadow-2xl">
                  <Calendar className="text-ambixous-neon" size={64} />
                </div>

                {/* Event Type Icons */}
                <div className="absolute -top-16 -left-16 animate-float">
                  <div className="w-16 h-16 bg-ambixous-neon/30 rounded-xl flex items-center justify-center rotate-12">
                    <Users className="text-ambixous-neon" size={24} />
                  </div>
                </div>

                <div className="absolute -top-16 -right-16 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="w-16 h-16 bg-signal-blue/30 rounded-xl flex items-center justify-center -rotate-12">
                    <MapPin className="text-signal-blue" size={24} />
                  </div>
                </div>

                <div
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 animate-float"
                  style={{ animationDelay: "2s" }}
                >
                  <div className="w-16 h-16 bg-sun-coral/30 rounded-xl flex items-center justify-center rotate-45">
                    <Zap className="text-sun-coral" size={24} />
                  </div>
                </div>

                {/* Connection Rings */}
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="eventGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#B4FF00" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1FB6FF" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="url(#eventGradient)"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      className="animate-spin"
                      style={{ animationDuration: "15s" }}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
