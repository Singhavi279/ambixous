import { AboutHero } from "@/components/about/about-hero"
import { DualModel } from "@/components/about/dual-model"
import { Values } from "@/components/about/values"
import { ImpactMetrics } from "@/components/about/impact-metrics"
import { JoinCTA } from "@/components/about/join-cta"
import { JsonLd } from "@/components/seo/json-ld"
import { ORG_ID, WEBSITE_ID, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "About Us: Creator Community and Growth Studio",
  description:
    "Ambixous runs a free non-profit community (5,000+ members, 100+ mentors, 150+ referrals) and Ambixous Innovations LLP, a growth partner for brands.",
  socialDescription:
    "Two arms, one mission: a non-profit creator community and a full-stack experience partner for brands. Curiosity, collaboration, courage.",
  path: "/about",
})

const structuredData = [
  {
    "@type": "AboutPage",
    "@id": `${absoluteUrl("/about")}#page`,
    url: absoluteUrl("/about"),
    name: "About Ambixous",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": ORG_ID },
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]),
]

export default function AboutPage() {
  return (
    <div className="space-y-0">
      <JsonLd data={structuredData} />
      <AboutHero />
      <DualModel />
      <Values />
      <ImpactMetrics />
      <JoinCTA />
    </div>
  )
}
