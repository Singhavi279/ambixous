import { HeroSection } from "@/components/home/hero-section"
import { AboutSection } from "@/components/home/about-section"
import { AceSection } from "@/components/home/ace-section"
import { EventsSection } from "@/components/home/events-section"
import { FoundersSection } from "@/components/home/founders-section"
import { NetworkSection } from "@/components/home/network-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <AboutSection />
      <AceSection />
      <EventsSection />
      <FoundersSection />
      <NetworkSection />
      <TestimonialsSection />
    </div>
  )
}
