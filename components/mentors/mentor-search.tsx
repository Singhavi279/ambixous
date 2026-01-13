"use client"

import { Search, X } from "lucide-react"

interface MentorSearchProps {
  value: string
  onChange: (value: string) => void
}

export function MentorSearch({ value, onChange }: MentorSearchProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by mentor name or company..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-[#b4ff00] focus:ring-1 focus:ring-[#b4ff00] transition-all"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
