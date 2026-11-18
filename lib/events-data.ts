/** Every Ambixous event, newest first. Drives both the /events listing and its Event JSON-LD. */
export type EventItem = {
  id: number
  title: string
  dateIso: string
  date: string
  time: string
  type: "Community" | "Corporate"
  mode: "Online" | "Offline"
  location: string
  attendees: number
  description: string
  speakers: string[]
  status: "Completed" | "Upcoming" | "Open" | "Limited Seats" | "Closed"
  registrationUrl: string
}

export const allEvents: EventItem[] = [
  {
    id: 10,
    title: "Tech Meetup: AI & Future Skills",
    dateIso: "2025-12-13",
    date: "December 13, 2025",
    time: "11:30 AM – 5:30 PM",
    type: "Community",
    mode: "Offline",
    location: "Times Internet, Noida",
    attendees: 263,
    description:
      "A 5-hour meetup combining hands-on AI workshops, HR panel discussions, keynote sessions and networking for professionals exploring practical AI and future skills.",
    speakers: ["Anand Gangadharan", "Varun Bhanot", "Sakshi Sunil", "Vikas Vats"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/tech-meetup-ai-future-skills",
  },
  {
    id: 9,
    title: "Women's Health Innovation Forum",
    dateIso: "2025-11-28",
    date: "November 28, 2025",
    time: "2:00 PM – 5:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "The Iconic Corenthum, Noida",
    attendees: 50,
    description:
      "An invitation-only forum bringing together gynaecologists, fertility specialists, innovators and women's health stakeholders for structured sessions on research, innovation and collaboration in maternity healthcare.",
    speakers: [
      "Dr. Bandana Sodhi",
      "Dr. Sweta Gupta",
      "Penzy Goyal",
      "Vikas Anand",
      "Malinie Arora",
      "Dr. Shazina Saeed",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/women-s-health-innovation-forum",
  },
  {
    id: 8,
    title: "AI-Driven Bootcamp: Roadmap to Certified QA Engineer feat. FAANG",
    dateIso: "2025-09-21",
    date: "September 21, 2025",
    time: "10:45 AM – Late Evening",
    type: "Community",
    mode: "Online",
    location: "Online",
    attendees: 228,
    description:
      "A 2-day virtual bootcamp on QA testing with hands-on bug hunting, live sessions and tools — led by engineers and architects from Microsoft, Amazon, Google and Deutsche Telekom.",
    speakers: ["Kaustubha V", "Sahil Kapoor", "Varun Bhanot", "Saket Gupta", "Arpan Garg"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/ai-driven-bootcamp-roadmap-to-certified-qa-engineer-feat-faang",
  },
  {
    id: 7,
    title: "Disrupting the Funnel: The Future of AdTech & Brand Marketing",
    dateIso: "2025-09-13",
    date: "September 13, 2025",
    time: "1:00 PM – 5:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "Noida",
    attendees: 121,
    description:
      "An afternoon of candid insights, proven playbooks and pitfalls to avoid from AdTech innovators and growth leaders on taking a brand from 0 → 1.",
    speakers: ["Shaweta Berry", "Rohit Kaul", "Rachita Gupta", "Sayantan Dasgupta"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/disrupting-the-funnel-the-future-of-adtech-brand-marketing",
  },
  {
    id: 6,
    title: "SkillUp Bootcamp",
    dateIso: "2025-08-02",
    date: "August 2, 2025",
    time: "10:30 AM – 4:00 PM",
    type: "Community",
    mode: "Offline",
    location: "Noida",
    attendees: 192,
    description:
      "A high-impact learning experience for developers, designers and tech professionals to upskill through live sessions with experts from Google, Deloitte, Policy Bazaar and Nagarro.",
    speakers: ["Varedh Nigam", "Nitasha Dhingra", "Sneha Swaroop", "Satendra Kumar"],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/skillup-bootcamp",
  },
  {
    id: 5,
    title: "AI for Social Good — WTM Google × Ambixous",
    dateIso: "2025-04-05",
    date: "April 5, 2025",
    time: "11:00 AM – 4:00 PM",
    type: "Community",
    mode: "Online",
    location: "LinkedIn Live",
    attendees: 80,
    description:
      "A WTM Google × Ambixous collaboration exploring how AI can drive social impact — through expert sessions, panel discussions and knowledge exchange.",
    speakers: [
      "Dolly Bhasin",
      "Yashaswini Viswanath",
      "Urooj Khan",
      "Kalyani R Kunche",
      "Kaustubha V",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/ai-for-social-good-wtm-google-x-ambixous",
  },
  {
    id: 4,
    title: "The Ambitious Women: Real Stories, Real Empowerment",
    dateIso: "2025-03-08",
    date: "March 8, 2025",
    time: "6:00 PM – 7:00 PM",
    type: "Community",
    mode: "Online",
    location: "LinkedIn Live",
    attendees: 300,
    description:
      "An International Women's Day LinkedIn Live — unfiltered conversations on women's empowerment, personal narratives and varied viewpoints celebrating ambition and progress.",
    speakers: [],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/the-ambitious-women-real-stories-real-empowerment",
  },
  {
    id: 3,
    title: "BRB: Boring Replaced by Bots",
    dateIso: "2025-03-01",
    date: "March 1, 2025",
    time: "1:00 PM – 4:00 PM",
    type: "Community",
    mode: "Offline",
    location: "RNI Park, IIT Delhi",
    attendees: 40,
    description:
      "A candid panel discussion exploring AI's influence on design — current trends, ethical challenges and its transformative impact on creative workflows.",
    speakers: [
      "Gaurav Gupta",
      "Sachin Rathi",
      "Varedh Nigam",
      "Shakti Arora",
      "Aryan Gupta",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/brb-boring-replaced-by-bots",
  },
  {
    id: 2,
    title: "Innovator's Meetup 2025",
    dateIso: "2025-02-09",
    date: "February 9, 2025",
    time: "11:00 AM – 2:00 PM",
    type: "Community",
    mode: "Offline",
    location: "ThoughtWorks, Gurugram",
    attendees: 140,
    description:
      "Empowering the next generation of innovators — bridging aspiring students and freshers with industry leaders through networking, mentorship and discussions on job readiness.",
    speakers: [],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/innovator-s-meetup",
  },
  {
    id: 1,
    title: "Founder's Day Meetup",
    dateIso: "2025-01-18",
    date: "January 18, 2025",
    time: "10:00 AM – 4:00 PM",
    type: "Corporate",
    mode: "Offline",
    location: "Microsoft Office, Gurugram",
    attendees: 480,
    description:
      "A celebration of Ambixous milestones with tech professionals, designers, founders and executives — emphasising innovation, collaboration and empowering women in tech.",
    speakers: [
      "Rudransh Agnihotri",
      "Abhishek Shankhdhar",
      "Anand Gangadharan",
      "Snigdha Kashyap",
      "Tushar Debnath",
      "Vineet Kumar Chirania",
      "Avni Srivastava",
      "Arpan Garg",
    ],
    status: "Completed",
    registrationUrl:
      "https://www.commudle.com/communities/ambixous/events/founder-s-day-meetup",
  },
]
