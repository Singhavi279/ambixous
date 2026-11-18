---
name: Ambixous
description: Build. Connect. Grow. Together. India's creator-entrepreneur community and growth studio.
colors:
  electric-ink: "#010409"
  cohort-ink: "#05070C"
  warm-white: "#F8F8F8"
  slate-gray: "#B0B0B0"
  light-ash: "#F0F0F0"
  white: "#FFFFFF"
  ambixous-neon: "#B4FF00"
  signal-blue: "#1FB6FF"
  sun-coral: "#FF6978"
  ambixous-neon-ink: "#547600"
  signal-blue-ink: "#00669A"
  sun-coral-ink: "#C42B40"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "6.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Sora, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Sora, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.32em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  hero: "32px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  section: "96px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.ambixous-neon}"
    textColor: "{colors.electric-ink}"
    rounded: "{rounded.md}"
    padding: "8px 24px"
    height: "40px"
  button-outline-pill:
    backgroundColor: "{colors.light-ash}"
    textColor: "{colors.electric-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  card-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.electric-ink}"
    rounded: "{rounded.xl}"
    padding: "32px"
  card-dark:
    backgroundColor: "{colors.electric-ink}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.xl}"
    padding: "24px"
  chip-neon:
    backgroundColor: "#F0FFCC"
    textColor: "{colors.ambixous-neon-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  header:
    backgroundColor: "{colors.electric-ink}"
    textColor: "{colors.warm-white}"
    height: "73px"
---

# Design System: Ambixous

## Overview

**Creative North Star: "The Night Studio"**

Ambixous looks like a creative studio working after hours: a near-black canvas (Electric Ink) with one light switched on, a neon lime that marks where to look and what to do next. Between dark stretches the page opens into pale light-ash sections, the daylight of the audience, where white cards carry the proof. The system is credible before it is playful: confident Sora type, hairline borders, real photographs of real people, and numbers that match the live site. It borrows editorial moves (very large, tightly tracked headlines, cinematic section transitions on the Fellowship page) without becoming a magazine.

It serves two audiences equally: students and creators on phones, and brands deciding whether to hire the studio. So every screen has to read in a glance on a mid-range phone over mobile data, and look like a practitioner-grade company on a client's laptop. Weight and speed are part of the look.

**Key Characteristics:**
- Dark canvas by default, pale light-ash sections for proof and information.
- One accent at a time: neon lime leads; blue and coral support.
- Display type is huge, heavy and tightly tracked; everything else is calm.
- Tactile controls: solid lime buttons that lift on hover, generous radii, real soft shadows on light cards.
- Accent colours are for fills, borders and large text; small text on light surfaces uses the darker ink variants.

## Colors

A dark ink canvas, a warm-white text colour, and a trio of saturated accents that only appear in small, deliberate doses.

### Primary
- **Ambixous Neon** (#B4FF00): the brand accent and the call to action. Primary buttons, active filter pills, status dots, highlighted numbers on dark, focus rings. On light surfaces it is a fill or a tint, never small text.

### Secondary
- **Signal Blue** (#1FB6FF): the second voice. Gradient partner to the neon, icons and secondary emphasis on dark, "online" and informational accents.

### Tertiary
- **Sun Coral** (#FF6978): the third voice. Used sparingly for warmth: corporate and "host an event" accents, occasional highlights.

### Neutral
- **Electric Ink** (#010409): the page canvas, header, footer and dark sections; also text colour on light surfaces and on lime buttons.
- **Cohort Ink** (#05070C): the Fellowship page's canvas, a near-identical ink hard-coded there.
- **Warm White** (#F8F8F8): primary text on dark.
- **Slate Gray** (#B0B0B0): secondary text on dark (9.5:1 on Electric Ink).
- **Light Ash** (#F0F0F0): the pale section background.
- **White** (#FFFFFF): cards on light sections.

### Accent Ink (text-safe on light surfaces)
- **Neon Ink** (#547600), **Blue Ink** (#00669A), **Coral Ink** (#C42B40): same hues, darkened to clear WCAG AA 4.5:1 on white, light-ash and the pale accent tints. They are applied automatically to accent text inside `.bg-white` and `.bg-light-ash`.

### Named Rules
**The One Light Rule.** One accent leads any given view. Neon is the action and the focus; blue and coral support it. If everything glows, nothing is the call to action.

**The Ink-On-Light Rule.** The bright accents never carry small text on white or light-ash (they fall to 1.2 to 2.8:1). Use the matching ink token for text and keep the bright value for fills, borders and large display type.

**The Opacity Floor Rule.** Muted text on dark is warm-white at 55% or more, or slate-gray at 80% or more, so it stays above 4.5:1. Anything fainter is decorative and must be hidden from assistive tech.

## Typography

**Display Font:** Sora (with a system sans fallback)
**Body Font:** Sora
**Label/Mono Font:** Sora; tabular figures for numbers

**Character:** One geometric sans carries everything, switching voice by weight, size and tracking: loud and tight at the top, quiet and open in the body. An Inter variable font is loaded (`--font-inter`) but body copy is set in Sora.

### Hierarchy
- **Display** (800, up to 100px, 1.0 line-height, -0.025em): hero headlines only. On the Fellowship page, `.font-editorial` pushes tracking to -0.04em.
- **Headline** (700, 36 to 48px, 1.1, -0.025em): section titles.
- **Title** (700, 30px, 36px line-height, -0.025em): card and block headings.
- **Body** (400, 16px, 24px): running text; keep lines to 65 to 75ch.
- **Lead** (400, 20px, 28px, slate-gray on dark): the sentence under a headline.
- **Label** (600 to 700, 10 to 12px, +0.32em, uppercase): section labels and meta. Informational labels should not drop below 12px on mobile.

### Named Rules
**The Tight Top Rule.** Tracking tightens as size grows (-0.025em at display, -0.06em on oversized numerals) and opens as size shrinks (+0.32em on labels).

**The Numerals Rule.** Counters and stats use tabular figures so they do not shift while counting up.

## Layout

A single centred container (`max-w-7xl`, 1280px) with responsive horizontal padding of 16 / 24 / 32 / 48px at the sm / md / lg breakpoints. Sections are tall (96px vertical padding), one idea per screen, alternating dark and light-ash backgrounds. Grids collapse from three columns to two to one; cards are equal-height within a row. The header is sticky (73px). Phones are the primary canvas: touch targets are at least 44px tall for primary actions and never below 24px, and horizontal scrolling is limited to deliberate carousels (testimonials).

## Elevation & Depth

A hybrid. On the dark canvas, depth is tonal and edge-based: translucent white fills (about 2 to 6% opacity) with hairline white borders (6 to 12%), plus a backdrop blur on the sticky header. On light sections, depth is a classic soft shadow under white cards that deepens on hover. Accent glows exist as a hover response on a few dark cards.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): white cards on light sections.
- **Card hover** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): lifted state, paired with a small upward translate.
- **Header** (`backdrop-filter: blur(4px)` on `rgb(1 4 9 / 0.95)` with a 1px `rgb(176 176 176 / 0.2)` bottom border): the sticky nav.
- **Accent glow** (`box-shadow: 0 0 20px rgb(180 255 0 / 0.15), 0 0 40px rgb(31 182 255 / 0.08)`): `.glass-card-glow` hover on selected dark cards.

### Named Rules
**The Lift On Response Rule.** Surfaces are still at rest; elevation increases only as a response to hover, focus or selection.

## Shapes

Soft and confident. The base radius is 12px (`--radius`), with 10px on buttons, 16px on cards, 32px on the Fellowship page's hero cards, and a full pill for chips, filters and status badges. Photographs of people sit in rounded squares (16px) rather than circles. Borders are hairlines on dark and absent on light cards.

## Components

Confident and tactile: buttons you can feel, cards that lift, real shadows on light, hairline glass on dark.

### Buttons
- **Shape:** gently rounded rectangle (10px); status and filter controls are full pills.
- **Primary:** Neon fill (#B4FF00) with Electric Ink text, 14px / 700, 8px 24px padding, 40px tall (44px minimum for card CTAs). Soft shadow at rest.
- **Hover / Focus:** a slight lift and a lime-tinted shadow or a 90% fill; focus is a visible 2px ring with offset, never removed.
- **Outline / Ghost:** transparent with a 2px accent border (blue or coral on light cards) that fills on hover, switching text to Electric Ink.

### Chips
- **Style:** pill (9999px), 12px text, pale accent tint fill with the matching ink-colour text (for example #F0FFCC with Neon Ink).
- **State:** filter pills expose `aria-pressed`; the selected pill is solid Neon with ink text.

### Cards / Containers
- **Light card:** white, 16px radius, 32px padding, Card rest shadow, hover lift (`-translate-y-1`) and a deeper shadow.
- **Dark card:** translucent white fill on Electric Ink, 1px hairline border at 6 to 12% white, 16px radius, optional accent glow on hover.
- **Nesting:** cards are not nested inside cards.

### Inputs / Fields
- **Style:** pill (9999px), translucent white fill on dark with a hairline border, Warm White text, slate-gray placeholder.
- **Focus:** the border shifts to Neon with a 2px Neon ring at 60% (`focus-visible` only).
- **Labels:** every control has an accessible name even when the visible label is an icon.

### Navigation
- **Style:** sticky Electric Ink bar (73px) with the logo left, centred text links in Warm White, and a Neon "Join Community" button right.
- **States:** hover and active shift toward Neon; a "Skip to content" link is the first focus stop; on mobile the links collapse into a menu.

### Logo
The Ambixous wordmark sits in the header and footer of every page, linked to home with a visible focus ring. It is `public/logo.webp`; it preloads only in the header.

### Stat Counter (signature)
Large tabular numerals in an accent colour over a short label. The real value is in the server HTML; the count-up runs only once the number scrolls into view and never for reduced-motion users.

## Do's and Don'ts

### Do:
- **Do** let one accent lead each view; neon marks the action and focus.
- **Do** use Neon Ink, Blue Ink and Coral Ink for any accent-coloured text smaller than large display on white or light-ash.
- **Do** keep muted text on dark at 55% warm-white or slate-gray at 80% or above.
- **Do** keep every informational label legible on a phone (12px or larger) and every primary tap target at least 44px tall.
- **Do** keep the real figure in the markup for any animated number, and honour `prefers-reduced-motion`.
- **Do** keep numbers, dates and facts identical to the live site, and update the page's metadata and JSON-LD in the same change.
- **Do** put the Ambixous logo on every page, in the header and footer.

### Don't:
- **Don't** set bright Neon, Blue or Coral as small text on white or light-ash.
- **Don't** nest a button inside a link (or the reverse); use one interactive element.
- **Don't** nest cards inside cards.
- **Don't** hide the focus ring; `focus-visible` styling is required on every interactive element.
- **Don't** add decorative weight on mobile: unoptimised hero images, extra web fonts, or third-party embeds that load before they are asked for.
- **Don't** invent proof: no placeholder logos, quotes, case studies or statistics.
