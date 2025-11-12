import { Button } from "@/components/ui/button"
import { Calendar, Bell, Users } from "lucide-react"
import Link from "next/link"

export function EventsCTA() {
  return (
    <section className="py-24 bg-light-ash text-electric-ink">
      <div className="container-width section-padding">
        <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Never Miss an <span className="text-gradient">Event</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              Stay connected and get VIP early access to our most in-demand events before public registration opens. Don’t miss exclusive networking opportunities and high-value experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Join Community */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-ambixous-neon/20 rounded-2xl group-hover:bg-ambixous-neon/30 transition-colors duration-300">
                    <Users className="text-ambixous-neon" size={32} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">Join Community</h3>
                  <p className="text-slate-600 text-sm">
                    Get exclusive access to community events and early bird registrations.
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold py-3 rounded-xl shadow-lg hover:shadow-ambixous-neon/25 transition-all duration-200"
                >
                  <Link href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t" target="_blank">Join Now</Link>
                </Button>
              </div>
            </div>

            {/* Event Notifications */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-signal-blue/20 rounded-2xl group-hover:bg-signal-blue/30 transition-colors duration-300">
                    <Bell className="text-signal-blue" size={32} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">Get Notified</h3>
                  <p className="text-slate-600 text-sm">
                    Stay updated with the latest events, workshops, and community insights.
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-transparent text-signal-blue hover:bg-signal-blue hover:text-electric-ink font-bold py-3 rounded-xl border-2 border-signal-blue transition-all duration-200"
                >
                  <Link href="https://www.linkedin.com/pulse/founders-dilemma-growth-vs-profitability-2025-ambixous-5meaf/" target="_blank" rel="noopener noreferrer">Subscribe Now</Link>
                </Button>
              </div>
            </div>

            {/* Corporate Events */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-sun-coral/20 rounded-2xl group-hover:bg-sun-coral/30 transition-colors duration-300">
                    <Calendar className="text-sun-coral" size={32} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">Host an Event</h3>
                  <p className="text-slate-600 text-sm">Partner with us to create memorable corporate experiences.</p>
                </div>
                <Button
                  asChild
                  className="w-full bg-transparent text-sun-coral hover:bg-sun-coral hover:text-electric-ink font-bold py-3 rounded-xl border-2 border-sun-coral transition-all duration-200"
                >
                  <Link href="/startups">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
