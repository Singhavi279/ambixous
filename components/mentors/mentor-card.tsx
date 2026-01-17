"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Linkedin } from "lucide-react"
import { Mentor } from "@/lib/mentor-data"

interface MentorCardProps {
    mentor: Mentor
    index: number
}

const categoryStyles = {
    founder: {
        badge: 'bg-ambixous-neon/20 text-ambixous-neon border-ambixous-neon/30',
        glow: 'group-hover:shadow-ambixous-neon/20',
    },
    growth: {
        badge: 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
        glow: 'group-hover:shadow-signal-blue/20',
    },
    professionals: {
        badge: 'bg-sun-coral/20 text-sun-coral border-sun-coral/30',
        glow: 'group-hover:shadow-sun-coral/20',
    },
}

const categoryLabels = {
    founder: 'Founder',
    growth: 'Growth',
    professionals: 'Professional',
}

export function MentorCard({ mentor, index }: MentorCardProps) {
    const [isClient, setIsClient] = useState(false)
    const style = categoryStyles[mentor.category]
    const initials = mentor.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return (
        <div
            className={`
        group relative p-6 rounded-2xl
        bg-white/5 backdrop-blur-sm
        border border-white/10 hover:border-white/20
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        hover:shadow-2xl ${style.glow}
        ${isClient ? 'animate-fade-in' : 'opacity-100'}
      `}
            style={isClient ? { animationDelay: `${Math.min(index * 50, 500)}ms` } : undefined}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                    <div className={`
            w-20 h-20 rounded-full 
            bg-gradient-to-br from-slate-700 to-slate-800
            flex items-center justify-center
            border-2 border-white/20
            group-hover:border-ambixous-neon/50
            transition-all duration-300
            group-hover:shadow-lg group-hover:shadow-ambixous-neon/20
          `}>
                        {mentor.avatar ? (
                            <img
                                src={mentor.avatar}
                                alt={mentor.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-warm-white">{initials}</span>
                        )}
                    </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-warm-white group-hover:text-ambixous-neon transition-colors duration-300">
                    {mentor.name}
                </h3>

                {/* Company */}
                <p className="text-sm text-slate-gray">
                    {mentor.company}
                </p>

                {/* Category Badge */}
                <span className={`
          px-3 py-1 rounded-full text-xs font-medium
          border ${style.badge}
        `}>
                    {categoryLabels[mentor.category]}
                </span>

                {/* LinkedIn Button */}
                <Link
                    href={mentor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
            mt-2 p-2.5 rounded-full
            bg-white/5 hover:bg-signal-blue/20
            border border-white/10 hover:border-signal-blue/50
            text-slate-gray hover:text-signal-blue
            transition-all duration-300
            hover:scale-110 hover:shadow-lg hover:shadow-signal-blue/20
          `}
                    aria-label={`View ${mentor.name}'s LinkedIn profile`}
                >
                    <Linkedin size={18} />
                </Link>
            </div>
        </div>
    )
}
