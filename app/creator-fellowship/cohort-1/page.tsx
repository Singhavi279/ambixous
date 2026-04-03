import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Linkedin,
  Instagram,
  Youtube,
  Check,
  ArrowDown,
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
  ExternalLink,
} from "lucide-react"
import FAQSection from "./FAQSection"
import { ScrollReveal } from "./ScrollReveal"

/* ─────────────── METADATA ─────────────── */

export const metadata: Metadata = {
  title: "Creator Fellowship Cohort 01 | Ambixous",
  description:
    "A 13-week, cohort-based fellowship turning India's creators into creator-entrepreneurs. 9 fellows, 6 live projects, real brand briefs, and jury evaluations. March 29 – June 27, 2026.",
  openGraph: {
    title: "Ambixous Creator Fellowship — Cohort 01",
    description:
      "Building India's Next Generation of Creator-Entrepreneurs. 13 weeks · 9 fellows · 6 live projects · Real brand briefs.",
    url: "https://www.ambixous.in/creator-fellowship/cohort-1",
    siteName: "Ambixous",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambixous Creator Fellowship — Cohort 01",
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
    name: "Siya Choudhary",
    niche: "Lifestyle",
    image: "/creatorcohort/fellows/siya.png",
    linkedin: "https://www.linkedin.com/in/choudhary-siya/",
    instagram: "https://www.instagram.com/soyasauce_121",
  },
  {
    name: "Krishna N Mehta",
    niche: "Tech",
    image: "/creatorcohort/fellows/krishnamehta.png",
    linkedin: "https://www.linkedin.com/in/krishna-n-mehta",
    instagram: "https://www.instagram.com/unscripted.tech/",
  },
  {
    name: "Abhay Mishra",
    niche: "Gaming",
    image: "/creatorcohort/fellows/abhay.png",
    linkedin: "https://www.linkedin.com/in/abhay-mishra-04a442315",
    youtube: "https://m.youtube.com/%40bravey2007",
  },
  {
    name: "Prashasti Agarwal",
    niche: "Tech",
    image: "/creatorcohort/fellows/prashashti.png",
    linkedin: "https://www.linkedin.com/in/agarwalprashasti",
  },
  {
    name: "Lavanya Dua",
    niche: "Lifestyle",
    image: "/creatorcohort/fellows/lavanya.png",
    linkedin: "https://www.linkedin.com/in/lavanyaduadesign/",
    instagram: "https://www.instagram.com/lavanya.duaa",
  },
  {
    name: "Srujal Pawar",
    niche: "Marketing",
    image: "/creatorcohort/fellows/srujal.png",
    linkedin: "https://www.linkedin.com/in/srujalpawar/",
  },
  {
    name: "Shrishti Vaish",
    niche: "Tech",
    image: "/creatorcohort/fellows/shristi.png",
    linkedin: "https://www.linkedin.com/in/shrishti-vaish",
    instagram: "https://www.instagram.com/datanshrish",
  },
  {
    name: "Krishna Sharma",
    niche: "Motivational",
    image: "/creatorcohort/fellows/krishnasharma.png",
    linkedin: "https://www.linkedin.com/in/krishna-sharma-387781258",
    instagram: "https://www.instagram.com/eminencexk",
  },
  {
    name: "Surya Gupta",
    niche: "Tech",
    image: "/creatorcohort/fellows/surya.png",
    linkedin: "https://www.linkedin.com/in/surya-gupta-ai",
    instagram: "https://www.instagram.com/suryaweb3",
  },
]

const mentors = [
  {
    name: "Snehlata Singh",
    designation: "LinkedIn Ghostwriter for Coaches & Early Founders",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/snehlata.png",
    linkedin: "https://www.linkedin.com/in/snehlata-singh/",
  },
  {
    name: "Sayantan Dasgupta",
    designation: "Sr. Director Marketing, Think Power Solutions",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/sayantan.png",
    linkedin: "https://www.linkedin.com/in/sayantandasguptaofficial/",
  },
  {
    name: "Ankit G",
    designation: "Founder, Remote CMO · Ex-Grab, Jumia, Groupon",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/ankit.png",
    linkedin: "https://www.linkedin.com/in/ankit-gup/",
  },
  {
    name: "Ayushi Somani",
    designation: "Founder, WildGo Media · 50M+ LinkedIn Impressions",
    domain: "Personal Branding",
    image: "/creatorcohort/mentors/ayushi.png",
    linkedin: "https://www.linkedin.com/in/ayushi-somani-%F0%9F%92%99-46a41811a/",
  },
  {
    name: "Yug Sarin",
    designation: "Principal Product Designer, MRSOOL · Ex-Airtel, Bytedance",
    domain: "Video",
    image: "/creatorcohort/mentors/yug.png",
    linkedin: "https://www.linkedin.com/in/yugsarin/",
  },
  {
    name: "Abhishek Dubey",
    designation: "Senior UX Consultant, IIT Delhi",
    domain: "Graphics",
    image: "/creatorcohort/mentors/abhishek.png",
    linkedin: "https://www.linkedin.com/in/uxporte/",
  },
  {
    name: "Varedh Nigam",
    designation: "Associate Director — UX Design, Nagarro",
    domain: "Graphics",
    image: "/creatorcohort/mentors/varedh.png",
    linkedin: "https://www.linkedin.com/in/varedhnigam/",
  },
  {
    name: "Mohina Chadha",
    designation: "Group Product Manager, Times Internet",
    domain: "Fintech Product",
    image: "/creatorcohort/mentors/mohina.png",
    linkedin: "https://www.linkedin.com/in/mohinachadha/",
  },
  {
    name: "Anand Gangadharan",
    designation: "Manager — Data Products, American Express",
    domain: "Fintech Product",
    image: "/creatorcohort/mentors/anand.png",
    linkedin: "https://www.linkedin.com/in/anand-gangadharan/",
  },
]

const projects = [
  {
    number: 1,
    title: "Personal Branding",
    focus: "Define your positioning, narrative, and brand architecture",
    icon: Sparkles,
    accent: "from-amber-400 to-orange-500",
    border: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    number: 2,
    title: "Design: Graphics",
    focus: "Visual identity creation and graphic storytelling",
    icon: Palette,
    accent: "from-pink-400 to-rose-500",
    border: "border-pink-500/20 hover:border-pink-500/40",
  },
  {
    number: 3,
    title: "Design: Video",
    focus: "Short-form video production, editing, and platform optimisation",
    icon: Video,
    accent: "from-purple-400 to-violet-500",
    border: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    number: 4,
    title: "Product Launch — FinTech",
    focus: "Real brand brief — content strategy for a FinTech product launch",
    icon: Rocket,
    accent: "from-sky-400 to-blue-500",
    border: "border-sky-500/20 hover:border-sky-500/40",
  },
  {
    number: 5,
    title: "Product Launch — F&B",
    focus: "Real brand brief — content strategy for a Food & Beverage brand",
    icon: Globe,
    accent: "from-emerald-400 to-green-500",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    number: 6,
    title: "Product Launch — Health",
    focus: "Real brand brief — content strategy for a Health brand",
    icon: Heart,
    accent: "from-red-400 to-rose-500",
    border: "border-red-500/20 hover:border-red-500/40",
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
}

const domainColor: Record<string, string> = {
  "Personal Branding": "bg-[#B4FF00]/10 text-[#B4FF00] border border-[#B4FF00]/25",
  Video: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
  Graphics: "bg-teal-500/15 text-teal-300 border border-teal-500/25",
  "Fintech Product": "bg-sky-500/15 text-sky-300 border border-sky-500/25",
}

/* ─────────────── PAGE COMPONENT ─────────────── */

export default function CreatorFellowshipCohort1() {
  return (
    <div className="relative overflow-hidden">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,255,0,0.08),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(31,182,255,0.06),transparent)]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Floating orbs */}
          <div className="animate-float absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-[#B4FF00]/[0.04] blur-3xl" />
          <div className="animate-pulse-slow absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-[#1FB6FF]/[0.04] blur-3xl" />
          <div className="animate-float absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B4FF00]/[0.02] blur-2xl" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#B4FF00]/20 bg-[#B4FF00]/[0.06] px-5 py-2 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B4FF00] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B4FF00]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B4FF00]">
              Cohort 01 · Live Now
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up mb-6">
            <span className="block text-base font-medium uppercase tracking-[0.3em] text-white/40 sm:text-lg">
              Ambixous
            </span>
            <span className="mt-3 block text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
              <span className="text-gradient">Creator</span>
              <br />
              <span className="text-white">Fellowship</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up mx-auto mb-10 max-w-2xl text-lg text-white/50 sm:text-xl" style={{ animationDelay: "0.15s" }}>
            Building India&apos;s Next Generation of Creator-Entrepreneurs
          </p>

          {/* Date */}
          <p className="animate-slide-up mb-12 text-sm font-medium tracking-widest text-white/30" style={{ animationDelay: "0.25s" }}>
            MARCH 29 – JUNE 27, 2026 · AMBIXOUS INNOVATIONS LLP
          </p>

          {/* Stats Bar */}
          <div className="animate-slide-up mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" style={{ animationDelay: "0.35s" }}>
            {[
              { value: "9", label: "Fellows", icon: Users },
              { value: "13", label: "Weeks", icon: Calendar },
              { value: "6", label: "Projects", icon: Briefcase },
              { value: "4", label: "Teams", icon: Trophy },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-5 backdrop-blur-sm transition-all duration-300 hover:border-[#B4FF00]/20 hover:bg-white/[0.05]"
              >
                <stat.icon className="mx-auto mb-2 h-4 w-4 text-white/20 transition-colors group-hover:text-[#B4FF00]/60" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/30">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDelay: "1.5s" }}>
            <ArrowDown className="h-5 w-5 text-white/20" />
          </div>
        </div>
      </section>

      {/* ═══════════ THE PROBLEM ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="problem">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B4FF00]">
              The Problem
            </p>
            <h2 className="mb-6 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              India has creators.{" "}
              <span className="text-white/30">It lacks creator-entrepreneurs.</span>
            </h2>
            <p className="mb-16 max-w-2xl text-base leading-relaxed text-white/40 sm:text-lg">
              India&apos;s digital creator economy is growing rapidly, yet the vast majority of
              content creators plateau early — posting consistently without translating their
              audience into a career.
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
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
              <ScrollReveal key={item.title} delay={i * 120}>
                <div className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors group-hover:border-[#B4FF00]/30 group-hover:bg-[#B4FF00]/[0.08]">
                    <item.icon className="h-5 w-5 text-white/40 transition-colors group-hover:text-[#B4FF00]" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ THE SOLUTION ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="solution">
        {/* Divider gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#1FB6FF]">
              The Solution
            </p>
            <h2 className="mb-6 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              A fellowship that turns{" "}
              <span className="text-gradient">creators into brands.</span>
            </h2>
            <p className="mb-16 max-w-2xl text-base leading-relaxed text-white/40 sm:text-lg">
              A 13-week, cohort-based program that puts selected creators through six live
              projects, mentorship sessions, and jury evaluations — mirroring the rigour of a
              top-tier business school, applied entirely to the creator economy.
            </p>
          </ScrollReveal>

          {/* Methodology Steps */}
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                step: "01",
                title: "Mentorship Session",
                description:
                  "A domain expert introduces the brief and teaches the methodology. Fellows receive structured frameworks before execution.",
                color: "text-[#B4FF00]",
                border: "hover:border-[#B4FF00]/30",
              },
              {
                step: "02",
                title: "Live Project",
                description:
                  "Fellows execute work against the brief independently. Cross-domain teams create friction — the best ideas emerge from diverse perspectives.",
                color: "text-[#1FB6FF]",
                border: "hover:border-[#1FB6FF]/30",
              },
              {
                step: "03",
                title: "Jury Evaluation",
                description:
                  "An independent jury evaluates work against measurable criteria. Real feedback from industry professionals shapes every iteration.",
                color: "text-[#FF6978]",
                border: "hover:border-[#FF6978]/30",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 120}>
                <div
                  className={`group h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] sm:p-8 ${item.border}`}
                >
                  <span className={`text-sm font-bold ${item.color}`}>{item.step}</span>
                  <h3 className="mb-3 mt-4 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CURRICULUM ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="curriculum">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B4FF00]">
              Curriculum
            </p>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
              6 Projects. 13 Weeks.
            </h2>
            <p className="mb-16 max-w-2xl text-base leading-relaxed text-white/40 sm:text-lg">
              Each project follows a structured arc — learn, execute, evaluate — building skills
              progressively from personal branding to real product launches.
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <ScrollReveal key={project.number} delay={i * 100}>
                <div
                  className={`group relative h-full overflow-hidden rounded-2xl border bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] sm:p-7 ${project.border}`}
                >
                  {/* Gradient accent line */}
                  <div
                    className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${project.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors group-hover:border-white/[0.15]">
                      <project.icon className="h-5 w-5 text-white/40 transition-colors group-hover:text-white/70" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/20">
                      Project {project.number}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{project.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{project.focus}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Grand Finale callout */}
          <ScrollReveal delay={600}>
            <div className="mt-6 rounded-2xl border border-[#B4FF00]/15 bg-gradient-to-r from-[#B4FF00]/[0.04] to-[#1FB6FF]/[0.04] p-6 sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/10">
                  <GraduationCap className="h-6 w-6 text-[#B4FF00]" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    Grand Finale — June 27, 2026
                  </h3>
                  <p className="text-sm text-white/40">
                    Founder × Creator Demo Day (offline). Fellows present to founders, mentors,
                    jury, sponsors, and media.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ JOURNEY TIMELINE ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="timeline">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#1FB6FF]">
              The Journey
            </p>
            <h2 className="mb-16 text-center text-3xl font-bold sm:text-4xl lg:text-5xl">
              13-Week Roadmap
            </h2>
          </ScrollReveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-[#B4FF00]/30 via-[#1FB6FF]/20 to-white/[0.05] sm:left-1/2 sm:-translate-x-px" />

            <div className="space-y-0">
              {timeline.map((event, i) => (
                <ScrollReveal key={i} delay={i * 60}>
                  <div
                    className={`relative flex items-start gap-6 py-4 sm:gap-0 ${
                      i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                    }`}
                  >
                    {/* Content */}
                    <div className={`flex-1 pl-10 sm:pl-0 ${i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12"}`}>
                      <div className="inline-block">
                        {event.journey && (
                          <span
                            className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              event.journey === "START"
                                ? "bg-[#B4FF00]/15 text-[#B4FF00]"
                                : event.journey === "GRADUATION"
                                ? "bg-amber-500/15 text-amber-300"
                                : event.journey === "EXPLORE"
                                ? "bg-purple-500/15 text-purple-300"
                                : "bg-white/[0.06] text-white/50"
                            }`}
                          >
                            {event.journey}
                          </span>
                        )}
                        <p className="text-sm font-medium text-white/80 sm:text-base">
                          {event.agenda}
                        </p>
                        <p className="mt-0.5 text-xs text-white/30">{event.date}</p>
                      </div>
                    </div>

                    {/* Dot */}
                    <div className="absolute left-4 top-5 -translate-x-1/2 sm:left-1/2">
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${
                          event.isMilestone
                            ? "border-[#B4FF00] bg-[#B4FF00]/30 shadow-[0_0_8px_rgba(180,255,0,0.4)]"
                            : "border-white/20 bg-[#010409]"
                        }`}
                      />
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="hidden flex-1 sm:block" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MEET THE FELLOWS ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="fellows">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        {/* Background accent */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_30%_at_50%_50%,rgba(180,255,0,0.03),transparent)]" />

        <div className="relative mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B4FF00]">
              Cohort 01
            </p>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Meet the Fellows
            </h2>
            <p className="mb-16 max-w-xl text-base text-white/40 sm:text-lg">
              9 creators across 6 content niches — Lifestyle, Tech, Gaming, Marketing, and
              Motivational — united by ambition.
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {fellows.map((fellow, i) => (
              <ScrollReveal key={fellow.name} delay={i * 80}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all duration-300 group-hover:border-[#B4FF00]/20 sm:h-20 sm:w-20">
                      <Image
                        src={fellow.image}
                        alt={fellow.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1.5 text-base font-semibold text-white sm:text-lg">
                        {fellow.name}
                      </h3>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          nicheColor[fellow.niche] || "bg-white/10 text-white/60"
                        }`}
                      >
                        {fellow.niche}
                      </span>

                      {/* Social Links */}
                      <div className="mt-3 flex gap-2">
                        <a
                          href={fellow.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-all hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                          aria-label={`${fellow.name} LinkedIn`}
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                        {fellow.instagram && (
                          <a
                            href={fellow.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-all hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400"
                            aria-label={`${fellow.name} Instagram`}
                          >
                            <Instagram className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {fellow.youtube && (
                          <a
                            href={fellow.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            aria-label={`${fellow.name} YouTube`}
                          >
                            <Youtube className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MENTORS & JURY ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="mentors">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#1FB6FF]">
              Mentors & Jury
            </p>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Industry Leaders
            </h2>
            <p className="mb-16 max-w-xl text-base text-white/40 sm:text-lg">
              Senior professionals from American Express, Times Internet, Nagarro, IIT Delhi, 
              MRSOOL, and more — guiding every project.
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {mentors.map((mentor, i) => (
              <ScrollReveal key={mentor.name} delay={i * 80}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all duration-300 group-hover:border-[#1FB6FF]/20 sm:h-20 sm:w-20">
                      <Image
                        src={mentor.image}
                        alt={mentor.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-white sm:text-lg">
                          {mentor.name}
                        </h3>
                        <a
                          href={mentor.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-all hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                          aria-label={`${mentor.name} LinkedIn`}
                        >
                          <Linkedin className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="mb-2 text-xs leading-relaxed text-white/35 line-clamp-2">
                        {mentor.designation}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          domainColor[mentor.domain] || "bg-white/10 text-white/60"
                        }`}
                      >
                        {mentor.domain}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MEASURABLE IMPACT ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="impact">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_50%,rgba(31,182,255,0.03),transparent)]" />

        <div className="relative mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#B4FF00]">
              Measurable Impact
            </p>
            <h2 className="mb-16 text-3xl font-bold sm:text-4xl lg:text-5xl">
              What fellows leave with.
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2">
            {/* For Fellows */}
            <ScrollReveal>
              <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
                <h3 className="mb-6 text-lg font-semibold text-white">For the Fellows</h3>
                <div className="space-y-4">
                  {[
                    "6 jury-evaluated projects forming a professional-grade creator portfolio",
                    "3 completed real brand briefs (FinTech, F&B, Health) evaluated by brand stakeholders",
                    "Credential: 'Ambixous Creator Fellow — Cohort 01' for LinkedIn and public profiles",
                    "Cross-domain peer network across 6 content niches",
                    "Direct mentor relationships built over 13 weeks of structured engagement",
                    "Public recognition at the offline Grand Finale: Founder × Creator Demo Day",
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B4FF00]/10">
                        <Check className="h-3 w-3 text-[#B4FF00]" />
                      </div>
                      <p className="text-sm leading-relaxed text-white/50">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* For the Ecosystem */}
            <ScrollReveal delay={150}>
              <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
                <h3 className="mb-6 text-lg font-semibold text-white">
                  For the Ecosystem
                </h3>
                <div className="space-y-4">
                  {[
                    "A replicable, scalable model for structured creator education — demonstrated in India for the first time",
                    "Data on cohort-based learning outcomes for creator-entrepreneurs: portfolio quality, brand collaboration readiness, and long-term audience growth post-fellowship",
                    "A network of 9 benchmark creators across niches, documented as Cohort 01 alumni",
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1FB6FF]/10">
                        <Check className="h-3 w-3 text-[#1FB6FF]" />
                      </div>
                      <p className="text-sm leading-relaxed text-white/50">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Extra visual element */}
                <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-white/70">First of its kind</p>
                      <p className="text-xs text-white/30">
                        India&apos;s first structured, cohort-based creator education program with
                        real brand briefs and jury evaluations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ SECTION ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32" id="faq">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#B4FF00]">
              FAQ
            </p>
            <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mb-12 text-center text-base text-white/40 sm:text-lg">
              Everything you need to know about the Creator Fellowship.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <FAQSection />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="relative px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(180,255,0,0.06),transparent)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B4FF00]/20 bg-[#B4FF00]/[0.06] px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B4FF00] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#B4FF00]" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B4FF00]">
                Cohort 01 is live
              </span>
            </div>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
              The future of creator education{" "}
              <span className="text-gradient">starts here.</span>
            </h2>
            <p className="mb-10 text-base text-white/40 sm:text-lg">
              Applications for Cohort 02 will be announced soon.
              <br className="hidden sm:block" />
              Follow Ambixous to stay updated.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/[0.08] px-6 py-3 text-sm font-semibold text-[#B4FF00] transition-all duration-300 hover:border-[#B4FF00]/40 hover:bg-[#B4FF00]/[0.15] hover:shadow-[0_0_20px_rgba(180,255,0,0.15)]"
              >
                Explore Ambixous
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://www.linkedin.com/company/ambixous/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
              >
                <Linkedin className="h-4 w-4" />
                Follow on LinkedIn
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
