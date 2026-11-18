import { Users, Award, TrendingUp, Calendar, Building2, Heart } from "lucide-react"
import { CountUp } from "@/components/motion/count-up"

export function ImpactMetrics() {
  const metrics = [
    {
      icon: Users,
      number: 5000,
      suffix: "+",
      label: "Community Members",
      description: "Active learners and builders",
      color: "text-ambixous-neon",
    },
    {
      icon: Award,
      number: 100,
      suffix: "+",
      label: "Mentors Onboarded",
      description: "Industry experts sharing knowledge",
      color: "text-signal-blue",
    },
    {
      icon: TrendingUp,
      number: 150,
      suffix: "+",
      label: "Hiring Referrals",
      description: "Successful career transitions",
      color: "text-sun-coral",
    },
    {
      icon: Calendar,
      number: 50,
      suffix: "+",
      label: "Events Hosted",
      description: "Learning and networking sessions",
      color: "text-ambixous-neon",
    },
    {
      icon: Building2,
      number: 25,
      suffix: "+",
      label: "Corporate Partners",
      description: "Brands we've collaborated with",
      color: "text-signal-blue",
    },
    {
      icon: Heart,
      number: 1000,
      suffix: "+",
      label: "Lives Impacted",
      description: "Real Stories of growth and success",
      color: "text-sun-coral",
    },
  ]

  return (
    <section className="py-24 bg-light-ash text-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-16 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Impact <span className="text-gradient">Metrics</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Be part of one of the fastest-growing innovation networks in India - trusted by top corporates and powered by grassroots energy.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Icon className={metric.color} size={24} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className={`text-4xl font-bold ${metric.color}`}>
                        <CountUp value={metric.number} suffix={metric.suffix} />
                      </div>
                      <div className="text-xl font-semibold text-electric-ink">{metric.label}</div>
                      <div className="text-slate-600">{metric.description}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
