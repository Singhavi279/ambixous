import { Button } from "@/components/ui/button"
import { MessageCircle, UserPlus, Sparkles } from "lucide-react"
import { JoinForm } from "./join-form"

export function JoinProcess() {
  const steps = [
    {
      number: "1",
      title: "Join our open WhatsApp group",
      description: "Get instant access to our community conversations",
      icon: MessageCircle,
    },
    {
      number: "2",
      title: "Show up when you're ready",
      description: "Lurk, lead, or learn — it's your call",
      icon: Sparkles,
    },
    {
      number: "3",
      title: "Want to do more? Join the team",
      description: "Apply for an internship or a volunteer role with Ambixous",
      icon: UserPlus,
    },
  ]

  return (
    <section id="join-process" className="py-24 bg-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-16 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-warm-white">
              How to <span className="text-gradient">Join</span>
            </h2>
            <p className="text-xl text-slate-gray">We keep it simple:</p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className="text-center space-y-6 animate-slide-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="relative">
                    <div className="w-20 h-20 bg-ambixous-neon rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-electric-ink">{step.number}</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="p-2 bg-signal-blue rounded-full">
                        <Icon className="text-white" size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-warm-white">{step.title}</h3>
                    <p className="text-slate-gray">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Joining the community happens on WhatsApp */}
          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-auto min-h-11 w-full whitespace-normal bg-ambixous-neon py-3 text-center font-semibold text-electric-ink transition-all duration-200 hover:bg-ambixous-neon/90 focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-electric-ink sm:w-auto"
            >
              <a
                href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} aria-hidden="true" />
                Join the Community WhatsApp Group
                <span className="sr-only">(opens WhatsApp in a new tab)</span>
              </a>
            </Button>
          </div>

          {/* Team application (internships and volunteering) */}
          <div id="team-application" className="max-w-4xl mx-auto scroll-mt-24">
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-gray/20">
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-warm-white">Join the Ambixous Team</h3>
                <p className="text-slate-gray">Intern or volunteer with the core team and get hands-on event management, leadership and corporate exposure.</p>

                <JoinForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
