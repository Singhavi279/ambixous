"use client"

import { MentorCard } from "./mentor-card"
import { Mentor } from "@/lib/mentor-data"
import { Users } from "lucide-react"

interface MentorGridProps {
    mentors: Mentor[]
}

export function MentorGrid({ mentors }: MentorGridProps) {
    if (mentors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Users className="text-slate-gray" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-warm-white mb-2">
                    No mentors found
                </h3>
                <p className="text-slate-gray">
                    Try selecting a different category
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mentors.map((mentor, index) => (
                <MentorCard key={mentor.id} mentor={mentor} index={index} />
            ))}
        </div>
    )
}
