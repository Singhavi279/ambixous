"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { faqData } from "./faq-data"

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
              className={`h-5 w-5 shrink-0 text-white/55 transition-transform duration-300 ${
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
              <p className="px-6 pb-5 text-sm leading-relaxed text-white/55 sm:text-base">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
