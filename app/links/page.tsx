import { pageMetadata } from "@/lib/site"
import { HeroSection } from "@/components/links/hero-section"
import { SharePageBar } from "@/components/links/share-page-bar"
import { LinksGrid } from "@/components/links/links-grid"
import { EventsBanner } from "@/components/links/events-banner"
import { Toaster } from "sonner"

export const metadata = pageMetadata({
    title: "Links: Connect With Us",
    description:
        "All Ambixous links in one place: LinkedIn, Instagram, YouTube, X, the WhatsApp community, events on Commudle, and ACE, our free interview prep studio.",
    path: "/links",
})

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
                {/* Hero: Logo + headline + bio + founder portraits */}
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
