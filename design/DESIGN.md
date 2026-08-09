# DESIGN.md — English Mania brand & UI system

Paste this file into Google Stitch first (or reference it in every prompt) so
all 8 page designs stay visually consistent instead of drifting in
color/style generation-to-generation. This mirrors the CI already locked into
the codebase (`web/src/styles/global.css`) — designs should match code, not
invent a new look.

## Brand identity (do not change — CI decision, already final)

- **Logo**: yellow circle background with a red speech-bubble containing
  "ENGLISH MANIA" in bold white type, "by KruYam" in smaller white script
  underneath. Playful, rounded, approachable — speaks to parents and kids, not
  a corporate/enterprise audience.
- **Business**: English Mania by KruYam — Thai English-language tutoring
  business (also math/science tutoring), in-person classes in Bang Yai/Bang
  Bua Thong, Nonthaburi + online via Google Meet + seasonal kid-focused
  workshops (e.g. insect science workshops).
- **Tone**: warm and family-friendly, but expressed through **clean, minimal,
  confident** design rather than busy/colorful chrome — think a tutoring
  business that takes itself seriously about quality, not a kids' party flyer.
  Friendliness comes from photography (real kids, real classes) and language,
  not from filling every section with brand color.
- **Language**: primary content is Thai (Th script). Provide Thai as the
  actual copy in mockups, not lorem ipsum or English placeholders — the site
  is Thai-first.

## Visual direction: clean + minimal, with flair (Apple-inspired)

Reference: apple.com/th, apple.com/th/mac, apple.com/th-edu/store,
apple.com/th/retail/iconsiam — screenshotted directly as of 2026-08-08 to
ground this in the real current site, not a vague impression of "Apple
style." Concrete patterns to borrow:

- **Whitespace is the main design tool.** Huge vertical padding between
  sections (think 96-160px, not 24-48px). One idea per section, lots of
  breathing room around it — not five things crammed into one screen.
- **One giant, bold, centered headline per hero/section**, with a single
  short supporting line underneath (one sentence, not a paragraph), then at
  most 1-2 buttons. Resist the urge to add more copy.
- **Base backgrounds are white or very light neutral gray (`#f5f5f7`-ish),
  not brand yellow.** Brand yellow (`--em-yellow`) becomes an **accent used
  sparingly** — a highlight tag, one hero band max per page, not the default
  section background every-other-section like the original CI direction
  implied. Brand red stays for CTAs/links/badges as before.
- **Full-bleed, high-quality photography sections** — real photos of classes,
  workshops, the physical space (once available) treated as the visual
  centerpiece of a section, edge-to-edge, no card frame around them.
- **Flatter cards** — light border or very subtle shadow instead of the
  heavier drop-shadow originally specified. Rounded corners stay (matches
  both the existing CI and Apple's own product tiles), but the elevation
  should read as understated, not "sticker on a page."
- **Pill-shaped buttons stay** (this already matched Apple's own button
  style) — solid red fill as primary, thin red outline as secondary, same
  pattern Apple uses with solid-blue-fill + outline pairs.
- **Minimal nav** — small text links, thin bottom border or none, no heavy
  colored nav bar filling the top of every page (the original "yellow header
  band" idea is out; keep the header white/light, logo mark modest-sized).
- Motion is optional flair, not required: subtle fade/slide-in on scroll for
  section reveals is fine if Stitch can express it, but don't chase parallax
  gimmicks — restraint over cleverness.

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `--em-yellow` | `#fada56` | Sparse accent only now — a highlight badge, a small illustrative shape, at most one hero band. NOT the default section background. |
| `--em-red` | `#e5402d` | Primary CTA buttons, badges, links, accents |
| `--em-red-dark` | `#c9301f` | Button hover/pressed state |
| `--em-ink` | `#2b2b2b` | Body text, footer background |
| `--em-neutral-bg` | `#f5f5f7` | New — default light section background, Apple-style, replaces yellow as the "second" section tone |
| `--em-white` | `#ffffff` | Cards, negative space, default page background |
| LINE green | `#06c755` | LINE OA booking buttons specifically — always this exact green, never the red brand color, so it visually reads as "LINE" at a glance |

**Decision (2026-08-08, after reviewing Stitch output):** every generated screen invented its
own Material-You `tertiary` blue family (`#006385`, `#007da8`, `#78d1ff`, etc.) that has no basis
in this brand. Confirmed with the user: **strip it entirely when porting to Astro** — use only the
7 tokens above, nothing else. Also note Stitch's `primary`/`secondary-container` values
(`#b51c0f`, `#fede5a`) are close-but-not-exact to `--em-red`/`--em-yellow` — port using the exact
hex from this table, not whatever Stitch generated.

## Typography

- Thai + Latin: "Prompt" or "Noto Sans Thai", geometric sans-serif.
- **Headings: very large and bold** (heavier weight, bigger size than a
  typical business site — Apple-scale hero type), but centered/confident
  rather than "playful bouncy" — the warmth now comes from photography and
  word choice, not from exaggerated rounded typography.
- Body text: smaller, restrained, generous line-height — let the headline do
  the work, keep supporting copy short.

## Layout rules

- Max content width ~1100px, centered, generous side padding on mobile —
  but push section vertical padding much larger than a typical template
  (see Visual direction above).
- Cards: white background, rounded corners (16px radius), light border or
  subtle shadow (not heavy drop-shadow) — flatter than the original spec.
- Buttons: fully rounded (pill-shaped), red fill + white text as primary,
  thin red outline as secondary; LINE-green pill for any "book via LINE"
  action specifically.
- Section backgrounds alternate between white and `--em-neutral-bg`
  (`#f5f5f7`) as the default rhythm — save `--em-yellow` for one deliberate
  accent moment per page (e.g. a single promo callout), not the default
  "every other section" treatment from the original CI-only direction.
- Mobile-first — most traffic from parents on phones. Design mobile frames
  first, then desktop.

## Site structure (8 page templates — design all of them)

1. Home
2. Services (course listing)
3. Workshops (limited-seat events)
4. Blog index (article list)
5. Blog post (article detail)
6. About
7. FAQ
8. Contact

See `STITCH_PROMPTS.md` in this folder for one ready-to-paste prompt per page.
