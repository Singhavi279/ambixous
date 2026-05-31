import type { Metadata } from "next"
import Link from "next/link"
import type { CSSProperties } from "react"
import {
  ArrowDown,
  Sparkles,
  ShieldCheck,
  Check,
  Star,
  Headset,
  Zap,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Video,
} from "lucide-react"

import { ScrollReveal } from "../creator-fellowship/cohort-1/ScrollReveal"
import AmbientCursor from "../creator-fellowship/cohort-1/AmbientCursor"
import ScrollProgress from "../creator-fellowship/cohort-1/ScrollProgress"
import Magnetic from "../creator-fellowship/cohort-1/Magnetic"
import TiltCard from "../creator-fellowship/cohort-1/TiltCard"
import { Logo } from "@/components/logo"

/* ─────────────── METADATA ─────────────── */

export const metadata: Metadata = {
  title: "Brand Partnerships | Ambixous Creator Retreat",
  description:
    "A 24-Hour Creator Retreat. Your Next Viral Ad Campaign. Seamless brand integration through fun, engaging activities and raw video assets at Beri Farm, Manesar.",
  openGraph: {
    title: "Ambixous Creator Retreat | Brand Partnerships",
    description:
      "A 24-Hour Creator Retreat. Your Next Viral Ad Campaign. Seamless brand integration through fun, engaging activities and raw video assets.",
    url: "https://www.ambixous.in/partners",
    siteName: "Ambixous",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous Creator Retreat | Brand Partnerships",
    description: "A 24-Hour Creator Retreat. Your Next Viral Ad Campaign.",
  },
  alternates: {
    canonical: "https://www.ambixous.in/partners",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
}

/* ─────────────── DATA ─────────────── */

const formatPillars = [
  {
    number: 1,
    title: "Activity-Based Integration",
    description: "Instead of boring scripts, your products are integrated into fun graduation activities, challenges, and games at the farmhouse for authentic reactions.",
    icon: Sparkles,
    from: "#B4FF00",
    to: "#1FB6FF",
  },
  {
    number: 2,
    title: "Vlogs & Reels",
    description: "The footage is designed to feel native to platforms. Perfect for organic YouTube vlogs, high-retention Instagram Reels, and Meta Performance Ads.",
    icon: Video,
    from: "#F472B6",
    to: "#A855F7",
  },
  {
    number: 3,
    title: "Full Ad Rights Included",
    description: "We don't hold the footage hostage. You receive the raw video files and final edits with perpetual licensing to run them as paid ads forever.",
    icon: ShieldCheck,
    from: "#38BDF8",
    to: "#3B82F6",
  },
]

const pricingTiers = [
  {
    name: "The Placement",
    price: "₹10,000",
    subtitle: "+ Product Barter",
    features: [
      { text: "Shared Activity Integration (Product featured natively in one group challenge/game)", bold: "Shared Activity Integration" },
      { text: "3 Dedicated Reels (Ready-to-post vertical videos)", bold: "3 Dedicated Reels" },
      { text: "Raw Activity Footage (Unedited clips)", bold: "Raw Activity Footage" },
      { text: "Full Ad Rights (Run Meta/Insta ads forever)", bold: "Full Ad Rights" },
    ],
    accent: "#1FB6FF",
    popular: false,
  },
  {
    name: "The Challenge",
    price: "₹25,000",
    subtitle: "+ Product Barter",
    features: [
      { text: "Dedicated Brand Activity (A 20-min segment or game entirely focused on your product)", bold: "Dedicated Brand Activity" },
      { text: "6 Dedicated Reels (Double the output for diverse ad testing)", bold: "6 Dedicated Reels" },
      { text: "YouTube Vlog Integration (A dedicated segment in the official retreat vlog)", bold: "YouTube Vlog Integration" },
      { text: "Raw B-Roll Data Dump (Access to all alternate takes and outtakes)", bold: "Raw B-Roll Data Dump" },
      { text: "Full Ad Rights (Run Meta/Insta ads forever)", bold: "Full Ad Rights" },
    ],
    accent: "#B4FF00",
    popular: true,
  },
  {
    name: "Title Sponsor",
    price: "₹50,000",
    subtitle: "+ Product Barter",
    features: [
      { text: '"Presented By" Status (Exclusive title rights for the entire 24-hour retreat)', bold: '"Presented By" Status' },
      { text: "12 Dedicated Reels (2 Reels from every single creator at the event)", bold: "12 Dedicated Reels" },
      { text: "Dedicated YouTube Video (A standalone vlog completely focused on your brand integration)", bold: "Dedicated YouTube Video" },
      { text: "Complete Data Pipeline (Every single video clip shot over 24 hours)", bold: "Complete Data Pipeline" },
    ],
    accent: "#FFB347",
    popular: false,
  },
]

const whatsappMessage = encodeURIComponent(
  "Hi, i am interested in partnership for the creator meetup event, need more details."
)

const contactCards = [
  {
    name: "Riti Gupta",
    label: "Sponsorship",
    phoneHref: "tel:+919971434800",
    whatsappHref: `https://wa.me/919971434800?text=${whatsappMessage}`,
    icon: Headset,
    accent: "#1FB6FF",
  },
  {
    name: "Avnish Singh",
    label: "General Query",
    phoneHref: "tel:+917417914565",
    whatsappHref: `https://wa.me/917417914565?text=${whatsappMessage}`,
    icon: Zap,
    accent: "#B4FF00",
  },
  {
    name: "Yug Sarin",
    label: "Partnerships",
    phoneHref: "tel:+919555837295",
    whatsappHref: `https://wa.me/919555837295?text=${whatsappMessage}`,
    icon: MessageCircle,
    accent: "#FF6978",
  },
]

/* ─────────────── PAGE COMPONENT ─────────────── */

export default function PartnersPage() {
  return (
    <>
      <ScrollProgress />
      <AmbientCursor />

      <main className="relative overflow-hidden bg-[#05070C] text-white">
        {/* ════════════════════════════════════════════════════════ */}
        {/* HERO                                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-[90dvh] items-center overflow-hidden px-4 pb-16 pt-24 sm:pt-28 border-b border-white/[0.05]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(180,255,0,0.12),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_85%_85%,rgba(31,182,255,0.08),transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "84px 84px",
              }}
            />
            <div className="breathe absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-[#B4FF00]/[0.06] blur-[120px]" />
            <div
              className="breathe absolute -right-40 bottom-1/4 h-[520px] w-[520px] rounded-full bg-[#1FB6FF]/[0.06] blur-[140px]"
              style={{ animationDelay: "2s" }}
            />
            <div className="light-stream absolute left-0 top-1/4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
            <ScrollReveal variant="blur">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/[0.06] px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#B4FF00] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B4FF00]" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]">
                  Cohort 1 Graduation Event
                </span>
              </div>
            </ScrollReveal>

            <h1 className="display-mega font-editorial mx-auto mt-8 max-w-5xl text-[12vw] leading-[0.9] sm:text-[9vw] lg:text-[7.5rem]">
              <span className="word-rise"><span style={{ animationDelay: "0.05s" }}>A 24-Hour Creator Retreat.</span></span>
              <br />
              <span className="word-rise"><span className="text-gradient" style={{ animationDelay: "0.18s" }}>Your Next Viral Ad Campaign.</span></span>
            </h1>

            <ScrollReveal variant="up" delay={300}>
              <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
                6 trained creators from the <Link href="/creator-fellowship/cohort-1" className="text-[#B4FF00] hover:underline transition-all">Ambixous Fellowship</Link> locking in at the luxury <strong className="text-white font-medium">Beri Farm, Manesar</strong>.
                Seamless brand integration through fun, engaging activities and raw video assets.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={400}>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row text-sm font-medium tracking-wide">
                <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2 backdrop-blur-md text-white/70">
                  <Calendar className="h-4 w-4 text-[#B4FF00]" />
                  July 18 - 19, 2026
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2 backdrop-blur-md text-white/70">
                  <MapPin className="h-4 w-4 text-[#1FB6FF]" />
                  Beri Farm, Manesar
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={500}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Magnetic strength={0.32}>
                  <Link
                    href="#packages"
                    className="btn-shine group inline-flex items-center gap-2.5 rounded-full bg-[#B4FF00] px-8 py-4 text-sm font-bold text-[#05070C] transition-all hover:shadow-[0_0_40px_rgba(180,255,0,0.4)]"
                  >
                    <span>View Packages</span>
                    <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  </Link>
                </Magnetic>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* THE FORMAT                                               */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="format" className="relative px-4 py-20 sm:py-24">
          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="01" label="The Format" accent="#B4FF00" center />
            </ScrollReveal>
            
            <ScrollReveal variant="up" delay={120}>
              <div className="text-center mb-16">
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  The Video Content Engine
                </h2>
                <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">
                  No staged photoshoots. Just organic activities, real reactions, and high-converting UGC.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-3">
              {formatPillars.map((pillar, i) => (
                <ScrollReveal key={pillar.number} variant="up" delay={i * 120}>
                  <TiltCard className="h-full" max={5}>
                    <div
                      className="gallery-card spotlight glow-ring group relative h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.15]"
                      style={{
                        ["--from" as string]: pillar.from,
                        ["--to" as string]: pillar.to,
                      }}
                    >
                      <div className="relative z-[2] flex h-full flex-col">
                        <div className="mb-8">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all duration-500 group-hover:scale-110"
                            style={{
                              boxShadow: `inset 0 0 0 1px ${pillar.from}20`,
                            }}
                          >
                            <pillar.icon
                              className="h-6 w-6 transition-colors duration-500"
                              style={{ color: pillar.from }}
                            />
                          </div>
                        </div>

                        <div className="mt-auto">
                          <h3 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-white">
                            {pillar.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-white/60">{pillar.description}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* THE VENUE                                                */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative px-4 py-20 sm:py-24 bg-[#010409]">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(180,255,0,0.03),transparent_70%)]" />

          <div className="relative mx-auto max-w-5xl text-center">
            <ScrollReveal variant="blur">
              <SectionLabel num="02" label="The Venue" accent="#FF6978" center />
            </ScrollReveal>

            <ScrollReveal variant="up" delay={120}>
              <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl mb-4">
                Beri Farm, Manesar
              </h2>
              <p className="text-lg text-white/50 mb-12">
                A luxury backdrop curated for high-performing lifestyle ad content.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="scale" delay={200}>
              <div className="relative mx-auto max-w-4xl rounded-[2rem] p-[2px] bg-gradient-to-br from-[#B4FF00]/40 via-white/5 to-[#1FB6FF]/40 shadow-[0_0_60px_rgba(180,255,0,0.15)] overflow-hidden group">
                <div className="aspect-video w-full rounded-[1.8rem] overflow-hidden bg-black relative">
                  <iframe
                    className="absolute inset-0 w-full h-full opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                    src="https://www.youtube.com/embed/hb0rc-EvFRM?si=BGzFPatxMEgdpZ-i"
                    title="Beri Farm, Manesar"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* THE CREATORS                                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="03" label="The Cast" accent="#1FB6FF" />
            </ScrollReveal>

            <div className="mb-12 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Six Creators.
                  <br />
                  <span className="text-gradient">Endless Variations.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={240}>
                <p className="max-w-md text-base leading-relaxed text-white/50 sm:text-lg">
                  Hand-selected from our rigorous Fellowship, trained in producing content that converts, covering niches across tech, lifestyle, and storytelling.
                </p>
              </ScrollReveal>
            </div>


          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* PRICING                                                  */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="packages" className="relative px-4 py-20 sm:py-32 bg-[#010409]">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(180,255,0,0.04),transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <ScrollReveal variant="blur">
                <SectionLabel num="04" label="Integration Packages" accent="#B4FF00" center />
              </ScrollReveal>
              
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Choose Your Integration
                </h2>
                <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">
                  Agencies charge ₹1.5 Lakh+ for this setup. Pick a package that fits your ad budget.
                </p>
              </ScrollReveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
              {pricingTiers.map((tier, i) => (
                <ScrollReveal key={tier.name} variant="up" delay={i * 100} className="flex h-full">
                  <div
                    className={`relative w-full flex flex-col rounded-[2.5rem] border ${
                      tier.popular
                        ? "border-[#B4FF00]/50 bg-gradient-to-b from-[#B4FF00]/[0.08] to-[#010409] shadow-[0_0_40px_rgba(180,255,0,0.15)] md:-translate-y-4"
                        : "border-white/[0.08] bg-white/[0.02]"
                    } p-8 sm:p-10 backdrop-blur-md transition-all duration-500 hover:border-[var(--tier-accent)]`}
                    style={{ "--tier-accent": `${tier.accent}66` } as CSSProperties}
                  >
                    {tier.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#B4FF00] text-[#05070C] px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(180,255,0,0.4)]">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: tier.popular ? tier.accent : "rgba(255,255,255,0.9)" }}>
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-editorial font-bold text-white tracking-tight">{tier.price}</span>
                      </div>
                      <p className="text-sm font-medium uppercase tracking-widest mt-3 text-white/40">
                        {tier.subtitle}
                      </p>
                    </div>

                    <div className="h-px w-full bg-white/[0.06] mb-8" />

                    <ul className="space-y-5 flex-grow">
                      {tier.features.map((feature) => {
                        return (
                          <li key={feature.bold} className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              {tier.name === "Title Sponsor" ? (
                                <Star className="h-4 w-4" style={{ color: tier.accent }} fill={tier.accent} />
                              ) : (
                                <Check className="h-4 w-4" style={{ color: tier.accent }} />
                              )}
                            </div>
                            <span className="text-sm leading-relaxed text-white/70">
                              <strong className="text-white font-semibold">{feature.bold}</strong>
                              <br />
                              <span className="text-white/50">{feature.text.replace(feature.bold, '').replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '')}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* CONTACT & CTA                                            */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative px-4 py-20 sm:py-32 overflow-hidden">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#B4FF00]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-[#1FB6FF]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-5xl text-center">
            <ScrollReveal variant="blur">
              <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl text-white mb-6">
                Lock In Your Brand's Spot
              </h2>
              <p className="text-lg text-white/60 mb-16 max-w-2xl mx-auto">
                We are strictly capping this to <strong className="text-white">non-competing brands</strong> to ensure maximum share of voice. Call us directly to confirm category availability.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {contactCards.map((contact, i) => {
                const ContactIcon = contact.icon

                return (
                  <ScrollReveal key={contact.name} variant="up" delay={100 + i * 100}>
                    <div
                      className="spotlight glow-ring group relative flex h-full flex-col items-center overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-[var(--contact-accent)] sm:p-8"
                      style={{ "--contact-accent": `${contact.accent}80` } as CSSProperties}
                    >
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] shadow-inner transition-transform duration-500 group-hover:scale-110">
                        <ContactIcon className="h-7 w-7" style={{ color: contact.accent }} />
                      </div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                        {contact.label}
                      </p>
                      <p className="mb-8 text-2xl font-bold text-white">{contact.name}</p>

                      <div className="relative z-10 mt-auto flex w-full flex-col gap-3">
                        <a
                          href={contact.phoneHref}
                          aria-label={`Call ${contact.name}`}
                          className="btn-shine group/btn relative inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.15] bg-white/[0.05] py-4 text-base font-bold text-white transition-all hover:border-[var(--contact-accent)] hover:bg-white/[0.08] sm:text-lg"
                        >
                          <Phone className="h-5 w-5" style={{ color: contact.accent }} />
                          Call Now
                        </a>
                        <a
                          href={contact.whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Message ${contact.name} on WhatsApp`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-sm font-bold text-[#DFFFEA] transition-all hover:border-[#25D366] hover:bg-[#25D366] hover:text-[#05070C]"
                        >
                          <MessageCircle className="h-5 w-5" />
                          Chat on WA
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>

          <div className="relative mx-auto mt-24 max-w-6xl border-t border-white/[0.05] pt-10 px-4">
            <div className="grid gap-8 sm:grid-cols-3 sm:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
                  Ambixous Innovations LLP
                </p>
                <p className="mt-2 text-xs text-white/30">
                  Building India's creator-entrepreneur category.
                </p>
              </div>
              <div className="flex justify-center sm:justify-center">
                <Logo size="md" href="/" />
              </div>
              <div className="text-left text-[10px] uppercase tracking-[0.32em] text-white/25 sm:text-right">
                Creator Retreat 2026
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

/* ─────────────── HELPER UI ─────────────── */

function SectionLabel({
  num,
  label,
  accent,
  center,
}: {
  num: string
  label: string
  accent: string
  center?: boolean
}) {
  return (
    <div
      className={`mb-8 flex items-center gap-3 ${center ? "justify-center" : ""}`}
    >
      <span
        className="h-px w-12 sm:w-16"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}99)` }}
      />
      <span
        className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em]"
        style={{ color: accent }}
      >
        {num} · {label}
      </span>
      <span
        className="h-px w-12 sm:w-16"
        style={{ background: `linear-gradient(90deg, ${accent}99, transparent)` }}
      />
    </div>
  )
}
