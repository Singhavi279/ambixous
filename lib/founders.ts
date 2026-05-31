export interface Founder {
  name: string
  role: string
  description: string
  linkedin: string
  email: string
  accent: "ambixous-neon" | "signal-blue" | "sun-coral"
  photo: string
}

export const founders: Founder[] = [
  {
    name: "Riti Gupta",
    role: "Product Ops @ Times Internet · 2x Founder · IIT Delhi",
    description:
      "A product operations leader at Times Internet and 2x founder of Ambixous and Technophiles. She designs high-trust rooms, brand partnerships, VC roundtables, investor mixers, and community programs that turn conversations into business and ecosystem impact.",
    linkedin: "https://www.linkedin.com/in/ritigupta05/",
    email: "codework.riti@gmail.com",
    accent: "ambixous-neon",
    photo:
      "https://media.licdn.com/dms/image/v2/D5603AQFGaMUY0yBH9g/profile-displayphoto-crop_800_800/B56Z0Qwll1JIAI-/0/1774102666926?e=1781740800&v=beta&t=z4vv6sk8zMF5ipn5w7cKkRWYNcRHtnrCHWlKpUH9dZ0",
  },
  {
    name: "Avnish Singh",
    role: "AI Product Manager · 0-to-1 Builder · Community-Led Growth",
    description:
      "An AI product manager who moved from code to communities to 0-to-1 product execution. He ships MVPs, closes handoff gaps, translates technical tradeoffs, and uses community insight to find needs before they become feature requests.",
    linkedin: "https://www.linkedin.com/in/singhavi279/",
    email: "t20avnish@gmail.com",
    accent: "signal-blue",
    photo:
      "https://media.licdn.com/dms/image/v2/D5603AQGKVh1xb4ha-Q/profile-displayphoto-crop_800_800/B56Z0VqogkKAAI-/0/1774184995842?e=1781740800&v=beta&t=TrABs3KB4eyaCTDXqu9Yq7zPDQU9IuCnAelr6XfEqew",
  },
  {
    name: "Yug Sarin",
    role: "UX Design Leader · Design Systems Strategist · Mentor",
    description:
      "A UX design leader with 15+ years creating digital experiences for ByteDance, Mrsool, Airtel, TikTok, Mercedes, Adobe, Mastercard, and Intel. He builds design systems, mentors teams, and aligns design strategy with business goals.",
    linkedin: "https://www.linkedin.com/in/yugsarin/",
    email: "yugsarin@gmail.com",
    accent: "sun-coral",
    photo:
      "https://media.licdn.com/dms/image/v2/D5603AQFEAmXYmC2Wtw/profile-displayphoto-crop_800_800/B56ZyJ1_zLJMAI-/0/1771839161064?e=1781740800&v=beta&t=OxVi-hd4OsvtJGvbmThefu0dqRnyI1HxfK6E7nk40aM",
  },
]
