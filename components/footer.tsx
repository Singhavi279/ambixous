import Link from "next/link"
import Image from "next/image"
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
      <div className="container-width section-padding py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-10 md:gap-6 lg:gap-12">
          {/* Brand & Address */}
          <div className="md:col-span-5 space-y-6">
            <Logo size="md" href="/" />
            <p className="text-slate-gray text-sm max-w-sm leading-relaxed">
              Where ambition finds speed and impact finds scale.
            </p>
            <div className="space-y-1">
              <p className="text-slate-gray/70 text-xs leading-relaxed max-w-md">
                Ambixous Innovations LLP, 1st Floor, A-23, Hardware Paints and Tools
                Aggarwal Electrical and Dundahera Village; Lal Dora, Sec 20, 122016
              </p>
              <p className="text-slate-gray/50 text-xs">
                LLPIN: ACL-1668
              </p>
            </div>
            
            {/* Added Illustration */}
            <div className="relative w-full max-w-[280px] h-20 opacity-60 rounded-xl overflow-hidden mt-6">
               <Image 
                 src="/bottom.png" 
                 alt="Ambixous Community"
                 fill
                 className="object-cover"
               />
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3 space-y-6 md:pl-4">
            <h3 className="font-semibold text-warm-white text-sm tracking-wide">Quick Links</h3>
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm text-slate-gray hover:text-ambixous-neon transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="font-semibold text-warm-white text-sm tracking-wide">Connect</h3>
            <div className="space-y-4">
              <a
                href="mailto:hi.ambixous@gmail.com"
                className="text-sm text-slate-gray hover:text-signal-blue transition-colors duration-200 block"
              >
                hi.ambixous@gmail.com
              </a>
              <div className="flex space-x-5">
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
                      <Icon size={20} />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-gray/60 text-xs">
            © {new Date().getFullYear()} Ambixous Innovations LLP. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-slate-gray/60 text-xs hover:text-warm-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-slate-gray/60 text-xs hover:text-warm-white transition-colors duration-200"
            >
              Terms &amp; Conditions
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
