import type React from "react"
import type { Metadata } from "next"
import { Sora, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/auth-provider"
import { SiteLoader } from "@/components/site/site-loader"

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

const siteUrl = "https://www.ambixous.in"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ambixous | India's Creator-Entrepreneur Community",
    template: "%s | Ambixous",
  },
  description:
    "Ambixous helps creators, students, and professionals in India become creator-entrepreneurs through the Creator Fellowship, ACE career studio, and live community events.",
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
  ],
  authors: [{ name: "Ambixous Innovations LLP" }],
  category: "education",
  openGraph: {
    type: "website",
    siteName: "Ambixous",
    url: siteUrl,
    title: "Ambixous | India's Creator-Entrepreneur Community",
    description:
      "Ambixous helps creators, students, and professionals in India become creator-entrepreneurs through the Creator Fellowship, ACE career studio, and live community events.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous | India's Creator-Entrepreneur Community",
    description:
      "Creator Fellowship, ACE career studio, and live community events for India's next generation of builders.",
  },
  alternates: { canonical: siteUrl },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ambixous",
  legalName: "Ambixous Innovations LLP",
  url: siteUrl,
  logo: `${siteUrl}/logo.jpg`,
  description:
    "Creator-entrepreneur community and education platform in India. Operates the Creator Fellowship, ACE career studio, and a calendar of live events.",
  founder: [
    { "@type": "Person", name: "Riti Gupta", url: "https://www.linkedin.com/in/ritigupta05/" },
    { "@type": "Person", name: "Avnish Singh", url: "https://www.linkedin.com/in/singhavi279/" },
  ],
  foundingLocation: { "@type": "Place", name: "India" },
  areaServed: "IN",
  sameAs: [
    "https://www.linkedin.com/company/ambixous/",
    "https://www.commudle.com/communities/ambixous",
  ],
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ambixous",
  url: siteUrl,
  inLanguage: "en-IN",
  publisher: { "@type": "Organization", name: "Ambixous" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* Certificate Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />
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
        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-[#010409] text-[#F8F8F8] font-sora antialiased">
        <AuthProvider>
          <SiteLoader />
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
