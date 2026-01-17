"use client"

import { Search, ArrowUpDown } from "lucide-react"
import { categories, CategoryValue } from "@/lib/mentor-data"

export type SortOption = 'name-asc' | 'name-desc' | 'company-asc' | 'company-desc'

interface MentorFiltersProps {
    activeCategory: CategoryValue
    onCategoryChange: (category: CategoryValue) => void
    searchQuery: string
    onSearchChange: (query: string) => void
    sortOption: SortOption
    onSortChange: (sort: SortOption) => void
}

export function MentorFilters({
    activeCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
}: MentorFiltersProps) {
    return (
        <div className="space-y-6 py-8">
            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Search Input */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or company..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-full bg-white/5 border border-white/10 
                       text-warm-white placeholder-slate-gray
                       focus:outline-none focus:border-ambixous-neon/50 focus:ring-1 focus:ring-ambixous-neon/25
                       transition-all duration-300"
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray pointer-events-none" size={16} />
                    <select
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="appearance-none pl-10 pr-8 py-3 rounded-full bg-white/5 border border-white/10 
                       text-warm-white cursor-pointer
                       focus:outline-none focus:border-ambixous-neon/50
                       transition-all duration-300"
                    >
                        <option value="name-asc" className="bg-electric-ink">Name A-Z</option>
                        <option value="name-desc" className="bg-electric-ink">Name Z-A</option>
                        <option value="company-asc" className="bg-electric-ink">Company A-Z</option>
                        <option value="company-desc" className="bg-electric-ink">Company Z-A</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                    <button
                        key={category.value}
                        type="button"
                        onClick={() => onCategoryChange(category.value)}
                        className={`
              px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300
              ${activeCategory === category.value
                                ? 'bg-ambixous-neon text-electric-ink shadow-lg shadow-ambixous-neon/25'
                                : 'bg-white/5 text-slate-gray hover:bg-white/10 hover:text-warm-white border border-white/10'
                            }
            `}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
