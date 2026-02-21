import type { Metadata } from "next"
import { HeroSection } from "@/components/links/hero-section"
import { SharePageBar } from "@/components/links/share-page-bar"
import { LinksGrid } from "@/components/links/links-grid"
import { EventsBanner } from "@/components/links/events-banner"
import { Toaster } from "sonner"

export const metadata: Metadata = {
    title: "Ambixous Links — Connect With Us",
    description:
        "All our links in one place. Follow Ambixous across LinkedIn, Instagram, YouTube, Twitter, and explore our flagship product ACE.",
    openGraph: {
        title: "Ambixous Links — Connect With Us",
        description:
            "All our links in one place. Follow Ambixous across LinkedIn, Instagram, YouTube, Twitter, and explore our flagship product ACE.",
        url: "https://ambixous.in/links",
        siteName: "Ambixous",
        images: [
            {
                url: "/hero.JPG",
                width: 1248,
                height: 832,
                alt: "Riti Gupta and Avnish Singh — Cofounders of Ambixous",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Ambixous Links — Connect With Us",
        description:
            "All our links in one place. Follow Ambixous across LinkedIn, Instagram, YouTube, Twitter, and explore ACE.",
        images: ["/hero.JPG"],
    },
}

export default function LinksPage() {
    return (
        <>
            <Toaster
                position="top-center"
                theme="dark"
                toastOptions={{
                    style: {
                        background: "#0d1117",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#F8F8F8",
                    },
                }}
            />
            <div className="min-h-screen bg-electric-ink">
                {/* Hero: Logo + headline + bio + founders photo */}
                <HeroSection />

                {/* Share bar: Share link, Copy URL, QR code */}
                <SharePageBar />

                {/* Divider */}
                <div className="w-12 h-px bg-white/10 mx-auto my-2" />

                {/* Link cards */}
                <LinksGrid />

                {/* Spacer */}
                <div className="h-12" />

                {/* Events banner */}
                <EventsBanner />
            </div>
        </>
    )
}
