# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, served equally on the public site:

- **Creators, students and early-career professionals in India.** They join the free community, apply to the Creator Fellowship, and use ACE for mock interviews and resume reviews. A large share arrive on phones over mobile data, so weight and speed are part of the experience.
- **Brands, startups and corporates.** They hire the business arm (`/startups`) for events, product launches, employer branding, creator and social campaigns, LinkedIn content and web work, or host events with Ambixous. The community is their proof and their talent pool.

## Product Purpose

Ambixous is India's creator-entrepreneur community and growth studio, run by Ambixous Innovations LLP (LLPIN ACL-1668, Gurugram). Tagline: "Build. Connect. Grow. Together." Founders: Riti Gupta and Avnish Singh.

Two arms under one roof:

- **Community arm (non-profit, free for members):** the 5,000+ member network, 100+ mentors, live events, the Creator Fellowship cohorts, and ACE (free unlimited mock interviews and resume reviews at ace.ambixous.in).
- **Business arm (Ambixous Innovations LLP):** a growth studio delivering brand, creator-marketing, events and hiring work for startups and corporates.

Success means members join and show up, fellows complete cohorts and get hired, and brands start a conversation about a project or event.

## Positioning

The community builds the talent and the studio ships the work: client projects are executed by practitioners pulled from Ambixous's own community. Alongside that, it runs India's first Creator Fellowship, a 13-week cohort with real brand briefs and independent jury rounds. A neighbouring community has no studio; a neighbouring agency has no community.

## Operating Context

- Community members join through the open WhatsApp group. A separate Google Form (opened on docs.google.com, never embedded, because it requires Google sign-in) is the application to join the Ambixous team for internships and volunteering. Events are listed and registered on Commudle.
- Contact is by email (hi.ambixous@gmail.com), WhatsApp and LinkedIn; there is no in-site checkout, account system or CMS for visitors.
- Events are real-world and online: bootcamps, panels, founder meetups, corporate forums. Cohort 01 of the Fellowship ran Mar 29 to Jul 19, 2026 and has graduated.
- Certificates and PDF tools (`/certify`, `/pdfstudio`, `/invoxa`) are internal or utility surfaces behind the same domain.

## Capabilities and Constraints

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, shadcn-style UI in `components/ui`, fonts via `next/font` (Sora, Inter). Deployed on Vercel in the `bom1` region; canonical origin is `https://ambixous.in` (www redirects). Turso (libSQL) stores certificates and PDF Studio NPS; next-auth handles sign-in only on `/certify` and the graduation agreement. PDF Studio and Invoxa are static sub-apps served from `public/`.
- **Performance is a requirement, not a nicety:** Lighthouse Performance, Accessibility, SEO and Best Practices at 90 or above, LCP under 2.5 s, CLS under 0.1, judged for mobile data.
- **The community and ACE are free.** No paywall, premium tier or credit card; copy and design must never imply otherwise.
- **Numbers are verified against the live site (ambixous.in) before any page is edited**, never guessed or left stale. Current confirmed figures: 5,000+ members, 100+ mentors, 150+ hiring referrals, 50+ events hosted, 25+ corporate partners, 1,000+ lives impacted; Cohort 01 had 12 fellows, 12 mentors, 6 projects, 3 real brand briefs.
- **Per-page SEO/AEO must match what ships:** real title and description, full Open Graph, JSON-LD that mirrors the page (Event, Person, Course and FAQPage where they apply), updated in the same commit as any content change. Shared helpers live in `lib/site.ts` and `components/seo/json-ld.tsx`.
- **Undecided facts, do not invent:** the date, format and application process for Cohort 02; any pricing for the business arm's services.

## Brand Commitments

- Name: **Ambixous** (company: Ambixous Innovations LLP). Tagline "Build. Connect. Grow. Together."
- The Ambixous logo appears on every page, in the header and footer (`public/logo.webp`, rendered by `components/logo.tsx`; the original `logo.jpg` is still referenced by the Organization JSON-LD).
- Existing brand colours and type are defined in `tailwind.config.ts` and `app/layout.tsx` and are preserved as the incumbent system.

## Evidence on Hand

- 10 completed events with real dates, venues, attendance and speakers in `lib/events-data.ts`, mirrored on Commudle.
- 53 mentors with LinkedIn profiles in `lib/mentor-data.ts`; 12 Fellowship mentors and 12 fellows with photos under `public/creatorcohort/`.
- Six real testimonials from named speakers and panellists on the home page; a network of about 42 partner and employer names in the home and startups sections.
- Founders' photos and LinkedIn profiles in `lib/founders.ts`; a 1200x630 share image at `public/og.jpg`.
- **Absent, do not fabricate:** client case studies for the business arm, pricing, Cohort 02 details, fellow outcome data such as placements.

## Product Principles

1. **Two audiences, one front door.** Every public page lets a member and a brand each find their path in seconds, without one crowding out the other.
2. **Proof over promise.** Show real events, real mentors, real fellows and real numbers; leave a gap rather than invent one.
3. **Free means free.** Anything offered to members is presented without conditions, and the business arm is clearly its own thing.
4. **Light enough for a phone on mobile data.** Page weight, render-blocking resources and motion are budgeted before decoration.
5. **Keep the record honest.** Content, structured data and share previews describe the same current facts, and stale states (like a finished cohort) are updated, not left live.

## Accessibility & Inclusion

WCAG 2.2 AA is a hard requirement: semantic HTML and a logical heading order, alt text on every image, visible focus states, full keyboard operation, AA colour contrast (brand accents used as text on light surfaces use the darker `*-ink` tokens), and `prefers-reduced-motion` respected. The audience skews to students and early-career people on mid-range phones, so tap targets and text sizes must work on small screens.
