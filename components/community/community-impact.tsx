import { Button } from "@/components/ui/button"
import { Heart, Users, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

export function CommunityImpact() {
  const stats = [
    {
      icon: Users,
      number: "5000+",
      label: "members",
      color: "text-ambixous-neon",
    },
    {
      icon: Award,
      number: "100+",
      label: "mentors onboarded",
      color: "text-signal-blue",
    },
    {
      icon: TrendingUp,
      number: "150+",
      label: "hiring referrals made",
      color: "text-sun-coral",
    },
  ]

  return (
    <section className="py-24 bg-light-ash text-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-16 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Impact <span className="text-gradient">So Far</span>
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="text-center space-y-4 animate-slide-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl shadow-lg">
                      <Icon className={`${stat.color}`} size={32} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-5xl font-bold ${stat.color}`}>{stat.number}</div>
                    <div className="text-slate-600 font-medium">{stat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Volunteer CTA */}
          <div className="text-center space-y-8">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-3xl font-bold text-electric-ink">Want to Make an Even Bigger Impact?</h3>
              <p className="text-xl text-slate-600">
                Become part of our core impact team, the people shaping India’s fastest-growing growth network. As a volunteer, you’ll gain student leadership program experience, hands-on event management skills, and corporate exposure through high-impact projects. This is your chance to lead, learn, and leave a legacy.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-ambixous-neon text-electric-ink hover:border-ambixous-neon/90 hover:scale-105 transition-all duration-200"
            >
              <Link href="#team-application" className="flex items-center gap-2">
                <Heart size={20} className="group-hover:scale-110 transition-transform duration-200" />
                Volunteer With Us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
