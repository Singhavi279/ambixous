import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/certify",
        "/certify/",
        "/partners",
        "/creator-fellowship/cohort-1/graduation-agreement",
      ],
    },
    sitemap: "https://www.ambixous.in/sitemap.xml",
  }
}
