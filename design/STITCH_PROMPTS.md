# Google Stitch prompts — English Mania (8 pages)

How to use: open Stitch → upload/paste `DESIGN.md` first (or paste its contents
at the top of your first prompt) so the design system is set before generating
any screen. Then run each prompt below one at a time, generating both mobile
and desktop. Keep every screen's session/thread continuous — don't start a new
Stitch project per page, or you lose the shared design system context.

## What to get back from Stitch (don't skip this)

These designs exist to feed the real Astro codebase already scaffolded at
`web/src/`, not to sit as pictures. Every prompt below ends with an **"Export
requirement"** line — don't drop it when you paste into Stitch. It tells
Stitch to:

1. **Export actual HTML + CSS**, not just a screenshot/Figma link — Stitch
   supports HTML/CSS export directly.
2. **Reuse the exact class names already defined in `web/src/styles/global.css`**
   (`.container`, `.card`, `.btn`, `.btn-line`, `.badge`, `.section`,
   `.section-yellow`) instead of inventing new ones. If the output uses these
   names, you can copy the HTML structure straight into the matching
   `.astro` file and it'll pick up the existing styling with near-zero
   translation work. If Stitch invents its own class names instead, someone
   has to manually map every one of them back — avoidable busywork.
3. After all 8 pages are generated, ask Stitch to **export its own
   `DESIGN.md`** (it has this as a built-in feature) and sanity-check it
   against `design/DESIGN.md` in this repo — if the two drifted (e.g. Stitch
   quietly picked a different red), that's a sign a generation ignored the
   uploaded system file and should be redone.

Class name reference (already implemented in code, don't rename):

| Element | Class(es) |
|---|---|
| Page content wrapper | `.container` |
| White rounded card | `.card` |
| Primary red button | `.btn` |
| LINE-green booking button | `.btn.btn-line` |
| Small colored pill label | `.badge` |
| Page section wrapper | `.section` |
| Section with light-gray background | `.section.section-neutral` |
| Section with yellow background (sparse accent — max once per page) | `.section.section-yellow` |

## Visual direction reminder: clean + minimal, with flair

Updated 2026-08-08 after reviewing apple.com/th, apple.com/th/mac, and
apple.com/th/retail/iconsiam directly. Every prompt below now assumes:

- **Big whitespace** — generous vertical padding between sections, one idea
  per section, don't cram.
- **White/light-gray is the default background**, not brand yellow. Yellow
  (`--em-yellow`) shows up **once per page at most** as a deliberate accent
  (usually the hero) — everywhere else uses white or `--em-neutral-bg`
  (`#f5f5f7`).
- **Large, bold, centered headline type** per section, short supporting line,
  minimal extra copy.
- **Flat, understated cards** — light border/subtle shadow, not a heavy drop
  shadow.
- Full details in `DESIGN.md`'s "Visual direction" section — treat it as
  authoritative over anything conflicting below.

---

## 1. Home

```
Design a mobile-first homepage for a Thai English-tutoring business website.
Clean, minimal, whitespace-driven style — think apple.com/th's homepage
rhythm (huge section padding, one big bold centered idea per section, flat
understated cards) — expressed through this brand's yellow #fada56 / red
#e5402d colors used SPARINGLY as accents, not as full section fills. Follow
DESIGN.md's "Visual direction" section exactly. Thai copy throughout.

Sections top to bottom:
1. Header: white/light background, thin bottom border (not a colored band).
   Logo left (modest size, don't blow it up), small nav links (คอร์สเรียน /
   เวิร์กช็อป / บทความ / เกี่ยวกับเรา / คำถามที่พบบ่อย / ติดต่อเรา), a LINE-green
   pill button "จองผ่าน LINE" on the right.
2. Hero — the ONE deliberate yellow-background moment on this whole page,
   generous vertical padding (~7rem), centered: big bold heading "English
   Mania by KruYam", one short subheading line "วิธีที่ดีที่สุดในการทำนายอนาคตก็คือ
   การสร้างมันขึ้นมาเอง", one red pill CTA button "Booking Now". Nothing else in
   this section — resist adding more.
3. "โปรโมชั่นตอนนี้" section (white background, large section padding): a
   responsive grid of promo cards — flat, light border, not heavy shadow —
   each with a small red "โปรโมชั่น" badge, bold price in large text, short
   description, LINE-green "จองผ่าน LINE" button. Example card: "เรียนภาษาอังกฤษ
   Online ตัวต่อตัว 4 ชั่วโมงเต็ม" / "990 บาท".
4. "บริการของเรา" section (light-gray #f5f5f7 background — the neutral
   "second" tone, not yellow): 4-column grid (stacks to 1 column mobile) of
   flat service cards — เช่าห้องสอน/ประชุม, เรียนกลุ่มที่สถาบัน, เรียนพิเศษตัวต่อตัว,
   เรียนออนไลน์ — each a simple card with a short description.
5. "เสียงจากผู้ปกครองและนักเรียน" testimonials section (white background —
   NOT yellow again, yellow was already used once in the hero): grid of
   quote cards with parent name and short Thai quote.
6. Footer (dark ink #2b2b2b background, white text): company name "บริษัท
   อิงลิช เมเนีย จำกัด", registration number, address, phone, Facebook + LINE
   OA links.

Export requirement: output real HTML + CSS (not just an image), reusing these
exact class names — .container, .card, .btn, .btn-line, .badge, .section,
.section-neutral, .section-yellow (hero only) — for the matching elements
above instead of inventing new class names.
```

## 2. Services (คอร์สเรียน)

```
Following DESIGN.md (clean, minimal, generous whitespace, flat cards, white/
light-gray backgrounds — see Visual direction), design a services/course-
listing page. Header + footer same as the home page.
Page heading: "คอร์สเรียน / บริการ".
Below it, a responsive grid (2 columns desktop, 1 column mobile) of 4 white
rounded cards, one per service, each with a heading and 2-3 lines of Thai
description:
- เช่าห้องสอน/ประชุม — ห้องเรียนคุณภาพสูง แอร์ กระดานอัจฉริยะ โสตทัศนูปกรณ์ครบ
- เรียนกลุ่มที่สถาบัน — หลักสูตรออกแบบโดยผู้เชี่ยวชาญ เรียนร่วมกับเพื่อนๆ
- เรียนพิเศษตัวต่อตัว — ปรับให้เข้ากับรูปแบบการเรียนรู้และเป้าหมายของเด็กแต่ละคน
- เรียนออนไลน์ — ยืดหยุ่นเรื่องเวลา/สถานที่ ผ่าน Google Meet
Keep it simple and scannable — parents skimming on mobile.

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .section, .section-yellow — don't invent new class names
for these repeating elements.
```

## 3. Workshops (เวิร์กช็อป & กิจกรรม)

```
Following DESIGN.md (clean, minimal, generous whitespace — see Visual
direction), design a workshops/events listing page — this is the most
important NEW page (didn't exist on the old site), and the best opportunity
for the "full-bleed photography" treatment mentioned in DESIGN.md (like
apple.com/th/retail's store photography) since real workshop photos exist.
Header + footer same as home.
Page heading: "เวิร์กช็อป & กิจกรรม", subheading note "ที่นั่งจำกัด จองผ่าน LINE
เท่านั้น".
Grid of event cards (2 columns desktop, 1 mobile), each card needs:
- Cover image area, full-bleed within the card (edge-to-edge photo, not
  padded/inset) — this is the visual centerpiece of each card
- Title, e.g. "Insect Pinning Workshop (English program)"
- A small red "ที่นั่งจำกัด X ที่" badge — urgency/scarcity, this matters for
  conversions
- Date/time line
- Price, large and bold
- A LINE-green pill button "จองผ่าน LINE" — this is the ONLY way to book, make
  it prominent, not a secondary action
Also design an empty state: centered message "ยังไม่มีเวิร์กช็อปที่เปิดจองตอนนี้
ติดตามได้ทาง Facebook" for when there are no active workshops.

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .btn, .btn-line, .badge, .section — don't invent new class
names for these repeating elements.
```

## 4. Blog index (บทความ)

```
Following DESIGN.md (clean, minimal, generous whitespace — see Visual
direction), design a simple blog/article index page. Header + footer same as
home.
Page heading: "บทความ".
Grid of article preview cards (3 columns desktop, 1 mobile): cover image,
title, 1-2 line excerpt. Clean, minimal — this section is new/low-traffic
content, don't over-design it.
Also show an empty state: "ยังไม่มีบทความในตอนนี้" for when there are no posts
yet (accurate to current launch state — no blog content exists yet).

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .section — don't invent new class names for these
repeating elements.
```

## 5. Blog post detail

```
Following DESIGN.md, design a single article/blog post detail page.
Header + footer same as home.
Simple readable article layout: large title, then body text in a comfortable
reading width (max ~700px, centered) with generous line-height for Thai text.
Support inline images and subheadings within the body.

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .section — don't invent new class names.
```

## 6. About (เกี่ยวกับเรา)

```
Following DESIGN.md (clean, minimal, generous whitespace — see Visual
direction), design an About page. Header + footer same as home.
Page heading: "เกี่ยวกับเรา" — large, bold, centered, Apple-scale hero type.
Intro paragraph (Thai): "ค่าเรียนเป็นมิตร ไม่คิดราคาศัตรูแน่นอน เพราะเราเข้าใจการเรียน
ภาษาต้องใช้เวลา เราจึงทำค่าเรียนให้เหมาะสม เพื่อส่งลูกมาได้จนสามารถประสบความสำเร็จใน
การสื่อสาร เรียนสนุก เข้าใจง่าย ตรงประเด็น เดินทางสะดวกด้วย MRT ตลาดบางใหญ่ ตรงข้าม
เซ็นทรัลเวสเกต".
Below: a 4-column stat grid (stacks to 2x2 on mobile), each a white rounded
card with a big bold number and short label:
- "7+ ปี" / ประสบการณ์การสอน Online และ Onsite
- "100+ รางวัล" / จากการแข่งขันและสอบเข้า
- "2,000+ ครอบครัว" / เสียงตอบรับที่ชื่นชอบ
- "50+ ทีมงาน" / ติวเตอร์มืออาชีพ

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .section — don't invent new class names for the stat
cards.
```

## 7. FAQ (คำถามที่พบบ่อย)

```
Following DESIGN.md (clean, minimal, generous whitespace — see Visual
direction), design an FAQ page. Header + footer same as home.
Page heading: "คำถามที่พบบ่อย".
A vertical stack of white rounded question cards. Each card: bold question
line, then answer text below it (either always-expanded, simple stacked cards
— not necessarily an accordion, keep it simple). Example: "เดินทางมาเรียนที่
สถาบันสะดวกไหม?" / "เดินทางสะดวกด้วย MRT ตลาดบางใหญ่ ตรงข้ามเซ็นทรัลเวสเกต".

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .section — don't invent new class names for the FAQ
cards.
```

## 8. Contact (ติดต่อเรา)

```
Following DESIGN.md (clean, minimal, generous whitespace — see Visual
direction), design a contact page. Header + footer same as home.
Page heading: "ติดต่อเรา".
Two-column layout on desktop (stacks to 1 column mobile):
Left column: phone number, address, a prominent LINE-green "แชทผ่าน LINE"
button, and a Google Maps embed below it (rounded corners, matches card
style).
Right column: a contact form card (white rounded card) with fields ชื่อ,
เบอร์โทร, อีเมล, ข้อความ (textarea), a Cloudflare Turnstile "I'm not a robot"
widget placeholder above the submit button, then a red pill submit button
"ส่งข้อความ".

Export requirement: output real HTML + CSS (not just an image), reusing
.container, .card, .btn, .btn-line, .section — don't invent new class names.
Keep form field names as name="name", name="phone", name="email",
name="message" — these map directly to the existing contact form handler.
```
