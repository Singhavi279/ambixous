import type { Metadata } from "next"
import { MentorsDirectory } from "@/components/mentors/mentors-directory"

export const metadata: Metadata = {
  title: "Mentors | Ambixous",
  description: "Connect with experienced mentors across Founders, Growth & Marketing, and Professionals categories.",
}

export default function MentorsPage() {
  return (
    <div className="min-h-screen bg-[#010409]">
      <div className="section-padding pt-24 pb-16">
        <div className="container-width">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your <span className="text-[#b4ff00]">Mentor</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Connect with industry experts, founders, and growth leaders who can guide your journey
            </p>
          </div>

          <MentorsDirectory />
        </div>
      </div>
    </div>
  )
}
