import { Calendar, Users, Award, TrendingUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PastHighlights() {
  const pastEvents = [
    {
      title: "Disrupting the Funnel",
      date: "September 13, 2025",
      type: "Corporate",
      attendees: 100,
      impact: "Elevated marketing from 0 → 1",
      description: "An afternoon of candid insights, proven playbooks, and pitfalls to avoid from AdTech innovators and growth leaders.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/disrupting-the-funnel-the-future-of-adtech-brand-marketing",
    },
    {
      title: "SkillUp Bootcamp",
      date: "August 2, 2025",
      type: "Community",
      attendees: 200,
      impact: "Created awareness about upskilling",
      description: "A high-impact learning experience for developers, designers, and tech professionals to upskill through live sessions.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/skillup-bootcamp",
    },
    {
      title: "Fusion Forum",
      date: "July 19, 2025",
      type: "Corporate",
      attendees: 80,
      impact: "12 partnerships formed",
      description: "Corporate networking event bringing together startups and established companies for collaboration.",
      learnUrl: "https://reskilll.com/event/devconnect",
    },
    {
      title: "AI for Social Good",
      date: "April 05, 2025",
      type: "Community",
      attendees: 200,
      impact: "5 social projects launched",
      description:
        "Collaborative workshop with Google WTM exploring AI applications for social impact and community development.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/ai-for-social-good-wtm-google-x-ambixous",
    },
    {
      title: "The Ambitious Women: LIVE",
      date: "March 08, 2025",
      type: "Community",
      attendees: 300,
      impact: "50+ mentorship connections",
      description:
        "International Women's Day celebration featuring inspiring stories from women leaders across industries.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/the-ambitious-women-real-stories-real-empowerment",
    },
    {
      title: "BRB : Boring Replaced by Bots",
      date: "March 01, 2024",
      type: "Corporate",
      attendees: 40,
      impact: "10+ mentorship connections",
      description:
        "A live event where top creatives explore AI’s impact on design, answer questions, and spark collaboration.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/brb-boring-replaced-by-bots",
    },
    {
      title: "Innovator's Meetup",
      date: "February 09, 2025",
      type: "Community",
      attendees: 150,
      impact: "15+ mentorship connections",
      description:
        "An opportunity to gain expert insights, boost job readiness, expand your network, and showcase thought leadership in tech and design.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/innovator-s-meetup",
    },
    {
      title: "Founder’s Day Meetup",
      date: "January 18, 2025",
      type: "Corporate",
      attendees: 500,
      impact: "70+ mentorship connections",
      description:
        "A celebration of Ambixous’s milestones, fostering networking, inspiring tech leaders, and driving innovation with a focus on empowering women in tech.",
      learnUrl: "https://www.commudle.com/communities/ambixous/events/founder-s-day-meetup",
    },
  ]

  return (
    <section className="py-24 bg-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-16 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-warm-white">
              Past <span className="text-gradient">Highlights</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-gray max-w-3xl mx-auto">
              Our events have connected 5,000+ professionals and students - accelerating careers, closing deals, and building skills that last. Here’s a look back at the experiences that made it happen.
            </p>
          </div>

          {/* Events Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pastEvents.map((event, index) => (
              <div
                key={index}
                className="bg-slate-900/50 p-8 rounded-2xl border border-slate-gray/20 hover:border-ambixous-neon/50 transition-all duration-300 hover:scale-105 group animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="space-y-6">
                  {/* Event Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${event.type === "Community"
                          ? "bg-ambixous-neon/20 text-ambixous-neon"
                          : "bg-signal-blue/20 text-signal-blue"
                          }`}
                      >
                        {event.type}
                      </span>
                      <span className="text-slate-gray text-sm">{event.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-warm-white group-hover:text-ambixous-neon transition-colors duration-200">
                      {event.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-slate-gray leading-relaxed">{event.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-gray">
                      <Users size={16} className="text-ambixous-neon" />
                      <span className="text-sm">{event.attendees} attendees</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-gray">
                      <TrendingUp size={16} className="text-signal-blue" />
                      <span className="text-sm">{event.impact}</span>
                    </div>
                  </div>

                  {/* Learn Now Button */}
                  <Link href={event.learnUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="mt-[7px] w-full bg-signal-blue text-electric-ink hover:bg-signal-blue/90 font-bold py-3 rounded-xl shadow-lg hover:shadow-signal-blue/25 transition-all duration-200 hover:scale-105 group">
                      <span className="flex items-center justify-center gap-2">
                        Learn More
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Impact Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-4 bg-ambixous-neon/20 rounded-2xl">
                  <Calendar className="text-ambixous-neon" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-ambixous-neon">50+</div>
              <div className="text-slate-gray">Events Hosted - in the last 24 months</div>
            </div>
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-4 bg-signal-blue/20 rounded-2xl">
                  <Users className="text-signal-blue" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-signal-blue">5000+</div>
              <div className="text-slate-gray">Total Participants -  engaged in learning, networking, and growth</div>
            </div>
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-4 bg-sun-coral/20 rounded-2xl">
                  <Award className="text-sun-coral" size={32} />
                </div>
              </div>
              <div className="text-4xl font-bold text-sun-coral">98%</div>
              <div className="text-slate-gray">Satisfaction Rate  - participants rated their experiences as highly valuable</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
