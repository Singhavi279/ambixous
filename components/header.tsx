"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Community", href: "/community" },
    { name: "Startups", href: "/startups" },
    { name: "Events", href: "/events" },
    { name: "Mentors", href: "/mentors" },
    {
      name: "Fellowship",
      href: "/creator-fellowship/cohort-1",
      live: true,
    },
    {
      name: "ACE",
      href: "https://ace.ambixous.in",
      external: true,
      badge: true,
    },
  ] as Array<{
    name: string
    href: string
    external?: boolean
    badge?: boolean
    live?: boolean
  }>

  return (
    <header className="sticky top-0 z-50 bg-electric-ink/95 backdrop-blur-sm border-b border-slate-gray/20">
      <nav className="container-width section-padding py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" href="/" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="text-warm-white hover:text-ambixous-neon transition-colors duration-200 font-medium"
                >
                  {item.name}
                </Link>
                {item.badge && (
                  <div className="absolute -top-2 -right-4 w-3 h-3 bg-red-500 rounded-full animate-blink shadow-red-500/50 shadow-lg" />
                )}
                {item.live && (
                  <span className="absolute -top-2 -right-4 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ambixous-neon opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-ambixous-neon shadow-lg shadow-ambixous-neon/50" />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Single Primary CTA */}
          <div className="hidden md:block">
            <Button
              asChild
              className="bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold px-6 py-2 shadow-lg hover:shadow-ambixous-neon/25 transition-all duration-200"
            >
              <Link href="https://chat.whatsapp.com/KWSzQoOLZ4vJHJZ7KSSD7I?mode=ems_copy_t" target="_blank" rel="noopener noreferrer">
                Join Community
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-warm-white hover:text-ambixous-neon transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <div key={item.name} className="relative">
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-warm-white hover:text-ambixous-neon transition-colors duration-200 font-medium py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.badge && (
                    <div className="absolute -top-1 -right-3 w-3 h-3 bg-red-500 rounded-full animate-blink shadow-red-500/50 shadow-lg" />
                  )}
                  {item.live && (
                    <span className="absolute -top-1 -right-3 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ambixous-neon opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-ambixous-neon shadow-lg shadow-ambixous-neon/50" />
                    </span>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-slate-gray/20">
                <Button
                  asChild
                  className="w-full bg-ambixous-neon text-electric-ink hover:bg-ambixous-neon/90 font-bold shadow-lg"
                >
                  <Link href="/community">Join Community</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
