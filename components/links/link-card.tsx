"use client"

import type { LucideIcon } from "lucide-react"
import type { IconType } from "react-icons"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

interface LinkCardProps {
  href: string
  label: string
  sublabel: string
  icon: LucideIcon | IconType
  iconColor?: string
  delay?: number
}

export function LinkCard({ href, label, sublabel, icon: Icon, iconColor = "#B4FF00", delay = 0 }: LinkCardProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${label} — Ambixous`,
          text: sublabel,
          url: href,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(href)
        } else {
          const textarea = document.createElement("textarea")
          textarea.value = href
          textarea.style.position = "fixed"
          textarea.style.opacity = "0"
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand("copy")
          document.body.removeChild(textarea)
        }
        toast.success("Link copied to clipboard!", {
          description: href,
          duration: 2000,
        })
      } catch {
        toast.error("Failed to copy link")
      }
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-stagger-in block"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="glass-card-glow group flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.08] hover:border-ambixous-neon/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors duration-300">
          <Icon size={20} color={iconColor} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-warm-white font-semibold text-sm sm:text-base truncate">{label}</p>
          <p className="text-slate-gray text-xs sm:text-sm truncate">{sublabel}</p>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-gray hover:text-ambixous-neon hover:bg-white/[0.08] transition-all duration-200"
          aria-label={`Share ${label}`}
        >
          <Share2 size={16} />
        </button>
      </div>
    </a>
  )
}
