"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, ArrowRight, Globe, Building2 } from "lucide-react"
import Link from "next/link"
import { allEvents } from "@/lib/events-data"

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
                  type="button"
                  aria-pressed={typeFilter === opt}
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
                  type="button"
                  aria-pressed={modeFilter === opt}
                  onClick={() => setModeFilter(opt)}
                  className={
                    modeFilter === opt
                      ? "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-signal-blue/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-electric-ink border border-signal-blue"
                      : "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border border-slate-300 hover:text-signal-blue hover:border-signal-blue/40 transition-colors"
                  }
                >
                  {opt === "Offline" && <Building2 size={12} aria-hidden="true" />}
                  {opt === "Online" && <Globe size={12} aria-hidden="true" />}
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
                  <Button
                    asChild
                    className="mt-[7px] min-h-11 w-full bg-signal-blue text-electric-ink hover:bg-signal-blue/90 font-bold py-3 rounded-xl shadow-lg hover:shadow-signal-blue/25 transition-all duration-200 group"
                  >
                    <Link href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                      View Event
                      <span className="sr-only">: {event.title} (opens Commudle in a new tab)</span>
                      <ArrowRight
                        size={20}
                        aria-hidden="true"
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </Link>
                  </Button>
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
