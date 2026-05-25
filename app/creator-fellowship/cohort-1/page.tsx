import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Linkedin,
  Instagram,
  Youtube,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Target,
  Users,
  GraduationCap,
  Sparkles,
  Zap,
  Palette,
  Video,
  Rocket,
  Globe,
  Heart,
  Calendar,
  Briefcase,
  Trophy,
  FileText,
  BarChart,
  TrendingUp,
  Layers,
  Network,
  Film,
} from "lucide-react"
import FAQSection from "./FAQSection"
import { ScrollReveal } from "./ScrollReveal"
import AmbientCursor from "./AmbientCursor"
import ScrollProgress from "./ScrollProgress"
import Magnetic from "./Magnetic"
import TiltCard from "./TiltCard"
import CinematicTimeline from "./CinematicTimeline"
import { Logo } from "@/components/logo"

/* ─────────────── METADATA ─────────────── */

export const metadata: Metadata = {
  title: "Creator Fellowship Cohort 01 | Ambixous",
  description:
    "A 13-week, cohort-based fellowship turning India's creators into creator-entrepreneurs. 12 fellows, 6 live projects, real brand briefs, and jury evaluations. March 29 – June 27, 2026.",
  openGraph: {
    title: "Ambixous Creator Fellowship, Cohort 01",
    description:
      "Building India's Next Generation of Creator-Entrepreneurs. 13 weeks · 12 fellows · 6 live projects · Real brand briefs.",
    url: "https://www.ambixous.in/creator-fellowship/cohort-1",
    siteName: "Ambixous",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous Creator Fellowship, Cohort 01",
    description:
      "Building India's Next Generation of Creator-Entrepreneurs.",
  },
  alternates: {
    canonical: "https://www.ambixous.in/creator-fellowship/cohort-1",
  },
}

/* ─────────────── DATA ─────────────── */

const fellows = [
  {
    name: "Abhay Mishra",
    niche: "Storyteller",
    image: "/creatorcohort/fellows/abhay.png",
    linkedin: "https://www.linkedin.com/in/abhay-mishra-04a442315",
    youtube: "https://m.youtube.com/%40bravey2007",
  },
  {
    name: "Jiya Tomar",
    niche: "MedTech",
    image: "/creatorcohort/fellows/jiya.png",
    linkedin: "https://www.linkedin.com/in/jiya-tomar-538b21235",
    instagram: "https://www.instagram.com/techtea_withjiya",
  },
  {
    name: "Kavisha Mathur",
    niche: "Tech",
    image: "/creatorcohort/fellows/kavisha.png",
    linkedin: "https://www.linkedin.com/in/kavisha-mathur/",
    instagram: "https://www.instagram.com/chao.tech_/",
  },
  {
    name: "Krishna N Mehta",
    niche: "Tech",
    image: "/creatorcohort/fellows/krishnamehta.png",
    linkedin: "https://www.linkedin.com/in/krishna-n-mehta",
    instagram: "https://www.instagram.com/unscripted.tech/",
  },
  {
    name: "Krishna Sharma",
    niche: "Motivational",
    image: "/creatorcohort/fellows/krishnasharma.png",
    linkedin: "https://www.linkedin.com/in/krishna-sharma-387781258",
    instagram: "https://www.instagram.com/eminencexk",
  },
  {
    name: "Lavanya Dua",
    niche: "Lifestyle",
    image: "/creatorcohort/fellows/lavanya.png",
    linkedin: "https://www.linkedin.com/in/lavanyaduadesign/",
    instagram: "https://www.instagram.com/lavanya.duaa",
  },
  {
    name: "Prashasti Agarwal",
    niche: "Tech",
    image: "/creatorcohort/fellows/prashashti.png",
    linkedin: "https://www.linkedin.com/in/agarwalprashasti",
  },
  {
    name: "Shrishti Vaish",
    niche: "Tech",
    image: "/creatorcohort/fellows/shristi.png",
    linkedin: "https://www.linkedin.com/in/shrishti-vaish",
    instagram: "https://www.instagram.com/datanshrish",
  },
  {
    name: "Siya Choudhary",
    niche: "Lifestyle",
    image: "/creatorcohort/fellows/siya.png",
    linkedin: "https://www.linkedin.com/in/choudhary-siya/",
    instagram: "https://www.instagram.com/soyasauce_121",
  },
  {
    name: "Srujal Pawar",
    niche: "Marketing",
    image: "/creatorcohort/fellows/srujal.png",
    linkedin: "https://www.linkedin.com/in/srujalpawar/",
  },
  {
    name: "Surya Gupta",
    niche: "Tech",
    image: "/creatorcohort/fellows/surya.png",
    linkedin: "https://www.linkedin.com/in/surya-gupta-ai",
    instagram: "https://www.instagram.com/suryaweb3",
  },
  {
    name: "Vedansh Chugh",
    niche: "Tech",
    image: "/creatorcohort/fellows/vedansh.png",
    linkedin: "https://www.linkedin.com/in/vedanshchugh2003",
    instagram: "https://www.instagram.com/_its.vedansh",
  },
]

const mentors = [
  {
    name: "Abhishek Dubey",
    designation: "Senior UX Consultant, IIT Delhi",
    domain: "Graphics",
    image: "/creatorcohort/mentors/abhishek.png",
    linkedin: "https://www.linkedin.com/in/uxporte/",
  },
  {
    name: "Anand Gangadharan",
    designation: "Manager, Data Products, American Express",
    domain: "Fintech Product",
    image: "/creatorcohort/mentors/anand.png",
    linkedin: "https://www.linkedin.com/in/anand-gangadharan/",
  },
  {
    name: "Ayushi Somani",
    designation: "Founder, WildGo Media · 50M+ LinkedIn Impressions",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/ayushi.png",
    linkedin: "https://www.linkedin.com/in/ayushi-somani-%F0%9F%92%99-46a41811a/",
  },
  {
    name: "Hitesh Lakhyani",
    designation: "Sr. Design Manager - Smartsheet, Former Design Leader - Tata 1MG",
    domain: "Health",
    image: "/creatorcohort/mentors/hitesh.png",
    linkedin: "https://www.linkedin.com/in/hitesh-lakhyani-468b8a18/",
  },
  {
    name: "Mohina Chadha",
    designation: "Group Product Manager, Times Internet",
    domain: "Fintech Product",
    image: "/creatorcohort/mentors/mohina.png",
    linkedin: "https://www.linkedin.com/in/mohinachadha/",
  },
  {
    name: "Priyanka Goel",
    designation: "CoFounder & Chief Marketing Head, Go Grub",
    domain: "F&B Product",
    image: "/creatorcohort/mentors/priyanka.png",
    linkedin: "https://www.linkedin.com/in/priyankagoel13/",
  },
  {
    name: "Sarvistha",
    designation: "Director of Product Design, Rebel Foods",
    domain: "F&B Product",
    image: "/creatorcohort/mentors/sarvistha.png",
    linkedin: "https://www.linkedin.com/in/sarvistha/",
  },
  {
    name: "Sayantan Dasgupta",
    designation: "Sr. Director Marketing, Think Power Solutions",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/sayantan.png",
    linkedin: "https://www.linkedin.com/in/sayantandasguptaofficial/",
  },
  {
    name: "Snehlata Singh",
    designation: "LinkedIn Ghostwriter for Coaches & Early Founders",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/snehlata.png",
    linkedin: "https://www.linkedin.com/in/snehlata-singh/",
  },
  {
    name: "Varedh Nigam",
    designation: "Associate Director, UX Design, Nagarro",
    domain: "Graphics",
    image: "/creatorcohort/mentors/varedh.png",
    linkedin: "https://www.linkedin.com/in/varedhnigam/",
  },
  {
    name: "Yug Sarin",
    designation: "Principal Product Designer, MRSOOL · Ex-Airtel, Bytedance",
    domain: "Video",
    image: "/creatorcohort/mentors/yug.png",
    linkedin: "https://www.linkedin.com/in/yugsarin/",
  },
]

const projects = [
  {
    number: 1,
    title: "Personal Branding",
    focus: "Define your positioning, narrative, and brand architecture",
    icon: Sparkles,
    from: "#FFB347",
    to: "#FF6978",
  },
  {
    number: 2,
    title: "Design: Graphics",
    focus: "Visual identity creation and graphic storytelling",
    icon: Palette,
    from: "#F472B6",
    to: "#A855F7",
  },
  {
    number: 3,
    title: "Design: Video",
    focus: "Short-form video production, editing, and platform optimisation",
    icon: Video,
    from: "#A78BFA",
    to: "#7C3AED",
  },
  {
    number: 4,
    title: "Product Launch: FinTech",
    focus: "Real brand brief, content strategy for a FinTech product launch",
    icon: Rocket,
    from: "#38BDF8",
    to: "#1FB6FF",
  },
  {
    number: 5,
    title: "Product Launch: F&B",
    focus: "Real brand brief, content strategy for a Food & Beverage brand",
    icon: Globe,
    from: "#34D399",
    to: "#10B981",
  },
  {
    number: 6,
    title: "Product Launch: Health",
    focus: "Real brand brief, content strategy for a Health brand",
    icon: Heart,
    from: "#FB7185",
    to: "#E11D48",
  },
]

const timeline = [
  { date: "29 Mar", agenda: "Orientation Session", journey: "START", isMilestone: true },
  { date: "4 Apr", agenda: "Personal Branding Mentorship", journey: "PROJECT 1", isMilestone: true },
  { date: "11 Apr", agenda: "Personal Branding Jury Round", journey: "", isMilestone: false },
  { date: "18 Apr", agenda: "Design Mentorship (Graphics)", journey: "PROJECT 2", isMilestone: true },
  { date: "25 Apr", agenda: "Design Jury (Graphics)", journey: "", isMilestone: false },
  { date: "2 May", agenda: "Design Mentorship (Video)", journey: "PROJECT 3", isMilestone: true },
  { date: "9 May", agenda: "Design Jury (Video)", journey: "", isMilestone: false },
  { date: "16 May", agenda: "Product Launch Mentorship (FinTech)", journey: "PROJECT 4", isMilestone: true },
  { date: "23 May", agenda: "Product Launch Jury (FinTech)", journey: "", isMilestone: false },
  { date: "30 May", agenda: "Product Launch Mentorship (F&B)", journey: "PROJECT 5", isMilestone: true },
  { date: "6 Jun", agenda: "Product Launch Jury (F&B)", journey: "", isMilestone: false },
  { date: "13 Jun", agenda: "Product Launch Mentorship (Health)", journey: "PROJECT 6", isMilestone: true },
  { date: "20 Jun", agenda: "Product Launch Jury (Health)", journey: "", isMilestone: false },
  { date: "21 Jun", agenda: "Creator Digital Toolkit Mentorship", journey: "EXPLORE", isMilestone: true },
  { date: "27 Jun", agenda: "Founder × Creator MeetUp", journey: "GRADUATION", isMilestone: true },
]

const nicheColor: Record<string, string> = {
  Lifestyle: "bg-pink-500/15 text-pink-300 border border-pink-500/25",
  Tech: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
  Gaming: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
  Marketing: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  Motivational: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  MedTech: "bg-teal-500/15 text-teal-300 border border-teal-500/25",
}

const domainColor: Record<string, string> = {
  "Personal Branding": "bg-[#B4FF00]/10 text-[#B4FF00] border border-[#B4FF00]/25",
  Video: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
  Graphics: "bg-teal-500/15 text-teal-300 border border-teal-500/25",
  "Fintech Product": "bg-sky-500/15 text-sky-300 border border-sky-500/25",
  "F&B Product": "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  Health: "bg-rose-500/15 text-rose-300 border border-rose-500/25",
}

/* ─────────────── PAGE COMPONENT ─────────────── */

export default function CreatorFellowshipCohort1() {
  return (
    <>
      <ScrollProgress />
      <AmbientCursor />

      <main className="relative overflow-hidden bg-[#05070C] text-white">
        {/* ════════════════════════════════════════════════════════ */}
        {/* HERO — monumental opening frame                          */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pb-16 pt-24 sm:pt-28">
          {/* Atmospheric backdrop */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(180,255,0,0.10),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_85%_85%,rgba(31,182,255,0.07),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_15%_60%,rgba(255,120,200,0.04),transparent_60%)]" />
            {/* Editorial grid */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "84px 84px",
              }}
            />
            {/* Floating ambient orbs */}
            <div className="breathe absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-[#B4FF00]/[0.05] blur-[120px]" />
            <div
              className="breathe absolute -right-40 bottom-1/4 h-[520px] w-[520px] rounded-full bg-[#1FB6FF]/[0.05] blur-[140px]"
              style={{ animationDelay: "2s" }}
            />
            {/* Cinematic light streams */}
            <div className="light-stream absolute left-0 top-1/4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div
              className="light-stream absolute left-0 top-3/4 h-px w-full bg-gradient-to-r from-transparent via-[#B4FF00]/30 to-transparent"
              style={{ animationDelay: "4s" }}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
            <ScrollReveal variant="blur">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/[0.06] px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#B4FF00] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B4FF00]" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]">
                  Cohort 01 · Live Now
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="blur" delay={120}>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.5em] text-white/40 sm:text-xs">
                Ambixous — Creator Studio Initiative
              </p>
            </ScrollReveal>

            {/* Monumental headline */}
            <h1 className="display-mega font-editorial mx-auto mt-6 max-w-5xl text-[14vw] leading-[0.9] sm:text-[10vw] lg:text-[8.5rem]">
              <span className="word-rise"><span style={{ animationDelay: "0.05s" }}>Creator</span></span>
              <br />
              <span className="word-rise"><span className="text-gradient" style={{ animationDelay: "0.18s" }}>Fellowship.</span></span>
            </h1>

            <ScrollReveal variant="up" delay={300}>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                A 13-week cohort engineered to forge India&apos;s next generation of
                creator-entrepreneurs. Real briefs, industry juries, and a studio-grade
                environment built for ambition.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={400}>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.32em] text-white/35">
                Mar 29 — Jun 27, 2026 · Ambixous Innovations LLP
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={500}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic strength={0.32}>
                  <Link
                    href="#ethos"
                    className="btn-shine group inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#05070C] transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"
                  >
                    <span>Explore the cohort</span>
                    <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                  </Link>
                </Magnetic>
                <Magnetic strength={0.25}>
                  <Link
                    href="#fellows"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/85 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    Meet the fellows
                  </Link>
                </Magnetic>
              </div>
            </ScrollReveal>

            {/* Specs strip */}
            <ScrollReveal variant="up" delay={620}>
              <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md sm:grid-cols-4">
                {[
                  { value: "12", label: "Fellows", icon: Users },
                  { value: "13", label: "Weeks", icon: Calendar },
                  { value: "6", label: "Projects", icon: Briefcase },
                  { value: "3", label: "Brand Briefs", icon: Trophy },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="spotlight group relative bg-[#05070C]/80 px-6 py-7 transition-colors hover:bg-white/[0.02]"
                  >
                    <stat.icon className="mx-auto mb-3 h-4 w-4 text-white/25 transition-colors group-hover:text-[#B4FF00]" />
                    <div className="editorial-number text-4xl text-white sm:text-5xl">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.32em] text-white/35">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* ETHOS / PROBLEM                                          */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="ethos" className="relative px-4 py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgba(255,120,200,0.04),transparent_60%)]" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="01" label="The Ethos" accent="#FF6978" />
            </ScrollReveal>

            <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  India has creators.{" "}
                  <span className="text-white/30">It lacks creator-entrepreneurs.</span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="up" delay={240}>
                <p className="max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                  India&apos;s digital creator economy is growing rapidly — yet most
                  creators <span className="font-medium text-white/80">plateau early</span>,
                  posting consistently without translating audience into a sustainable
                  career.
                </p>
              </ScrollReveal>
            </div>

            <div className="cine-divider my-16" />

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: "No Structured Skill Infrastructure",
                  description:
                    "There is no credentialed, project-based pathway to help early-stage creators build across writing, graphics, video, and digital product creation simultaneously.",
                },
                {
                  icon: Target,
                  title: "No Access to Real Briefs",
                  description:
                    "Creators develop skills in isolation, never tested against the expectations of real brands or evaluated by industry professionals.",
                },
                {
                  icon: Users,
                  title: "No Peer Accountability",
                  description:
                    "Creator growth is a solo pursuit. The absence of structured cohort environments means most creators burn out before they build a sustainable brand.",
                },
              ].map((item, i) => (
                <ScrollReveal key={item.title} variant="up" delay={i * 140}>
                  <TiltCard className="h-full" max={4}>
                    <div className="spotlight glow-ring group relative h-full overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.03] sm:p-8">
                      <div className="relative z-[2]">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-all group-hover:border-[#B4FF00]/30 group-hover:bg-[#B4FF00]/[0.08]">
                            <item.icon className="h-5 w-5 text-white/40 transition-colors group-hover:text-[#B4FF00]" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/15">
                            0{i + 1}
                          </span>
                        </div>
                        <h3 className="mb-3 text-lg font-semibold text-white">{item.title}</h3>
                        <p className="text-sm leading-relaxed text-white/45">{item.description}</p>
                      </div>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* METHOD / SOLUTION                                        */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="method" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,rgba(31,182,255,0.05),transparent_60%)]" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="02" label="The Method" accent="#1FB6FF" />
            </ScrollReveal>

            <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-20">
              <div className="lg:sticky lg:top-24">
                <ScrollReveal variant="up" delay={120}>
                  <h2 className="font-editorial mb-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                    A fellowship that turns{" "}
                    <span className="text-gradient">creators into brands.</span>
                  </h2>
                </ScrollReveal>
                <ScrollReveal variant="up" delay={240}>
                  <p className="max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                    13 weeks. Six live projects. Mentorship from senior industry leaders.
                    Independent jury rounds that mirror the rigour of a top-tier business
                    school — applied entirely to the creator economy.
                  </p>
                </ScrollReveal>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "01",
                    title: "Mentorship Session",
                    description:
                      "A domain expert introduces the brief and teaches the methodology. Fellows receive structured frameworks before execution.",
                    accent: "#B4FF00",
                  },
                  {
                    step: "02",
                    title: "Live Project",
                    description:
                      "Fellows execute against the brief independently. Cross-domain teams create productive friction — the best ideas emerge from diverse perspectives.",
                    accent: "#1FB6FF",
                  },
                  {
                    step: "03",
                    title: "Jury Evaluation",
                    description:
                      "An independent jury evaluates work against measurable criteria. Real feedback from industry professionals shapes every iteration.",
                    accent: "#FF6978",
                  },
                ].map((item, i) => (
                  <ScrollReveal key={item.step} variant="up" delay={i * 140}>
                    <div
                      className="spotlight group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-sm transition-all hover:border-white/[0.14] hover:bg-white/[0.04] sm:p-9"
                      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
                        <div
                          className="editorial-number text-5xl sm:text-7xl"
                          style={{ color: item.accent, opacity: 0.85 }}
                        >
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <div
                            className="mb-3 inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.28em]"
                            style={{
                              color: item.accent,
                              borderColor: `${item.accent}40`,
                              backgroundColor: `${item.accent}10`,
                            }}
                          >
                            Phase 0{i + 1}
                          </div>
                          <h3 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {item.title}
                          </h3>
                          <p className="max-w-xl text-sm leading-relaxed text-white/50 sm:text-base">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* CURRICULUM — gallery installations                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="curriculum" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="03" label="The Curriculum" accent="#B4FF00" />
            </ScrollReveal>

            <div className="mb-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  Six installations.
                  <br />
                  <span className="text-white/40">One body of work.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={240}>
                <p className="max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                  Each project is a curated gallery installation — concept, execution,
                  critique. Skills compound from personal branding into product launches
                  on real briefs.
                </p>
              </ScrollReveal>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <ScrollReveal key={project.number} variant="up" delay={i * 90}>
                  <TiltCard className="h-full" max={5}>
                    <div
                      className="gallery-card spotlight glow-ring group relative h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.14]"
                      style={{
                        ["--from" as string]: project.from,
                        ["--to" as string]: project.to,
                      }}
                    >
                      {/* Top gradient bar */}
                      <div
                        className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${project.from}, ${project.to}, transparent)`,
                        }}
                      />

                      <div className="relative z-[2] flex h-full flex-col">
                        <div className="mb-10 flex items-start justify-between">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all group-hover:scale-105"
                            style={{
                              boxShadow: `inset 0 0 0 1px ${project.from}15`,
                            }}
                          >
                            <project.icon
                              className="h-5 w-5 text-white/40 transition-colors group-hover:text-white/80"
                            />
                          </div>
                          <span
                            className="editorial-number text-5xl opacity-20 transition-all group-hover:opacity-50 sm:text-6xl"
                            style={{ color: project.from }}
                          >
                            0{project.number}
                          </span>
                        </div>

                        <div className="mt-auto">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/35">
                            Project {project.number}
                          </p>
                          <h3 className="mb-3 text-2xl font-semibold leading-tight tracking-tight text-white">
                            {project.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-white/50">{project.focus}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal variant="up" delay={300}>
              <div className="mt-10 overflow-hidden rounded-3xl border border-[#B4FF00]/15 bg-gradient-to-r from-[#B4FF00]/[0.05] via-transparent to-[#1FB6FF]/[0.05] p-8 backdrop-blur-md">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[#B4FF00]/30 blur-xl" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B4FF00]/30 bg-[#B4FF00]/10">
                        <GraduationCap className="h-6 w-6 text-[#B4FF00]" />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]/80">
                        Grand Finale
                      </p>
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">
                        Founder × Creator Demo Day · June 27, 2026
                      </h3>
                      <p className="mt-1 text-sm text-white/45">
                        Offline. Fellows present to founders, mentors, jury, sponsors and media.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="#finale"
                    className="draw-line inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#B4FF00]"
                  >
                    See the finale
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* TIMELINE                                                 */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="timeline" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_20%,rgba(180,255,0,0.05),transparent_60%)]" />

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <ScrollReveal variant="blur">
                <SectionLabel num="04" label="The Journey" accent="#B4FF00" center />
              </ScrollReveal>

              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  13 weeks,
                  <br />
                  <span className="text-gradient">scored in 15 moments.</span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="up" delay={240}>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/45 sm:text-lg">
                  Mentorship · Execution · Jury — looped across six projects, with two
                  cinematic bookends.
                </p>
              </ScrollReveal>
            </div>

            <CinematicTimeline events={timeline} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* FELLOWS — editorial                                      */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="fellows" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(180,255,0,0.04),transparent_70%)]" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="05" label="The Fellows" accent="#B4FF00" />
            </ScrollReveal>

            <div className="mb-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  The class of
                  <br />
                  <span className="text-gradient">Cohort 01.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={240}>
                <p className="max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                  12 creators across six content niches — Lifestyle, Tech, Gaming,
                  Marketing, MedTech, and Motivational — united by ambition.
                </p>
              </ScrollReveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fellows.map((fellow, i) => (
                <ScrollReveal key={fellow.name} variant="up" delay={i * 60}>
                  <TiltCard className="h-full" max={4}>
                    <div className="spotlight glow-ring group relative h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] sm:p-7">
                      <div className="relative z-[2] flex items-start gap-5">
                        {/* Portrait */}
                        <div className="relative shrink-0">
                          <div className="absolute -inset-2 rounded-3xl bg-[#B4FF00]/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-500 group-hover:border-[#B4FF00]/40 sm:h-28 sm:w-28">
                            <Image
                              src={fellow.image}
                              alt={fellow.name}
                              width={128}
                              height={128}
                              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1.5 text-base font-semibold tracking-tight text-white sm:text-lg">
                            {fellow.name}
                          </h3>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              nicheColor[fellow.niche] || "bg-white/10 text-white/60"
                            }`}
                          >
                            {fellow.niche}
                          </span>

                          <div className="mt-4 flex gap-2">
                            <SocialLink href={fellow.linkedin} label={`${fellow.name} LinkedIn`} accent="#0A66C2">
                              <Linkedin className="h-3.5 w-3.5" />
                            </SocialLink>
                            {fellow.instagram && (
                              <SocialLink href={fellow.instagram} label={`${fellow.name} Instagram`} accent="#E4405F">
                                <Instagram className="h-3.5 w-3.5" />
                              </SocialLink>
                            )}
                            {fellow.youtube && (
                              <SocialLink href={fellow.youtube} label={`${fellow.name} YouTube`} accent="#FF0033">
                                <Youtube className="h-3.5 w-3.5" />
                              </SocialLink>
                            )}
                          </div>
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
        {/* MENTORS                                                  */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="mentors" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(31,182,255,0.04),transparent_70%)]" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="06" label="Mentors & Jury" accent="#1FB6FF" />
            </ScrollReveal>

            <div className="mb-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <ScrollReveal variant="up" delay={120}>
                <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  Senior leaders.
                  <br />
                  <span className="text-white/40">Real critique.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="up" delay={240}>
                <p className="max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                  Professionals from American Express, Times Internet, Nagarro, IIT Delhi,
                  MRSOOL, Smartsheet, and more — guiding every project.
                </p>
              </ScrollReveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor, i) => (
                <ScrollReveal key={mentor.name} variant="up" delay={i * 60}>
                  <TiltCard className="h-full" max={4}>
                    <div className="spotlight glow-ring group relative h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#1FB6FF]/25 sm:p-7">
                      <div className="relative z-[2] flex items-start gap-5">
                        <div className="relative shrink-0">
                          <div className="absolute -inset-2 rounded-3xl bg-[#1FB6FF]/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-500 group-hover:border-[#1FB6FF]/40 sm:h-28 sm:w-28">
                            <Image
                              src={mentor.image}
                              alt={mentor.name}
                              width={128}
                              height={128}
                              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                              {mentor.name}
                            </h3>
                            <a
                              href={mentor.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 transition-all hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                              aria-label={`${mentor.name} LinkedIn`}
                            >
                              <Linkedin className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="mb-3 text-xs leading-relaxed text-white/40 line-clamp-2">
                            {mentor.designation}
                          </p>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              domainColor[mentor.domain] || "bg-white/10 text-white/60"
                            }`}
                          >
                            {mentor.domain}
                          </span>
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
        {/* IMPACT                                                   */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="impact" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_50%,rgba(31,182,255,0.04),transparent_60%)]" />

          <div className="relative mx-auto max-w-6xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="07" label="Measurable Impact" accent="#B4FF00" />
            </ScrollReveal>

            <ScrollReveal variant="up" delay={120}>
              <h2 className="font-editorial mb-10 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                What fellows
                <br />
                <span className="text-white/40">leave with.</span>
              </h2>
            </ScrollReveal>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Fellows column */}
              <ScrollReveal variant="up">
                <div className="spotlight relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-8 backdrop-blur-md sm:p-10">
                  <div className="mb-8 flex items-center gap-4 border-b border-white/[0.06] pb-8">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[#B4FF00]/30 blur-xl" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B4FF00]/30 bg-[#B4FF00]/10">
                        <Briefcase className="h-5 w-5 text-[#B4FF00]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]/80">
                        For the Fellows
                      </p>
                      <h3 className="text-2xl font-bold tracking-tight text-white">Personal payoff</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { text: "6 jury-evaluated projects forming a professional creator portfolio", icon: FileText },
                      { text: "3 completed real brand briefs evaluated by stakeholders", icon: Target },
                      { text: "Credential: 'Ambixous Creator Fellow, Cohort 01'", icon: GraduationCap },
                      { text: "Cross-domain peer network across 6 content niches", icon: Network },
                      { text: "Direct mentor relationships built over 13 weeks of engagement", icon: Users },
                      { text: "Public recognition at the Founder × Creator Demo Day", icon: Trophy },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-all hover:border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B4FF00]/[0.08] transition-colors group-hover:bg-[#B4FF00]/15">
                          <item.icon className="h-4 w-4 text-[#B4FF00]/80" />
                        </div>
                        <p className="pt-1 text-sm font-medium leading-relaxed text-white/70 transition-colors group-hover:text-white/90">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Ecosystem column */}
              <ScrollReveal variant="up" delay={120}>
                <div className="spotlight relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-8 backdrop-blur-md sm:p-10">
                  <div className="mb-8 flex items-center gap-4 border-b border-white/[0.06] pb-8">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[#1FB6FF]/30 blur-xl" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1FB6FF]/30 bg-[#1FB6FF]/10">
                        <Globe className="h-5 w-5 text-[#1FB6FF]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#1FB6FF]/80">
                        For the Ecosystem
                      </p>
                      <h3 className="text-2xl font-bold tracking-tight text-white">Systemic shift</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { text: "Replicable model for structured creator education, demonstrated in India for the first time", icon: Layers },
                      { text: "Data on cohort learning outcomes: portfolio quality, brand readiness, audience growth", icon: BarChart },
                      { text: "Network of 12 benchmark creators across niches, documented as alumni", icon: TrendingUp },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-all hover:border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1FB6FF]/[0.08] transition-colors group-hover:bg-[#1FB6FF]/15">
                          <item.icon className="h-4 w-4 text-[#1FB6FF]/80" />
                        </div>
                        <p className="pt-1 text-sm font-medium leading-relaxed text-white/70 transition-colors group-hover:text-white/90">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8">
                    <div className="overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.07] via-orange-500/[0.03] to-transparent p-5">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15">
                          <Zap className="h-4 w-4 text-amber-300" />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/90">
                            First of its kind
                          </p>
                          <p className="text-sm leading-relaxed text-white/55">
                            India&apos;s first structured, cohort-based creator education program with
                            real brand briefs and jury evaluations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* FINALE — cinematic                                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="finale" className="relative overflow-hidden px-4 py-24 sm:py-28">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgba(180,255,0,0.08),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_15%_30%,rgba(255,200,120,0.05),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_85%_70%,rgba(31,182,255,0.05),transparent_70%)]" />
            <div className="light-stream absolute left-0 top-1/3 h-px w-full bg-gradient-to-r from-transparent via-[#B4FF00]/40 to-transparent" />
            <div
              className="light-stream absolute left-0 top-2/3 h-px w-full bg-gradient-to-r from-transparent via-[#1FB6FF]/30 to-transparent"
              style={{ animationDelay: "3s" }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <ScrollReveal variant="blur">
              <div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/[0.06] px-4 py-1.5 backdrop-blur-md">
                <Film className="h-3.5 w-3.5 text-[#B4FF00]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]">
                  Final Cut · June 27, 2026
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={120}>
              <h2 className="font-editorial text-5xl font-bold leading-[0.92] tracking-tight sm:text-7xl lg:text-[8rem]">
                Founder
                <br />
                <span className="text-white/30">×</span>
                <br />
                <span className="text-gradient">Creator.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={260}>
              <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                An offline demo day. Fellows present 13 weeks of work to founders,
                mentors, jury, sponsors and media. A closing frame designed to feel
                inevitable.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={380}>
              <div className="mx-auto mt-12 flex max-w-md flex-wrap items-center justify-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/40">
                {["Founders", "Mentors", "Jury", "Sponsors", "Media"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* FAQ                                                      */}
        {/* ════════════════════════════════════════════════════════ */}
        <section id="faq" className="relative px-4 py-20 sm:py-24">
          <div className="cine-divider absolute inset-x-0 top-0" />

          <div className="relative mx-auto max-w-3xl">
            <ScrollReveal variant="blur">
              <SectionLabel num="09" label="FAQ" accent="#B4FF00" center />
            </ScrollReveal>

            <ScrollReveal variant="up" delay={120}>
              <h2 className="font-editorial mb-4 mt-4 text-center text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Everything,
                <br />
                <span className="text-white/40">on the record.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={240}>
              <p className="mb-14 text-center text-base text-white/45 sm:text-lg">
                The complete dossier for the Creator Fellowship.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={300}>
              <FAQSection />
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════ */}
        {/* CTA — closing frame                                      */}
        {/* ════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:pt-24">
          <div className="cine-divider absolute inset-x-0 top-0" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_120%,rgba(180,255,0,0.10),transparent_60%)]" />
            <div className="breathe absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B4FF00]/[0.04] blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <ScrollReveal variant="blur">
              <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/[0.06] px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#B4FF00] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#B4FF00]" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B4FF00]">
                  Cohort 01 is live
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={120}>
              <h2 className="font-editorial text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                The future of
                <br />
                creator education
                <br />
                <span className="text-gradient">starts here.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={260}>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/45 sm:text-lg">
                Applications for Cohort 02 will be announced soon.
                <br className="hidden sm:block" />
                Follow Ambixous to stay updated.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={380}>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Magnetic strength={0.35}>
                  <Link
                    href="/"
                    className="btn-shine group inline-flex items-center gap-3 rounded-full border border-[#B4FF00]/30 bg-[#B4FF00]/[0.10] px-7 py-3.5 text-sm font-semibold text-[#B4FF00] backdrop-blur-md transition-all hover:border-[#B4FF00]/60 hover:bg-[#B4FF00]/[0.18] hover:shadow-[0_0_50px_rgba(180,255,0,0.25)]"
                  >
                    Explore Ambixous
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Magnetic>

                <Magnetic strength={0.25}>
                  <a
                    href="https://www.linkedin.com/company/ambixous/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.10] bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/70 backdrop-blur-md transition-all hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white"
                  >
                    <Linkedin className="h-4 w-4" />
                    Follow on LinkedIn
                  </a>
                </Magnetic>
              </div>
            </ScrollReveal>
          </div>

          {/* Footer end-frame */}
          <div className="relative mx-auto mt-20 max-w-6xl border-t border-white/[0.05] pt-10">
            <div className="grid gap-8 sm:grid-cols-3 sm:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
                  Ambixous Innovations LLP
                </p>
                <p className="mt-2 text-xs text-white/30">
                  Building India&apos;s creator-entrepreneur category.
                </p>
              </div>
              <div className="flex justify-center">
                <Logo size="md" href="/" />
              </div>
              <div className="text-left text-xs uppercase tracking-[0.32em] text-white/25 sm:text-right">
                Mar — Jun 2026
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.32em] text-white/20">
              <span>© 2026 Ambixous · All rights reserved</span>
              <span>ambixous.in</span>
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
      className={`mb-6 flex items-center gap-3 ${center ? "justify-center" : ""}`}
    >
      <span
        className="h-px w-12"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}99)` }}
      />
      <span
        className="text-[10px] font-bold uppercase tracking-[0.4em]"
        style={{ color: accent }}
      >
        {num} · {label}
      </span>
      <span
        className="h-px w-12"
        style={{ background: `linear-gradient(90deg, ${accent}99, transparent)` }}
      />
    </div>
  )
}

function SocialLink({
  href,
  label,
  accent,
  children,
}: {
  href: string
  label: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group/social relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/35 transition-all hover:scale-110 hover:text-white"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover/social:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${accent}30, transparent)`,
          boxShadow: `inset 0 0 0 1px ${accent}60`,
        }}
        aria-hidden="true"
      />
      <span className="relative">{children}</span>
    </a>
  )
}
