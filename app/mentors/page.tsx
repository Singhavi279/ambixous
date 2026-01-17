"use client"

import { useState, useMemo } from "react"
import { MentorsHero } from "@/components/mentors/mentors-hero"
import { MentorFilters, SortOption } from "@/components/mentors/mentor-filters"
import { MentorGrid } from "@/components/mentors/mentor-grid"
import { mentors, CategoryValue } from "@/lib/mentor-data"

export default function MentorsPage() {
    const [activeCategory, setActiveCategory] = useState<CategoryValue>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortOption, setSortOption] = useState<SortOption>('name-asc')

    const filteredAndSortedMentors = useMemo(() => {
        let result = [...mentors]

        // Filter by category
        if (activeCategory !== 'all') {
            result = result.filter((mentor) => mentor.category === activeCategory)
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(
                (mentor) =>
                    mentor.name.toLowerCase().includes(query) ||
                    mentor.company.toLowerCase().includes(query)
            )
        }

        // Sort
        result.sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'company-asc':
                    return a.company.localeCompare(b.company)
                case 'company-desc':
                    return b.company.localeCompare(a.company)
                default:
                    return 0
            }
        })

        return result
    }, [activeCategory, searchQuery, sortOption])

    return (
        <div className="min-h-screen bg-electric-ink">
            <MentorsHero />

            <section className="container-width section-padding py-12">
                <MentorFilters
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                />

                {/* Results count */}
                <div className="text-center mb-6">
                    <span className="text-slate-gray text-sm">
                        Showing <span className="text-ambixous-neon font-semibold">{filteredAndSortedMentors.length}</span> mentor{filteredAndSortedMentors.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <MentorGrid mentors={filteredAndSortedMentors} />
            </section>
        </div>
    )
}
