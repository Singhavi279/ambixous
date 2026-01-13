import type { Mentor } from "@/lib/supabase/mentors"
import { Linkedin, ExternalLink } from "lucide-react"

interface MentorCardProps {
  mentor: Mentor
}

export function MentorCard({ mentor }: MentorCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Founders":
        return "bg-blue-900 text-blue-200"
      case "Growth & Marketing":
        return "bg-purple-900 text-purple-200"
      case "Professionals":
        return "bg-green-900 text-green-200"
      default:
        return "bg-gray-700 text-gray-200"
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#b4ff00] transition-all duration-300 hover:shadow-lg hover:shadow-[#b4ff00]/20 group animate-slide-in">
      <div className="space-y-4">
        {/* Category Badge */}
        <div className="inline-block">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(mentor.category)}`}>
            {mentor.category}
          </span>
        </div>

        {/* Mentor Name */}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-[#b4ff00] transition-colors">{mentor.name}</h3>
        </div>

        {/* Company/Brand */}
        <div>
          <p className="text-gray-400 text-sm">{mentor.brand_name}</p>
        </div>

        {/* LinkedIn Button */}
        <div className="pt-2">
          <a
            href={mentor.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#b4ff00] text-black font-semibold rounded-lg hover:bg-[#a3e600] transition-all duration-200 hover:scale-105"
          >
            <Linkedin size={16} />
            <span>View Profile</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
