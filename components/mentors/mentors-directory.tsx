"use client"

import { useState, useEffect } from "react"
import { getAllMentors, searchMentors } from "@/lib/supabase/mentors"
import type { Mentor } from "@/lib/supabase/mentors"
import { MentorCard } from "./mentor-card"
import { MentorSearch } from "./mentor-search"
import { MentorFilters } from "./mentor-filters"

const categories = ["Founders", "Growth & Marketing", "Professionals"]

export function MentorsDirectory() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "recent">("name-asc")
  const [loading, setLoading] = useState(true)

  // Fetch all mentors on mount
  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true)
      const data = await getAllMentors()
      setMentors(data)
      setFilteredMentors(data)
      setLoading(false)
    }

    fetchMentors()
  }, [])

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === "") {
        applyFiltersAndSort(mentors)
      } else {
        const results = await searchMentors(searchQuery)
        applyFiltersAndSort(results)
      }
    }

    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, mentors])

  // Handle filter and sort changes
  useEffect(() => {
    applyFiltersAndSort(searchQuery.trim() === "" ? mentors : filteredMentors)
  }, [selectedCategories, sortBy])

  const applyFiltersAndSort = (data: Mentor[]) => {
    const result = data.filter((mentor) => selectedCategories.includes(mentor.category))

    // Apply sorting
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "recent":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredMentors(result)
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const categoryCounts = categories.map((cat) => ({
    category: cat,
    count: mentors.filter((m) => m.category === cat).length,
  }))

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="space-y-6">
        <MentorSearch value={searchQuery} onChange={setSearchQuery} />
        <MentorFilters
          categories={categories}
          selectedCategories={selectedCategories}
          categoryCounts={categoryCounts}
          onCategoryToggle={handleCategoryToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Found <span className="text-[#b4ff00] font-semibold">{filteredMentors.length}</span> mentors
        </p>
      </div>

      {/* Mentors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No mentors found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  )
}
