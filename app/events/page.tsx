import { EventsHero } from "@/components/events/events-hero"
import { EventsListing } from "@/components/events/events-listing"
import { PastHighlights } from "@/components/events/past-highlights"
import { EventsCTA } from "@/components/events/events-cta"
import { JsonLd } from "@/components/seo/json-ld"
import { allEvents, type EventItem } from "@/lib/events-data"
import { ORG_ID, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Events: Bootcamps, Panels & Meetups",
  description: `${allEvents.length} Ambixous bootcamps, panels and meetups across Delhi NCR and online, at venues like Microsoft and Times Internet. 50+ events, 5,000+ participants.`,
  socialDescription:
    "Practitioner-led bootcamps, panels and founder meetups for India's creators and operators. 50+ events, 5,000+ participants.",
  path: "/events",
})

/** "11:30 AM" -> "11:30:00"; returns null for text like "Late Evening". */
function to24h(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let hours = Number(match[1]) % 12
  if (match[3].toUpperCase() === "PM") hours += 12
  return `${String(hours).padStart(2, "0")}:${match[2]}:00`
}

function eventJsonLd(event: EventItem) {
  const [startText, endText = ""] = event.time.split(/\s*[–-]\s*/)
  const start = to24h(startText)
  const end = to24h(endText)
  const online = event.mode === "Online"

  return {
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: start ? `${event.dateIso}T${start}+05:30` : event.dateIso,
    ...(end ? { endDate: `${event.dateIso}T${end}+05:30` } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: online
      ? { "@type": "VirtualLocation", name: event.location, url: event.registrationUrl }
      : { "@type": "Place", name: event.location, address: `${event.location}, India` },
    organizer: { "@id": ORG_ID },
    url: event.registrationUrl,
    ...(event.speakers.length
      ? { performer: event.speakers.map((name) => ({ "@type": "Person", name })) }
      : {}),
  }
}

const structuredData = [
  {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl("/events")}#page`,
    url: absoluteUrl("/events"),
    name: "Ambixous Events",
    about: { "@id": ORG_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allEvents.length,
      itemListElement: allEvents.map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: eventJsonLd(event),
      })),
    },
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
  ]),
]

export default function EventsPage() {
  return (
    <div className="space-y-0">
      <JsonLd data={structuredData} />
      <EventsHero />
      <EventsListing />
      <PastHighlights />
      <EventsCTA />
    </div>
  )
}
