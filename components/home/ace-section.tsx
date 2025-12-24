"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, FileText, Mic } from "lucide-react"

export function AceSection() {
  return (
    <section className="relative bg-electric-ink py-20 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ambixous-neon rounded-full blur-3xl"></div>
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ambixous-neon/10 border border-ambixous-neon/30">
                  <Zap size={16} className="text-ambixous-neon" />
                  <span className="text-ambixous-neon text-sm font-semibold">NEW FEATURE</span>
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-warm-white leading-tight">
                Master Your Career with <span className="text-ambixous-neon">ACE</span>
              </h2>
              <p className="text-lg text-slate-gray leading-relaxed">
                Get unlimited personalized mock interviews and professional resume reviews from Ambixous experts.
                Perfect your craft, land your dream role.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ambixous-neon/20 flex items-center justify-center mt-1">
                  <Mic size={16} className="text-ambixous-neon" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-white mb-1">Mock Interviews</h3>
                  <p className="text-slate-gray text-sm">
                    Unlimited practice interviews tailored to your target role and company
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ambixous-neon/20 flex items-center justify-center mt-1">
                  <FileText size={16} className="text-ambixous-neon" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-white mb-1">Resume Reviews</h3>
                  <p className="text-slate-gray text-sm">Expert feedback to make your resume stand out to recruiters</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ambixous-neon/20 flex items-center justify-center mt-1">
                  <Zap size={16} className="text-ambixous-neon" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-white mb-1">Completely Free</h3>
                  <p className="text-slate-gray text-sm">Unlimited access with no hidden fees or premium tiers</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                asChild
                className="bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-8 py-6 text-lg shadow-lg hover:shadow-ambixous-neon/25 transition-all duration-200 inline-flex items-center gap-2 group"
              >
                <Link href="https://ace.ambixous.in" target="_blank">
                  Start with ACE
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
