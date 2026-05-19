"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, ArrowRight, Globe, Building2 } from "lucide-react"
import Link from "next/link"

type EventItem = {
  id: number
  title: string
  dateIso: string
  date: string
  time: string
  type: "Community" | "Corporate"
  mode: "Online" | "Offline"
  location: string
  attendees: number
  description: string
  speakers: string[]
  status: "Completed" | "Upcoming" | "Open" | "Limited Seats" | "Closed"
  registrationUrl: string
}

const allEvents: EventItem[] = [
  {
    id: 10,
    title: "Tech Meetup: AI & Future Skills",
    dateIso: "2025-12-13",
    date: "December 13, 2025",
    time: "11:30 AM – 5:30 PM",
    type: "Community",
    mode: "Offline",
    location: "Times Internet, Noida",
    attendees: 263,
    description:
      "A 5-hour meetup combining hands-on AI workshops, HR panel discussions, keynote sessions and networking for professionals exploring practical AI and future skills.",
    speakers: ["Anand Gangadharan", "Varun Bhanot", "Sakshi Sunil", "Vikas Vats"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/tech-meetup-ai-future-skills",
  },
  {
    id: 9,
    title: "Women's Health Innovation Forum",
    dateIso: "2025-11-28",
    date: "November 28, 2025",
    time: "2:00 PM – 5:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "The Iconic Corenthum, Noida",
    attendees: 50,
    description:
      "An invitation-only forum bringing together gynaecologists, fertility specialists, innovators and women's health stakeholders for structured sessions on research, innovation and collaboration in maternity healthcare.",
    speakers: [
      "Dr. Bandana Sodhi",
      "Dr. Sweta Gupta",
      "Penzy Goyal",
      "Vikas Anand",
      "Malinie Arora",
      "Dr. Shazina Saeed",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/women-s-health-innovation-forum",
  },
  {
    id: 8,
    title: "AI-Driven Bootcamp: Roadmap to Certified QA Engineer feat. FAANG",
    dateIso: "2025-09-21",
    date: "September 21, 2025",
    time: "10:45 AM – Late Evening",
    type: "Community",
    mode: "Online",
    location: "Online",
    attendees: 228,
    description:
      "A 2-day virtual bootcamp on QA testing with hands-on bug hunting, live sessions and tools — led by engineers and architects from Microsoft, Amazon, Google and Deutsche Telekom.",
    speakers: ["Kaustubha V", "Sahil Kapoor", "Varun Bhanot", "Saket Gupta", "Arpan Garg"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/ai-driven-bootcamp-roadmap-to-certified-qa-engineer-feat-faang",
  },
  {
    id: 7,
    title: "Disrupting the Funnel: The Future of AdTech & Brand Marketing",
    dateIso: "2025-09-13",
    date: "September 13, 2025",
    time: "1:00 PM – 5:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "Noida",
    attendees: 121,
    description:
      "An afternoon of candid insights, proven playbooks and pitfalls to avoid from AdTech innovators and growth leaders on taking a brand from 0 → 1.",
    speakers: ["Shaweta Berry", "Rohit Kaul", "Rachita Gupta", "Sayantan Dasgupta"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/disrupting-the-funnel-the-future-of-adtech-brand-marketing",
  },
  {
    id: 6,
    title: "SkillUp Bootcamp",
    dateIso: "2025-08-02",
    date: "August 2, 2025",
    time: "10:30 AM – 4:00 PM",
    type: "Community",
    mode: "Offline",
    location: "Noida",
    attendees: 192,
    description:
      "A high-impact learning experience for developers, designers and tech professionals to upskill through live sessions with experts from Google, Deloitte, Policy Bazaar and Nagarro.",
    speakers: ["Varedh Nigam", "Nitasha Dhingra", "Sneha Swaroop", "Satendra Kumar"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/skillup-bootcamp",
  },
  {
    id: 5,
    title: "AI for Social Good — WTM Google × Ambixous",
    dateIso: "2025-04-05",
    date: "April 5, 2025",
    time: "11:00 AM – 4:00 PM",
    type: "Community",
    mode: "Online",
    location: "LinkedIn Live",
    attendees: 80,
    description:
      "A WTM Google × Ambixous collaboration exploring how AI can drive social impact — through expert sessions, panel discussions and knowledge exchange.",
    speakers: [
      "Dolly Bhasin",
      "Yashaswini Viswanath",
      "Urooj Khan",
      "Kalyani R Kunche",
      "Kaustubha V",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/ai-for-social-good-wtm-google-x-ambixous",
  },
  {
    id: 4,
    title: "The Ambitious Women: Real Stories, Real Empowerment",
    dateIso: "2025-03-08",
    date: "March 8, 2025",
    time: "6:00 PM – 7:00 PM",
    type: "Community",
    mode: "Online",
    location: "LinkedIn Live",
    attendees: 300,
    description:
      "An International Women's Day LinkedIn Live — unfiltered conversations on women's empowerment, personal narratives and varied viewpoints celebrating ambition and progress.",
    speakers: [],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/the-ambitious-women-real-stories-real-empowerment",
  },
  {
    id: 3,
    title: "BRB: Boring Replaced by Bots",
    dateIso: "2025-03-01",
    date: "March 1, 2025",
    time: "1:00 PM – 4:00 PM",
    type: "Community",
    mode: "Offline",
    location: "RNI Park, IIT Delhi",
    attendees: 40,
    description:
      "A candid panel discussion exploring AI's influence on design — current trends, ethical challenges and its transformative impact on creative workflows.",
    speakers: [
      "Gaurav Gupta",
      "Sachin Rathi",
      "Varedh Nigam",
      "Shakti Arora",
      "Aryan Gupta",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/brb-boring-replaced-by-bots",
  },
  {
    id: 2,
    title: "Innovator's Meetup 2025",
    dateIso: "2025-02-09",
    date: "February 9, 2025",
    time: "11:00 AM – 2:00 PM",
    type: "Community",
    mode: "Offline",
    location: "ThoughtWorks, Gurugram",
    attendees: 140,
    description:
      "Empowering the next generation of innovators — bridging aspiring students and freshers with industry leaders through networking, mentorship and discussions on job readiness.",
    speakers: [],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/innovator-s-meetup",
  },
  {
    id: 1,
    title: "Founder's Day Meetup",
    dateIso: "2025-01-18",
    date: "January 18, 2025",
    time: "10:00 AM – 4:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "Microsoft Office, Gurugram",
    attendees: 480,
    description:
      "A celebration of Ambixous milestones with tech professionals, designers, founders and executives — emphasising innovation, collaboration and empowering women in tech.",
    speakers: [
      "Rudransh Agnihotri",
      "Abhishek Shankhdhar",
      "Anand Gangadharan",
      "Snigdha Kashyap",
      "Tushar Debnath",
      "Vineet Kumar Chirania",
      "Avni Srivastava",
      "Arpan Garg",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/founder-s-day-meetup",
  },
]

export function EventsListing() {
  const [typeFilter, setTypeFilter] = useState<"All" | "Community" | "Corporate">("All")
  const [modeFilter, setModeFilter] = useState<"All" | "Online" | "Offline">("All")

  const sorted = useMemo(
    () =>
      [...allEvents]
        .filter((e) => typeFilter === "All" || e.type === typeFilter)
        .filter((e) => modeFilter === "All" || e.mode === modeFilter)
        .sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
    [typeFilter, modeFilter]
  )

  return (
    <section className="py-24 bg-light-ash text-electric-ink">
      <div className="container-width section-padding">
        <div className="space-y-12 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Our <span className="text-gradient">Events</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Every gathering, workshop, panel and bootcamp Ambixous has hosted — sorted
              from most recent. Real rooms, real practitioners, real outcomes.
            </p>
            <p className="text-sm text-slate-500">
              {sorted.length} event{sorted.length === 1 ? "" : "s"} · all powered by the
              Ambixous community
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap justify-center gap-3">
              {(["All", "Community", "Corporate"] as const).map((opt) => (
                <Button
                  key={opt}
                  onClick={() => setTypeFilter(opt)}
                  className={
                    typeFilter === opt
                      ? "bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-6 py-2.5 rounded-xl shadow-lg"
                      : "bg-transparent text-slate-600 hover:text-ambixous-neon hover:border-ambixous-neon font-bold px-6 py-2.5 rounded-xl border-2 border-slate-300 transition-all duration-200"
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {(["All", "Offline", "Online"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setModeFilter(opt)}
                  className={
                    modeFilter === opt
                      ? "inline-flex items-center gap-1.5 rounded-full bg-signal-blue/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-signal-blue border border-signal-blue/40"
                      : "inline-flex items-center gap-1.5 rounded-full bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border border-slate-300 hover:text-signal-blue hover:border-signal-blue/40 transition-colors"
                  }
                >
                  {opt === "Offline" && <Building2 size={12} />}
                  {opt === "Online" && <Globe size={12} />}
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sorted.map((event, index) => (
              <div
                key={event.id}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            event.type === "Community"
                              ? "bg-ambixous-neon/20 text-ambixous-neon border-ambixous-neon/30"
                              : "bg-signal-blue/20 text-signal-blue border-signal-blue/30"
                          }
                        >
                          {event.type}
                        </Badge>
                        <Badge
                          className={
                            event.mode === "Online"
                              ? "bg-purple-100 text-purple-700 border-purple-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {event.mode === "Online" ? (
                              <Globe size={11} />
                            ) : (
                              <Building2 size={11} />
                            )}
                            {event.mode}
                          </span>
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          {event.status}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-electric-ink group-hover:text-signal-blue transition-colors duration-200">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 leading-relaxed">{event.description}</p>

                  {/* Event Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-ambixous-neon shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-signal-blue shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-sun-coral shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-ambixous-neon shrink-0" />
                      <span>{event.attendees}+ attendees</span>
                    </div>
                  </div>

                  {/* Speakers */}
                  {event.speakers.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-electric-ink">
                        Featured Speakers:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.speakers.map((speaker) => (
                          <span
                            key={speaker}
                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                          >
                            {speaker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block"
                  >
                    <Button className="mt-[7px] w-full bg-signal-blue text-electric-ink hover:bg-signal-blue/90 font-bold py-3 rounded-xl shadow-lg hover:shadow-signal-blue/25 transition-all duration-200 group">
                      <span className="flex items-center justify-center gap-2">
                        View Event
                        <ArrowRight
                          size={20}
                          className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {sorted.length === 0 && (
            <p className="text-center text-slate-500 py-12">
              No events match the selected filters.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
