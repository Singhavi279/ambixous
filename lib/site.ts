import type { Metadata } from "next"

/**
 * Canonical origin. next.config.mjs permanently redirects www.ambixous.in here,
 * so every canonical, sitemap entry and JSON-LD @id must use the bare domain.
 */
export const SITE_URL = "https://ambixous.in"
export const SITE_NAME = "Ambixous"
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** 1200x630 social card (generated from /hero.jpg, kept under WhatsApp's ~300 KB preview limit). */
export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Ambixous co-founders Riti Gupta and Avnish Singh at an Ambixous community event",
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`

type PageMetadataInput = {
  /** Page title without the brand suffix; the root layout template appends " | Ambixous". */
  title: string
  description: string
  path: string
  /** Use when the title already contains the brand and must not get the template suffix. */
  absoluteTitle?: boolean
  /** Shorter social copy; falls back to `description`. */
  socialDescription?: string
  image?: { url: string; width: number; height: number; alt: string }
}

/** Per-page title, description, canonical, Open Graph and Twitter tags. */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  socialDescription,
  image = OG_IMAGE,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`
  const social = socialDescription ?? description
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: fullTitle,
      description: social,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: social,
      images: [image.url],
    },
  }
}

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

/** Stable @id for a founder's Person entity (declared in the root layout, expanded on the home page). */
export const personId = (name: string) => `${SITE_URL}/#${name.toLowerCase().replace(/\s+/g, "-")}`
