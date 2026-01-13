"use client"

interface MentorFiltersProps {
  categories: string[]
  selectedCategories: string[]
  categoryCounts: Array<{ category: string; count: number }>
  onCategoryToggle: (category: string) => void
  sortBy: "name-asc" | "name-desc" | "recent"
  onSortChange: (sort: "name-asc" | "name-desc" | "recent") => void
}

export function MentorFilters({
  categories,
  selectedCategories,
  categoryCounts,
  onCategoryToggle,
  sortBy,
  onSortChange,
}: MentorFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Category Filters */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const count = categoryCounts.find((c) => c.category === category)?.count || 0
            const isSelected = selectedCategories.includes(category)

            return (
              <button
                key={category}
                onClick={() => onCategoryToggle(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected ? "bg-[#b4ff00] text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {category}
                <span className="ml-2 text-xs">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Sort by</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "name-asc" | "name-desc" | "recent")}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:border-[#b4ff00] focus:ring-1 focus:ring-[#b4ff00] transition-all"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>
    </div>
  )
}
