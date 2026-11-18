import { CommunityHero } from "@/components/community/community-hero"
import { CommunityBenefits } from "@/components/community/community-benefits"
import { JoinProcess } from "@/components/community/join-process"
import { CommunityImpact } from "@/components/community/community-impact"
import { JsonLd } from "@/components/seo/json-ld"
import { ORG_ID, WEBSITE_ID, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Join the Creator Community, Free",
  description:
    "Free, non-profit community of 5,000+ creators, students and operators. Real mentors, bootcamps and invite-only events. Join on WhatsApp or apply to the team.",
  socialDescription:
    "No cost, just value. 5,000+ members, 100+ mentors, 150+ hiring referrals. Join India's creator-entrepreneur community.",
  path: "/community",
})

// Mirrors the joining steps in "How to Join" (WhatsApp, then show up). The team application is separate.
const structuredData = [
  {
    "@type": "WebPage",
    "@id": `${absoluteUrl("/community")}#page`,
    url: absoluteUrl("/community"),
    name: "Ambixous Community",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    mainEntity: {
      "@type": "HowTo",
      name: "How to join the Ambixous Community",
      description: "Joining is free: join the WhatsApp group and show up.",
      estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: 0 },
      step: [
        { "@type": "HowToStep", position: 1, name: "Join the open WhatsApp group", text: "Get instant access to community conversations." },
        { "@type": "HowToStep", position: 2, name: "Show up when you're ready", text: "Lurk, lead, or learn. It's your call." },
      ],
    },
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Community", path: "/community" },
  ]),
]

export default function CommunityPage() {
  return (
    <div className="space-y-0">
      <JsonLd data={structuredData} />
      <CommunityHero />
      <CommunityBenefits />
      <JoinProcess />
      <CommunityImpact />
    </div>
  )
}
