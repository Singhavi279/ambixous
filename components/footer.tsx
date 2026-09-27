import Link from "next/link"
import { Logo } from "./logo"
import { Linkedin, Instagram, Youtube, Twitter } from "lucide-react"

export function Footer() {
  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Community", href: "/community" },
    { name: "Startups", href: "/startups" },
    { name: "Events", href: "/events" },
  ]

  const socialLinks = [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/ambixous/", icon: Linkedin },
    { name: "Instagram", href: "https://www.instagram.com/myambixous/", icon: Instagram },
    { name: "YouTube", href: "https://www.youtube.com/@Ambixous", icon: Youtube },
    { name: "Twitter", href: "https://x.com/myambixous", icon: Twitter },
  ]

  return (
    <footer className="bg-electric-ink border-t border-white/[0.06]">
      <div className="container-width section-padding py-16 sm:py-20 lg:py-24">
        {/* Top: Brand + tagline */}
        <div className="flex flex-col items-center text-center">
          <Logo size="md" href="/" />
          <p className="mt-4 text-slate-gray text-sm sm:text-base max-w-xs leading-relaxed">
            Where ambition finds speed and impact finds scale
          </p>
        </div>

        {/* Navigation links — horizontal */}
        <nav className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-slate-gray hover:text-warm-white transition-colors duration-200"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Social icons */}
        <div className="mt-8 flex justify-center gap-5">
          {socialLinks.map((social) => {
            const Icon = social.icon
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                className="text-slate-gray hover:text-ambixous-neon transition-colors duration-200"
                aria-label={social.name}
                rel="noopener noreferrer"
              >
                <Icon size={18} />
              </a>
            )
          })}
        </div>

        {/* Contact */}
        <div className="mt-8 flex justify-center">
          <a
            href="mailto:hi.ambixous@gmail.com"
            className="text-sm text-slate-gray hover:text-signal-blue transition-colors duration-200"
          >
            hi.ambixous@gmail.com
          </a>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-white/[0.06]" />

        {/* Bottom: Legal + Address */}
        <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:justify-between lg:items-start">
          {/* Left: Copyright + legal links */}
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <p className="text-xs text-slate-gray/70">
              © {new Date().getFullYear()} Ambixous Innovations LLP. All rights reserved.
            </p>
            <nav className="flex items-center gap-5">
              <Link
                href="/privacy-policy"
                className="text-xs text-slate-gray/60 hover:text-warm-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-gray/20">·</span>
              <Link
                href="/terms"
                className="text-xs text-slate-gray/60 hover:text-warm-white transition-colors duration-200"
              >
                Terms &amp; Conditions
              </Link>
            </nav>
          </div>

          {/* Right: Registered address */}
          <div className="text-center lg:text-right">
            <p className="text-[11px] leading-relaxed text-slate-gray/50">
              Ambixous Innovations LLP, 1st Floor, A-23, Hardware Paints and Tools
              <br className="hidden sm:inline" />{" "}
              Aggarwal Electrical and Dundahera Village; Lal Dora, Sec 20, 122016
            </p>
            <p className="mt-1 text-[11px] text-slate-gray/40">
              LLPIN: ACL-1668
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
