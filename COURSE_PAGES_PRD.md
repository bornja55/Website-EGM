# PRD: Course/Promotion/Workshop Product Pages (Apple-style)

**Status**: Draft
**Author**: Siraphob (with Claude, via `/grill-me`)
**Date**: 2026-08-13
**Parent doc**: `PRD.md` (original 8-page site rebuild — this is a scope addition on top of it,
same as `/team` was)

---

## Problem

The site currently has no dedicated page for the business's 9 real named/priced courses. They're
buried as a 3-column card grid on the homepage ("ข้อเสนอพิเศษ"), sourced from the `promotions`
collection — which also mixes in genuinely time-limited offers (currently just the 990฿ online
1:1 promo). There's no way to link directly to one course, no SEO-friendly per-course landing
page for the social ads the business already runs, and no page for the 2 real workshops beyond a
shared index card grid.

Visually, `/services` (the closest thing to a course page today) is a flat bento grid of small
cards — a "just a template" layout, not the confident, photography-led, one-idea-per-section feel
DESIGN.md's Apple-inspired direction calls for elsewhere on the site.

## Reference

apple.com/th/mac-studio — one product, several full-width sections stacked vertically, each
pairing a large real photo with a short bold headline + one supporting line. **Explicitly not**
wanted: Apple's scroll-triggered zoom in/out effect. Also referenced: the "Mac" mega-menu on
apple.com/th (hover dropdown, columns of individual product names grouped by shopping intent) —
see "Navigation" below.

## Goals

- Every real course, promotion, and workshop gets its own page, styled like an Apple product
  page section (big real photo + short headline/tagline + price/schedule + LINE booking CTA), no
  scroll zoom gimmick.
- One consistent content model and page template across all three types — a promotion is not a
  second-class citizen with a worse page than a course.
- A mega-menu under the header's course nav item that lets a parent jump straight to the exact
  course they're looking for, filterable by subject / grade level / exam type / workshop, without
  forcing every course into a single rigid category.
- Landing pages good enough to run paid social ads against directly (proper per-page OG tags +
  structured data), since that's how this business actually drives traffic today.
- Confirm the current 9-course catalog is still accurate before building on top of it (checked
  against both the old live site and the Facebook Page — see "Content audit" below).

## Non-goals

- No custom admin UI for editing menu/course content — PocketBase's existing Admin UI
  (`/_/`) already covers this; building a bespoke CMS page would contradict PRD.md's
  explicit "no non-dev CMS users, edits via code" secondary-user framing.
- No expansion of the course catalog to fill every theoretical cell of the subject × grade ×
  exam-type taxonomy (e.g. inventing a dedicated TOEIC or IELTS course page that doesn't exist
  yet). The mega-menu only links to real, existing content — nothing fabricated.
- No exhaustive archive of every course-shaped Facebook post since 2018. Time-boxed promos found
  in that history (e.g. a "เทอม 2/67" seasonal promo from 2024) are treated as `promotions`-style
  content if/when still relevant, not folded into the evergreen `courses` catalog.
- No redesign of `/services` (the 17-row subject/category catalog) — it stays as-is, just gets
  its nav label corrected (see "Navigation").

## Content audit (done during grill session, 2026-08-13)

- Old site's `/course` listing (`ballevrtgab.makeweb.co/course`) matches the current 9 courses in
  `pocketbase/seed.mjs` exactly — no courses missing, none extra.
- One extra link found embedded in that page's pagination markup
  (`summer-68-primary-course-8-10-allday`) resolves to a 404 on the live old site — a deleted
  product, not a real 10th course. Excluded.
- Checked the Facebook Page (facebook.com/englishmaniaofficial, 19K followers) directly — found
  additional course-shaped promo posts in the post history (e.g. "คอร์สเรียนล่วงหน้า เทอม 2/67",
  Aug 2024, since expired). These are seasonal/time-boxed, not part of the evergreen catalog, and
  are out of scope for this pass — see Non-goals.
- **Action for implementation**: for each of the 9 courses, re-derive the authoritative
  title/price/schedule/description from that course's own Facebook post (not just the old site's
  text) per Siraphob's instruction — the FB post is the source of truth even when the photo ends
  up being the same one already on the old site.

## Users

Same as `PRD.md` — primary: parents/students arriving via Google, Facebook, or a paid social ad
click, deciding whether to book via LINE. This work specifically optimizes for the paid-social-ad
entry point, which the general 8-page scope didn't account for.

## Requirements

### Data model

Three separate PocketBase collections, one per content type — kept separate because each has
different lifecycle/fields, but sharing a common field shape so they render through the same
page template:

**`courses`** (new collection — the 9 real named/priced courses currently living in
`promotions`, migrated out)
- `title` (text, required)
- `slug` (text, required, unique)
- `tagline` (text) — one short line for the hero, e.g. "เรียนกับเจ้าของภาษาทุกวันอาทิตย์"
- `price` (number)
- `duration` (text) — e.g. "64 ชม."
- `schedule` (text) — e.g. "เสาร์ 10:00-15:00 น."
- `description` (editor) — longer detail-page copy, rewritten for readability, not just the old
  crammed one-liner
- `image` (text, path under `web/public/images/courses/`)
- `tags` (select, multiple) — see "Tag vocabulary" below
- `sort_order` (number)
- `is_active` (bool)
- `line_link` (url)
- `created`/`updated` (autodate, per the existing project pattern)

**`promotions`** (existing collection, trimmed down to genuinely time-limited offers — currently
just the 990฿ online 1:1 promo)
- Same shape as `courses` above, plus `valid_until` (date). No `tags`/mega-menu presence unless a
  specific promo is deliberately surfaced there later — promotions are inherently temporary, the
  mega-menu is not the primary place users find them (the homepage callout is).

**`workshops`** (existing collection, extended — currently just Insect Pinning Workshop; add
STEM Workshop as its sibling in this same pass)
- Already has `slug` (unused for routing today) — this project is what finally uses it.
- Add `tagline` field to match the shared shape (currently only has `description`).
- Keep existing `seats_total`/`event_date`/`cover_image` — workshop-specific, not shared.

**Tag vocabulary** (on `courses` only, multi-select, one course can carry several):
- รายวิชา: `ภาษาอังกฤษ`, `คณิตศาสตร์`, `วิทยาศาสตร์`, `ภาษาญี่ปุ่น`
- ชั้นปี (fine-grained per course's real coverage, not banded): `อ.3`, `ป.1`...`ป.6`, `ม.1`...`ม.6`
  — a course spanning a range (e.g. "เพิ่มเกรด (ส-อา)" = อ.3-ป.6) gets every grade in that range
  tagged individually.
- ติวสอบ: `ติวสอบเข้า ม.1`, `TGAT & A-Level` (only real, existing exam-prep courses — no
  placeholder TOEIC/IELTS tag until a real course exists for it)
- รูปแบบ: `ตัวต่อตัว` (cuts across subjects — "คอร์สออนไลน์ตัวต่อตัว" carries this alongside
  whatever subject tags apply)

### Pages

- `/course` — index/listing page. Grid of course cards (photo + title + tagline + price), each
  linking to its own detail page. Chosen over a single long scrolling page specifically because
  Siraphob wants painless add/remove of individual courses over time.
- `/course/[slug]` — one Apple-product-page-style page per course. Large real photo, bold
  headline, one-line tagline, price/duration/schedule, LINE booking CTA. No scroll zoom effect;
  subtle fade/slide-in on scroll is fine per DESIGN.md, nothing more.
- `/promotions/[slug]` — same template as course detail, plus a "valid until" note.
- `/workshops/[slug]` — same template as course detail, plus seats-remaining badge and event
  date. `/workshops` index stays as the existing card-grid listing, now linking into real detail
  pages instead of dead-ending.

### Navigation

- Existing header link **"คอร์สเรียน" (currently → `/services`) renamed to "บริการ"** — it was
  always the subject/category catalog, not the named courses; the two were sharing one label by
  accident.
- New header item **"คอร์สเรียน"** with an Apple-style mega-menu dropdown (hover-triggered on
  desktop), grouped into columns: รายวิชา / ชั้นปี / ติวสอบ / Workshop. Each column lists the
  real course/workshop titles carrying that tag, as direct links to their own detail page —
  mirroring how Apple's "Mac" menu lists actual product names, not just category links. A column
  with zero matching real content is omitted rather than shown empty.
- Mobile behavior: **open question, see below** — hover dropdowns don't translate directly to
  touch; header currently has no mobile nav pattern at all (flat flex row, no hamburger).

### SEO / paid social readiness

- `BaseLayout.astro` currently renders `<title>`, meta description, and a `LocalBusiness`
  JSON-LD block only — **no Open Graph or Twitter Card tags exist anywhere on the site today**.
  Add an `image` prop to `BaseLayout`, render `og:title`, `og:description`, `og:image`, `og:url`,
  `twitter:card` from it.
- Every course/promotion/workshop detail page passes its own title/description/image into
  `BaseLayout` — so a shared Facebook ad link shows that item's real photo and price in the link
  preview, not a generic fallback.
- Add `schema.org/Course` JSON-LD per course detail page, alongside the existing `LocalBusiness`
  block.

### Admin / content editing

- No custom admin page. PocketBase's built-in Admin UI (`http://127.0.0.1:8090/_/`) is sufficient
  for adding/editing/removing courses, promotions, and workshops — free, already exists, already
  used in this project to debug the seed error last session.

## Open questions

- **Mobile mega-menu pattern** — not yet decided. Options to resolve during implementation:
  collapse to an accordion under a hamburger, or skip the mega-menu on mobile entirely and just
  link "คอร์สเรียน" straight to the `/course` index page (parents mostly browse the flat list on
  phones anyway). Needs a decision before the header work starts.
- **Photo-to-course matching** — OneDrive `.../Web/คอร์ส/` folder and the FB raw export both have
  usable images, loosely named (some map 1:1 by filename, e.g. `native.jpg`, `tgat2.jpg`, most
  don't). Needs a manual matching pass per course during implementation; anything with no
  confident match falls back to a general classroom/tutoring photo rather than guessing.
- **Per-course FB post sourcing** — re-deriving price/schedule/description from each course's own
  Facebook post (per Siraphob's instruction) requires locating that specific post per course;
  not yet done, planned as part of implementation, not this planning pass.
- **git workflow blocker (unrelated to this feature, pre-existing)** — the mounted project
  drive doesn't support git's file-locking operations from inside the agent sandbox
  (`.git/index.lock` can be created but not removed once git leaves it behind mid-operation).
  All commits/pushes for this project have to run from Siraphob's own machine. Not a blocker for
  planning or file edits, only for git operations specifically.

## Out of scope (this pass)

Full historical Facebook audit for additional evergreen courses, TOEIC/IELTS dedicated course
pages (no real course exists for them yet), custom admin UI, `/services` redesign, mobile nav
overhaul beyond what the mega-menu strictly requires.
