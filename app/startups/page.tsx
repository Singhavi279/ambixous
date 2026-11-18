import { StartupsHero } from "@/components/startups/startups-hero"
import { ServicesGrid } from "@/components/startups/services-grid"
import { ClientShowcase } from "@/components/startups/client-showcase"
import { ProcessSection } from "@/components/startups/process-section"
import { StartupsCTA } from "@/components/startups/startups-cta"
import { JsonLd } from "@/components/seo/json-ld"
import { ORG_ID, WEBSITE_ID, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Growth Studio for Startups and Brands",
  description:
    "Ambixous Innovations LLP runs corporate events, product launches, employer branding, social and LinkedIn content and websites for startups and corporates.",
  socialDescription:
    "Smart brands don't just grow, they connect. Events, launches, employer branding, content and web, delivered by practitioners from the Ambixous network.",
  path: "/startups",
})

// One entry per card in the "What We Do" grid.
const services = [
  { name: "Corporate Events & Internal Offsites", description: "Team workshops, leadership retreats, company celebrations and hybrid events." },
  { name: "Product Launch Experiences", description: "Launch strategy, media coordination, influencer partnerships and community activation." },
  { name: "Talent Branding & Employer Collabs", description: "Employer brand strategy, recruitment campaigns, culture showcases and talent acquisition events." },
  { name: "Social Media Campaigns & Digital Design", description: "Visual identity design, social media strategy, content creation and brand guidelines." },
  { name: "LinkedIn Content Strategy", description: "Content planning, thought leadership, engagement strategy and performance analytics." },
  { name: "Website Dev & UX Optimization", description: "Responsive web design, UX/UI optimization, performance enhancement and conversion optimization." },
]

const structuredData = [
  {
    "@type": "WebPage",
    "@id": `${absoluteUrl("/startups")}#page`,
    url: absoluteUrl("/startups"),
    name: "Ambixous for Startups and Brands",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "OfferCatalog",
      name: "Ambixous Innovations LLP services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
          provider: { "@id": ORG_ID },
          areaServed: "IN",
        },
      })),
    },
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Startups", path: "/startups" },
  ]),
]

export default function StartupsPage() {
  return (
    <div className="space-y-0">
      <JsonLd data={structuredData} />
      <StartupsHero />
      <ServicesGrid />
      <ProcessSection />
      <ClientShowcase />
      <StartupsCTA />
    </div>
  )
}
