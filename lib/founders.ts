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
    photo: "/founders/riti.png",
  },
  {
    name: "Avnish Singh",
    role: "AI Product Manager · 0-to-1 Builder · Community-Led Growth",
    description:
      "An AI product manager who moved from code to communities to 0-to-1 product execution. He ships MVPs, closes handoff gaps, translates technical tradeoffs, and uses community insight to find needs before they become feature requests.",
    linkedin: "https://www.linkedin.com/in/singhavi279/",
    email: "t20avnish@gmail.com",
    accent: "signal-blue",
    photo: "/founders/avnish.jpeg",
  },
]
