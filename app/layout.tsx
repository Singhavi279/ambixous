import type React from "react"
import type { Metadata } from "next"
import { Sora, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppFloat } from "@/components/whatsapp-float"

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

export const metadata: Metadata = {
  title: "Ambixous - Build. Connect. Grow. Together.",
  description:
    "Where ideas find momentum and impact finds a home. A bridge between community-driven change and business-driven innovation.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  metadataBase: new URL('https://ambixous.com'),
  openGraph: {
    title: "Ambixous - Build. Connect. Grow. Together.",
    description: "Where ideas find momentum and impact finds a home. A bridge between community-driven change and business-driven innovation.",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous - Build. Connect. Grow. Together.",
    description: "Where ideas find momentum and impact finds a home. A bridge between community-driven change and business-driven innovation.",
    images: ["/logo.png"],
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* Preload critical assets */}
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        
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
      </head>
      <body className="bg-[#010409] text-[#F8F8F8] font-sora antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  )
}
