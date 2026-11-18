import { MentorsDirectory } from "@/components/mentors/mentors-directory"
import { JsonLd } from "@/components/seo/json-ld"
import { mentors } from "@/lib/mentor-data"
import { ORG_ID, WEBSITE_ID, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Mentors: Founders and Industry Experts",
  description: `Meet ${mentors.length} Ambixous mentors: founders, growth experts and professionals from Microsoft, Adobe, American Express, Deloitte, Paytm and Times Internet.`,
  socialDescription: `${mentors.length} founders, growth experts and professionals mentoring the Ambixous community.`,
  path: "/mentors",
})

const structuredData = [
  {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl("/mentors")}#page`,
    url: absoluteUrl("/mentors"),
    name: "Ambixous Mentors",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: mentors.length,
      itemListElement: mentors.map((mentor, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Person",
          name: mentor.name,
          ...(mentor.linkedin ? { sameAs: [mentor.linkedin] } : {}),
          affiliation: { "@type": "Organization", name: mentor.company },
          memberOf: { "@id": ORG_ID },
        },
      })),
    },
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Mentors", path: "/mentors" },
  ]),
]

export default function MentorsPage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <MentorsDirectory />
    </>
  )
}
