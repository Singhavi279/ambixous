"use client"

import { Linkedin, Instagram, Youtube, Twitter, Calendar, Rocket } from "lucide-react"
import { LinkCard } from "./link-card"

const links = [
    {
        href: "https://www.linkedin.com/in/ritigupta05/",
        label: "Riti Gupta",
        sublabel: "Cofounder · Ambixous",
        icon: Linkedin,
        iconColor: "#0A66C2",
    },
    {
        href: "https://www.linkedin.com/in/singhavi279/",
        label: "Avnish Singh",
        sublabel: "Cofounder · Ambixous",
        icon: Linkedin,
        iconColor: "#0A66C2",
    },
    {
        href: "https://www.linkedin.com/company/ambixous/",
        label: "Ambixous",
        sublabel: "Company LinkedIn",
        icon: Linkedin,
        iconColor: "#0A66C2",
    },
    {
        href: "https://www.instagram.com/myambixous/",
        label: "@myambixous",
        sublabel: "Instagram",
        icon: Instagram,
        iconColor: "#E4405F",
    },
    {
        href: "https://www.youtube.com/@Ambixous",
        label: "Ambixous",
        sublabel: "YouTube",
        icon: Youtube,
        iconColor: "#FF0000",
    },
    {
        href: "https://x.com/myambixous",
        label: "@myambixous",
        sublabel: "Twitter / X",
        icon: Twitter,
        iconColor: "#1DA1F2",
    },
    {
        href: "https://www.commudle.com/communities/ambixous/",
        label: "Community Events",
        sublabel: "Commudle",
        icon: Calendar,
        iconColor: "#B4FF00",
    },
    {
        href: "https://ace.ambixous.in",
        label: "ACE Interview Prep",
        sublabel: "Flagship Product 🚀",
        icon: Rocket,
        iconColor: "#1FB6FF",
    },
]

export function LinksGrid() {
    return (
        <section className="w-full max-w-lg mx-auto px-4 space-y-3">
            {links.map((link, index) => (
                <LinkCard
                    key={link.href}
                    {...link}
                    delay={index * 80}
                />
            ))}
        </section>
    )
}
