import { HeroSection } from "@/components/home/hero-section"
import { AboutSection } from "@/components/home/about-section"
import { FellowshipSection } from "@/components/home/fellowship-section"
import { AceSection } from "@/components/home/ace-section"
import { EventsSection } from "@/components/home/events-section"
import { FoundersSection } from "@/components/home/founders-section"
import { NetworkSection } from "@/components/home/network-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { JsonLd } from "@/components/seo/json-ld"
import { founders } from "@/lib/founders"
import { ORG_ID, SITE_URL, WEBSITE_ID, absoluteUrl, pageMetadata, personId } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Ambixous | Build. Connect. Grow. Together.",
  absoluteTitle: true,
  description:
    "India's creator-entrepreneur community and growth studio: the Creator Fellowship, free ACE interview prep and live events for 5,000+ members and 100+ mentors.",
  socialDescription:
    "Where India's creators, students and operators turn ambition into outcomes. Creator Fellowship, free ACE career studio, live events, 5,000+ members.",
  path: "/",
})

// Founders appear on this page, so their Person entities are expanded here.
const structuredData = [
  {
    "@type": "WebPage",
    "@id": `${SITE_URL}/#home`,
    url: absoluteUrl("/"),
    name: "Ambixous | Build. Connect. Grow. Together.",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    primaryImageOfPage: `${SITE_URL}/og.jpg`,
  },
  ...founders.map((founder) => ({
    "@type": "Person",
    "@id": personId(founder.name),
    name: founder.name,
    jobTitle: founder.role,
    description: founder.description,
    image: `${SITE_URL}${founder.photo}`,
    sameAs: [founder.linkedin],
    worksFor: { "@id": ORG_ID },
  })),
]

export default function HomePage() {
  return (
    <div className="space-y-0">
      <JsonLd data={structuredData} />
      <HeroSection />
      <AboutSection />
      <FellowshipSection />
      <AceSection />
      <EventsSection />
      <FoundersSection />
      <NetworkSection />
      <TestimonialsSection />
    </div>
  )
}
