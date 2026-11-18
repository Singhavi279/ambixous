import type React from "react"
import type { Metadata } from "next"
import { Sora, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SiteLoader } from "@/components/site/site-loader"
import { founders } from "@/lib/founders"
import { JsonLd } from "@/components/seo/json-ld"
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID, personId } from "@/lib/site"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const siteUrl = SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ambixous | India's Leading Creator-Entrepreneur Community",
    template: "%s | Ambixous",
  },
  description:
    "Ambixous is a premier network helping creators, students, and professionals in India transition into creator-entrepreneurs. Join the Creator Fellowship, ACE career studio, and exclusive live events.",
  applicationName: "Ambixous",
  keywords: [
    "creator fellowship India",
    "creator entrepreneur",
    "creator economy India",
    "mock interview prep India",
    "tech community Delhi NCR",
    "Ambixous",
    "ACE by Ambixous",
    "creator education",
    "startup mentorship India",
    "founder community",
    "personal branding",
  ],
  authors: [{ name: "Ambixous Innovations LLP" }],
  creator: "Ambixous Innovations LLP",
  publisher: "Ambixous Innovations LLP",
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Ambixous",
    url: siteUrl,
    title: "Ambixous | India's Leading Creator-Entrepreneur Community",
    description:
      "Empowering India's next generation of builders. Discover the Creator Fellowship, ACE career studio, and high-impact live community events.",
    locale: "en_IN",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous | Creator-Entrepreneur Community",
    description:
      "Creator Fellowship, ACE career studio, and live community events for India's next generation of builders.",
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  other: {
    "geo.region": "IN-HR",
    "geo.placename": "Gurugram, Haryana, India",
    "geo.position": "28.5134;77.0645",
    ICBM: "28.5134, 77.0645",
    "distribution": "global",
    "target-country": "IN",
  },
}

// Site-wide entities. Pages reference these by @id instead of repeating them.
const organizationJsonLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Ambixous",
  legalName: "Ambixous Innovations LLP",
  url: siteUrl,
  logo: { "@type": "ImageObject", url: `${siteUrl}/logo.jpg`, width: 635, height: 160 },
  image: `${siteUrl}${OG_IMAGE.url}`,
  slogan: "Build. Connect. Grow. Together.",
  description:
    "India's creator-entrepreneur community and growth studio. The community arm runs the Creator Fellowship, the free ACE career studio and live events for a 5,000+ member network; the business arm, Ambixous Innovations LLP, delivers brand, creator-marketing and hiring work for startups and corporates.",
  founder: founders.map((founder) => ({
    "@type": "Person",
    "@id": personId(founder.name),
    name: founder.name,
    sameAs: [founder.linkedin],
  })),
  foundingLocation: { "@type": "Place", name: "India" },
  areaServed: "IN",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1st Floor, A-23, Hardware Paints and Tools Aggarwal Electrical and Dundahera Village; Lal Dora, Sec 20",
    addressLocality: "Gurugram",
    addressRegion: "Haryana",
    postalCode: "122016",
    addressCountry: "IN"
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hi.ambixous@gmail.com",
    contactType: "customer support"
  },
  sameAs: [
    "https://www.linkedin.com/company/ambixous/",
    "https://www.instagram.com/myambixous/",
    "https://www.youtube.com/@Ambixous",
    "https://x.com/myambixous",
    "https://www.commudle.com/communities/ambixous",
  ],
}

const websiteJsonLd = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Ambixous",
  url: siteUrl,
  inLanguage: "en-IN",
  publisher: { "@id": ORG_ID },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-X78W0PCES1" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X78W0PCES1');
          `}
        </Script>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </head>
      <body className="bg-[#010409] text-[#F8F8F8] font-sora antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-full focus:bg-ambixous-neon focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-electric-ink focus:outline-none focus:ring-2 focus:ring-warm-white"
        >
          Skip to content
        </a>
        <SiteLoader />
        <Header />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
