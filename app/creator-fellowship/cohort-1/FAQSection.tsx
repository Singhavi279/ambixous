"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is the Ambixous Creator Fellowship?",
    answer:
      "The Ambixous Creator Fellowship is a 13-week, cohort-based program designed to transform content creators into creator-entrepreneurs. It combines structured mentorship sessions, live projects against real brand briefs, and jury evaluations — mirroring the rigour of a top-tier business school, applied entirely to the creator economy.",
  },
  {
    question: "Who is Cohort 01 designed for?",
    answer:
      "Cohort 01 brings together 9 fellows across 6 content niches — Lifestyle, Tech, Gaming, Motivational, Finance, and Web3. The fellowship targets early-stage creators who have a strong point of view and creative hunger, but lack the tools, frameworks, or network to convert their potential into lasting impact.",
  },
  {
    question: "What is the format of the program — online or offline?",
    answer:
      "The fellowship is primarily online, with weekly mentorship sessions and bi-weekly jury evaluation rounds conducted virtually. The program culminates in an offline Grand Finale — the Founder × Creator Demo Day on June 27, 2026 — where fellows present their work to founders, mentors, jury members, sponsors, and media.",
  },
  {
    question: "How long does the fellowship last?",
    answer:
      "The program runs for 13 weeks, from March 29 to June 27, 2026. Each week includes structured activities — mentorship sessions, independent project execution, and jury evaluations — designed to progressively build a professional creator portfolio.",
  },
  {
    question: "How are the cross-domain teams structured?",
    answer:
      "Fellows are deliberately placed in cross-domain teams of 2–3 members. A Tech creator might work alongside a Lifestyle creator and a Gaming creator. The friction is intentional — the best creative ideas emerge from diverse perspectives solving the same brief.",
  },
  {
    question: "What kinds of projects will fellows work on?",
    answer:
      "The curriculum includes 6 projects spanning Personal Branding, Graphic Design, Video Production, and three Product Launch campaigns (FinTech, Food & Beverage, and Health). Three of the six projects involve real brand briefs, ensuring fellows gain hands-on commercial experience.",
  },
  {
    question: "Will fellows work with real brands?",
    answer:
      "Yes. Projects 4, 5, and 6 are centred around real brand briefs — fellows develop content strategies for actual FinTech, Food & Beverage, and Health brands. The work is evaluated not only by the jury but also by brand stakeholders, giving fellows genuine commercial exposure.",
  },
  {
    question: "How is the work evaluated?",
    answer:
      "Every project follows a structured arc: a mentorship session introduces the brief and methodology, fellows execute the work independently, and then an independent jury evaluates submissions against measurable criteria. This three-step cycle — Learn, Execute, Evaluate — runs across all 6 projects.",
  },
  {
    question: "What do fellows receive upon completing the fellowship?",
    answer:
      "Fellows graduate with 6 jury-evaluated projects forming a professional-grade portfolio, 3 completed real brand briefs, the credential 'Ambixous Creator Fellow — Cohort 01' for LinkedIn and public profiles, a cross-domain peer network across 6 content niches, direct mentor relationships, and public recognition at the offline Grand Finale.",
  },
  {
    question: "What happens at the Grand Finale?",
    answer:
      "The Grand Finale is the Founder × Creator Demo Day, scheduled for June 27, 2026. It is an offline event where fellows present their work and growth journey to an audience of founders, mentors, jury members, sponsors, and media — a culmination of 13 weeks of structured learning and execution.",
  },
  {
    question: "Who are the mentors and jury members?",
    answer:
      "Mentors and jury members include senior industry professionals from organisations such as American Express, Times Internet, Nagarro, IIT Delhi, MRSOOL (ex-Airtel, Bytedance), Think Power Solutions, and more. Each mentor brings domain-specific expertise aligned with the project they guide — from personal branding to product design to fintech strategy.",
  },
  {
    question: "How can I apply for future cohorts?",
    answer:
      "Cohort 01 is currently live with 9 selected fellows. Applications for future cohorts will be announced on Ambixous's official channels. Follow Ambixous on LinkedIn and visit ambixous.in to stay updated on Cohort 02 announcements and application timelines.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-3">
      {faqData.map((item, index) => (
        <div
          key={index}
          className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <button
            onClick={() => toggle(index)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            aria-expanded={openIndex === index}
            id={`faq-trigger-${index}`}
            aria-controls={`faq-content-${index}`}
          >
            <span className="text-base font-medium text-white/90 transition-colors group-hover:text-white sm:text-lg">
              {item.question}
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 ${
                openIndex === index ? "rotate-180 text-[#B4FF00]" : ""
              }`}
            />
          </button>
          <div
            id={`faq-content-${index}`}
            role="region"
            aria-labelledby={`faq-trigger-${index}`}
            className={`grid transition-all duration-300 ease-in-out ${
              openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-sm leading-relaxed text-white/50 sm:text-base">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
