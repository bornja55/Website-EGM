# PRD: Course/Promotion/Workshop Product Pages (Apple-style)

**Status**: Phase 1 implemented (code complete, 2026-08-13) — see "Phase 1 implementation notes"
at the end of this doc for what's done vs. what Siraphob still needs to run. Phases 2-3 not
started.
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
- No redesign of `/services` (the 17-row subject/category catalog) — it stays as-is structurally,
  just gets its nav label corrected (see "Navigation") **and its own on-page title/hero heading
  updated from "คอร์สเรียน / บริการ" to "บริการ" alone** (caught in `/scrutinize`: leaving the old
  wording would make the page contradict the renamed nav link pointing at it).

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
- Same shape as `courses` above, **including `slug` (required, unique)** — missed in the first
  draft of this PRD, caught in a second `/scrutinize` pass: without it `/promotions/[slug]`
  cannot work, the collection had no slug field at all before this project. Plus `valid_until`
  (date). No `tags`/mega-menu presence unless a specific promo is deliberately surfaced there
  later — promotions are inherently temporary, the mega-menu is not the primary place users find
  them (the homepage callout is).

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
  whatever subject tags apply) — **gets its own "รูปแบบ" column in the mega-menu**, see
  Navigation below (caught in `/scrutinize`: this tag had nowhere to render before).

PocketBase's `select` field type has no notion of "tag group" — the mega-menu's column grouping
(which tags belong under รายวิชา vs. ชั้นปี vs. ติวสอบ vs. รูปแบบ) has to be a hard-coded lookup
table in the Header/mega-menu component, matching each tag string against one of these four fixed
lists. Keep that table colocated with the tag vocabulary above so they can't drift apart.

### Live data migration (added after `/scrutinize`, 2026-08-13)

**Confirmed with Siraphob: the PocketBase reseed from the previous session did succeed** —
`pb_data` is live with all 9 courses already inserted as `promotions` records, tutors, the 5
reviews, etc. (HANDOFF.md's blocker was real at the time but resolved before this session; just
never reported back). This means creating the `courses` collection is **not** a fresh-seed
situation — it requires actually moving live records, not just writing new schema + editing
`seed.mjs`.

Plan: `pb_migrations/4_add_courses_and_split_fields.js` handles schema only (new `courses`
collection with `slug`, `tagline`/`duration`/`schedule`/`slug` added to `promotions`, `tagline`
added to `workshops`) — consistent with this project's existing pattern of schema-only
migrations.

**Required order (added after 2nd `/scrutinize` pass — this wasn't sequenced before):**
1. Migration 4 applies (schema only, no data touched).
2. **Per-course Facebook post sourcing happens first** (see Open Questions) — the real
   tagline/duration/schedule/tags values for all 9 courses must exist before the next step, since
   the migration script needs real values to write, not placeholders.
3. Only then is `pocketbase/migrate-courses.mjs` written and run — a **one-off, two-phase**
   script (same plain-fetch style as `seed.mjs`):
   - **Phase 1**: create all 9 records in `courses` with their real field values. Verify the
     PocketBase response confirms all 9 were created successfully (check response count/IDs, not
     just "no fetch error").
   - **Phase 2**: only after Phase 1 is fully confirmed, delete the 9 original course-shaped
     records from `promotions`.
   - Never interleave create-then-immediately-delete per record — if the script dies partway
     through Phase 1, nothing has been deleted yet and it's safe to just fix and re-run.
   - **Before running against live data**: Siraphob should copy `pocketbase/pb_data/` somewhere
     safe first. This is real seeded production-ish data (reseed already confirmed successful)
     with no other backup — a script bug during the delete phase would not be recoverable
     otherwise.
   - Run once by Siraphob locally — the sandbox can't reach `127.0.0.1:8090` any more than it
     could last session.

### Pages

- `/course` — index/listing page. Grid of course cards (photo + title + tagline + price), each
  linking to its own detail page. Chosen over a single long scrolling page specifically because
  Siraphob wants painless add/remove of individual courses over time.
- `/course/[slug]` — one Apple-product-page-style page per course. Large real photo, bold
  headline, one-line tagline, price/duration/schedule, LINE booking CTA. No scroll zoom effect;
  subtle fade/slide-in on scroll is fine per DESIGN.md, nothing more.
- `/promotions` — index/listing page, same grid template as `/course` (even with just 1 item
  today — added for template consistency and so the collection isn't the odd one out without an
  index, per Siraphob's request).
- `/promotions/[slug]` — same template as course detail, plus a "valid until" note.
- `/workshops/[slug]` — same template as course detail, plus seats-remaining badge and event
  date. `/workshops` index stays as the existing card-grid listing, now linking into real detail
  pages instead of dead-ending.

**Category index pages (added per Siraphob's request, resolves how the mega-menu links out —
see Navigation):** one shared grid template, reused/parameterized instead of building a bespoke
layout per grouping:
- `/course/subject/[tag]` — รายวิชา (e.g. `/course/subject/ภาษาอังกฤษ`)
- `/course/grade/[tag]` — ชั้นปี (e.g. `/course/grade/ป.6`)
- `/course/exam/[tag]` — ติวสอบ (e.g. `/course/exam/tgat-a-level`)
- `/course/format/[tag]` — รูปแบบ (e.g. `/course/format/ตัวต่อตัว`)

Each renders the same card-grid component as `/course`, pre-filtered to courses carrying that
tag. This is also what settles the earlier open question of whether mega-menu items link straight
to a single course or to a list: **they link to these category pages**, not directly to
individual course titles — a menu item is a filter, not a shortcut to one specific course, so a
category with 3 matching courses shows all 3 as cards, not just the first one arbitrarily
chosen.

**URL-safety policy for tag values (clarified after 3rd `/scrutinize` pass):** Thai script and
periods are both legal, unencoded URL path characters — `/course/grade/ป.6` is fine as-is, no
slugification needed. Only tag values containing characters that are genuinely unsafe/reserved in
a URL path — spaces and `&`, e.g. `TGAT & A-Level` — need a slugified form (`tgat-a-level`). One
rule, not "slugify everything" or "slugify nothing": if the raw tag has a space or a reserved URL
character, slugify it; otherwise use it as-is. Keep this in the same hard-coded lookup table
mentioned above (tag value → display label → URL slug), one source of truth, not three places
that can drift.

**Reserved course-slug words:** because `/course/[slug]` and `/course/subject|grade|exam|format/
[tag]` share the same URL space (distinguished only by segment count, not a real conflict today),
avoid ever giving a future course the literal slug `subject`, `grade`, `exam`, or `format` — no
current course does, just a constraint worth remembering when adding new ones later.

### Navigation

- Existing header link **"คอร์สเรียน" (currently → `/services`) renamed to "บริการ"** — it was
  always the subject/category catalog, not the named courses; the two were sharing one label by
  accident.
- New header item **"คอร์สเรียน"** with an Apple-style mega-menu dropdown (hover-triggered on
  desktop), grouped into columns: รายวิชา / ชั้นปี / ติวสอบ / รูปแบบ / Workshop. Each column lists
  the tag values that have at least one real course, as links to that tag's **category index
  page** (see "Category index pages" above) — not straight to a single course. A column with zero
  matching real content is omitted rather than shown empty. Workshop column links straight to
  each workshop's own detail page (only 2 items, no filtering needed there).
  (**Revises the original grill-session answer to Q7**, which assumed menu items would list
  individual course titles directly — adding the category index pages made listing titles inline
  in the dropdown redundant, and avoids the dropdown silently picking "the first matching course"
  when a tag has more than one.)
- Mobile behavior: **open question, see below** — hover dropdowns don't translate directly to
  touch; header currently has no mobile nav pattern at all (flat flex row, no hamburger).

### Homepage impact (agreed early in the grill session, missing from the first PRD draft)

Moving the 9 courses out of `promotions` leaves `index.astro`'s "ข้อเสนอพิเศษ" section with just
1 card — its current `grid-3` layout was built for multiple cards and will look sparse/broken
with one. Update that section to a single-item layout (not a 3-column grid for 1 card), and add a
"ดูคอร์สทั้งหมด" link/button pointing to `/course` at the end of the section so the homepage still
surfaces the full course catalog, not just the one promo.

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
- `web/astro.config.mjs` has no `site` field set today (checked in `/scrutinize`) — needed so
  Astro can generate absolute `og:image`/canonical URLs instead of relative ones social platforms
  can't resolve. Add `site: "https://englishmania.co.th"` (the real production domain per
  `PRD.md`, even though DNS cutover hasn't happened yet — consistent with how the sandbox LINE OA
  placeholder is handled elsewhere: code points at the real target, swapped live at go-live).

### Admin / content editing

- No custom admin page. PocketBase's built-in Admin UI (`http://127.0.0.1:8090/_/`) is sufficient
  for adding/editing/removing courses, promotions, and workshops — free, already exists, already
  used in this project to debug the seed error last session.

## Phasing (added after 3rd `/scrutinize` pass, 2026-08-13)

Scope grew significantly across three review passes — splitting into phases so each is
independently verifiable (`npm run dev` + a real look, same pattern that worked for the previous
session's real-content pass) before the next one starts, rather than one large batch that's hard
to isolate if something breaks. Also matters more than usual here because every git commit/push
and every PocketBase script run has to happen on Siraphob's own machine, not the sandbox — smaller
phases mean smaller, easier-to-verify handoffs each time.

**Phase 1 — data + core detail pages**
- `pb_migrations/4_add_courses_and_split_fields.js` (schema only)
- Per-course Facebook sourcing (time-boxed, see Open Questions)
- `pocketbase/migrate-courses.mjs` (two-phase, run by Siraphob after backing up `pb_data`)
- `/course` index, `/course/[slug]`, `/promotions` index, `/promotions/[slug]`,
  `/workshops/[slug]` (+ STEM Workshop added to `workshops`)
- Homepage "ข้อเสนอพิเศษ" section fix + "ดูคอร์สทั้งหมด" link
- `services.astro` title/hero copy fix
- **Nav label rename done here, not Phase 2** (caught in a 4th `/scrutinize` pass: Phase 1 adds a
  new plain nav link to `/course` labeled "คอร์สเรียน" — the existing `/services` link still says
  "คอร์สเรียน" too until it's renamed, so the rename has to land in the same phase as the new
  link, not one phase later, or the site briefly ships with two identically-labeled nav items):
  existing header link **"คอร์สเรียน" (→ `/services`) renamed to "บริการ"**, new plain link
  **"คอร์สเรียน" → `/course`** added.
- **No mega-menu, no category pages yet** — the new `/course` nav link is a plain link in this
  phase, same pattern as every other nav item today; it becomes a dropdown trigger in Phase 2.

**Phase 2 — mega-menu + category index pages**
- Category index pages: `/course/subject/[tag]`, `/course/grade/[tag]`, `/course/exam/[tag]`,
  `/course/format/[tag]`
- Upgrade the Phase 1 plain "คอร์สเรียน" link into an Apple-style mega-menu dropdown (desktop
  hover) + the tag-grouping/slugification lookup table
- Mobile mega-menu pattern decision (still open, see Open Questions) resolved here

**Phase 3 — SEO / paid social readiness**
- `astro.config.mjs` `site` field
- `BaseLayout` OG/Twitter tag support + `image` prop
- Per-page OG values wired into all Phase 1 detail pages
- `schema.org/Course` JSON-LD per course detail page

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
  not yet done, planned as part of implementation, not this planning pass. **Time-boxed per
  `/scrutinize`**: cap search effort per course (~5-10 min); if no matching FB post surfaces in
  that window, fall back to the old site's already-verified text for that course rather than
  letting one course stall the whole build — last session's FB archaeology (sampling ~45 of 1,137
  exported photos) showed this can balloon if left open-ended.
- **git workflow blocker (unrelated to this feature, pre-existing)** — the mounted project
  drive doesn't support git's file-locking operations from inside the agent sandbox
  (`.git/index.lock` can be created but not removed once git leaves it behind mid-operation).
  All commits/pushes for this project have to run from Siraphob's own machine. Not a blocker for
  planning or file edits, only for git operations specifically.

## Phase 1.5 — course/promotion/workshop "story" content (2026-08-13, revised after 4th/5th
`/grill-me` rounds)

Feedback after seeing Phase 1 live: detail pages didn't read as Apple-style because each item had
only one hero + one short description block — no multi-section "story" the way
apple.com/th/mac-studio or apple.com/macbook-pro stack several photo+copy sections, and no
gallery pattern like apple.com/mac-studio/specs. Resolved, then corrected once more after a
`/scrutinize` pass caught the new collections only covering `courses`, breaking the earlier "every
sellable thing gets the same standard" rule (see Phase 1's data model section) — **all of the
below applies uniformly to courses, promotions, AND workshops, not courses alone.**

- **New collection `course_sections`** — despite the name (kept for historical continuity in this
  doc; consider renaming to `product_sections` at implementation time), it carries **three**
  optional relation fields: `course`, `promotion`, `workshop` (each maxSelect 1, exactly one
  populated per record) rather than one collection per content type. Plus `heading`, `body`
  (editor), `image`, `sort_order`. A JSON blob was considered and rejected — Siraphob edits
  through the PocketBase Admin UI only (no custom admin), and raw JSON for nested
  {heading, body, image} objects is far easier to break than adding/editing ordinary records —
  matches how every other piece of content in this project (tutors, services, testimonials) is
  already a discrete record. **Access rules**: `editorsAuthRule` for create/update, public read —
  same as `gallery_images`. Admin-UI-only write path, so "exactly one of the three relations
  populated" is a human-diligence rule here too, not server-enforced (same reasoning as the
  gallery pin relations above).
- **3 fixed sections per item**: "เหมาะกับใคร" (who it's for), "เรียนอะไรบ้าง" / "รายละเอียด"
  (what's covered), "รูปแบบการเรียน" (format/schedule/location) — same 3 headings across courses,
  promotions, and workshops for a consistent tab experience. More can be added per-item later
  since it's a normal collection, not a hardcoded schema. **Heading text must be copy-pasted
  identically across all ~13 items** — the field is free text, nothing enforces consistent
  spelling, easy to accidentally drift.
- **Content sourcing**: Claude drafts all sections from data already verified in this project (no
  new claims invented) and hands Siraphob a gap-list of which sections are thin/generic and would
  benefit from real input.
- **`courses.description` (the Phase 1 field) is repurposed, not duplicated**: it becomes the
  short summary used for meta/OG description (Phase 3) only, no longer rendered as on-page body
  text — the "เนื้อหา" tab's 3 sections replace that role. Same treatment for the equivalent field
  on `promotions`/`workshops`.
- **3 tabs on every detail page**: เนื้อหา (the sections above) / รูป (photo gallery) / รีวิว
  (reviews — see below). Not a spec-comparison table like the Mac Studio specs page — rejected
  because none of courses/promotions/workshops have configurable variants to compare.
- **Photo gallery — two-tier: pinned + ordered, then tag-matched fill-in** (revised after
  `/scrutinize` flagged that pure tag-matching could make every course's gallery look identical).
  `gallery_images` gets:
  - Three optional relation fields, same pattern as `course_sections`: `course`, `promotion`,
    `workshop` (maxSelect 1 each, at most one populated) — for photos that are genuinely *that
    item's own* dedicated shots (e.g. real detail photos of that specific course's classroom
    session). These render **first, in explicit `sort_order`** (1, 2, 3...) — full curator
    control for the photos that matter most per item.
  - A `tags` field (same vocabulary as `courses.tags`) — **`promotions`/`workshops` also get a
    `tags` field now** (Phase 1 kept tags courses-only for the mega-menu; gallery-matching needs
    it everywhere). Photos with no direct relation to a specific item, but overlapping tags, fill
    in **after** the pinned set — general atmosphere/example-content shots that can reasonably
    apply to several items (add once, tag it, done — no manual linking per page).
  - **Tag-matched fill-in pool excludes any photo that has a relation set** (caught in a 5th
    `/scrutinize` pass, confirmed with Siraphob): without this, a course-A detail photo tagged
    `ป.6` would leak onto every other course's gallery that also carries `ป.6` — very likely given
    how granular/overlapping the grade tags are. Query for a given item's tag-matched fill-in is
    `course = null && promotion = null && workshop = null && (tags ~ "<tag1>" || tags ~ "<tag2>"
    ...)` — pinned photos are a **separate** query (`course = "<id>"`, sorted by `sort_order`) and
    never enter the tag-matched pool for any page, including their own item's page (they're
    already shown, first, via the pin).
  - **To show the same photo pinned on more than one item**, the editor creates a second
    `gallery_images` record with the same `image` path but a different relation set — a
    deliberate, explicit action per Siraphob's confirmation, not automatic cross-linking. Same
    file, two rows.
  - A gallery tab's final order: pinned items (by `sort_order`) first, tag-matched items after
    (by `sort_order` too, or `created` if simpler).
  - Sourcing is a mix: real pinned photos where available, general tagged atmosphere photos as
    fill-in — never invented.
  - `gallery_albums` stays a separate, unrelated feature — not wired into this system, despite
    the collection existing since migration 1 (documentation-only correction from `/scrutinize`,
    the first draft implied both collections were being reused together). The existing `album`
    relation field on `gallery_images` is untouched by this project — stays optional, unused for
    this purpose.
  - **Access rules unchanged**: `gallery_images` stays `editorsAuthRule` for create/update (same
    as migration 1) — only Siraphob/editors add pinned or tag-matched photos via the Admin UI, no
    public write path here. "Exactly one of the three relations populated" is **not** enforced
    server-side for this collection (unlike reviews below) — deliberate: this is a trusted-editor,
    Admin-UI-only write path, not a public form, so the risk profile is different (a typo here is
    a content bug an editor can just fix, not an adversarial submission).
- **Reviews tab is a public submission form, not a static display** — genuinely new feature, not
  just a content-display choice:
  - New collection (or extend `testimonials`) with: `target` info (which course/promotion/
    workshop it's about — same 3-relation pattern as `course_sections`/gallery), `author_name`,
    `quote`, `rating`, **`is_approved`** (bool, default false), and a **dedicated public-display
    consent field** — NOT a reused copy of `contact_submissions.consent_given`, since that field's
    consent scope is "may be contacted back," not "may publish my name and words publicly." New
    field, own wording (e.g. "ยินยอมให้เผยแพร่ชื่อและข้อความรีวิวนี้ต่อสาธารณะบนเว็บไซต์"),
    required to submit.
  - **`createRule` is NOT public** (revised in a 5th `/scrutinize` pass — the original draft made
    it public like `contact_submissions` and relied on the Astro form handler to check Turnstile,
    consent, and "exactly one relation set." That's bypassable: PocketBase's own REST API would
    still accept a direct POST from anyone, skipping the Astro layer — and the same route/rule
    audit found `contact_submissions` has had this exact gap since it shipped, since its Turnstile
    check also only lives in `web/src/pages/api/contact.ts`, never enforced by PocketBase itself).
    **Fix, confirmed with Siraphob: lock `createRule` to superuser-only on both `reviews` and
    `contact_submissions`.** The Astro API routes (`api/reviews.ts`, new; `api/contact.ts`,
    retrofit) authenticate as a service/superuser account first — same pattern
    `pocketbase/migrate-courses.mjs` already uses (`POST
    /api/collections/_superusers/auth-with-password`) — then write with that token. No path to
    PocketBase's create endpoint exists that skips the Astro route's Turnstile/consent/
    relation-exactly-one checks, because the endpoint itself now refuses unauthenticated writes.
    `listRule`/`viewRule` on `reviews` stay restricted to approved-only for public reads, full
    access for editors/superuser (read side was never the issue).
  - **Turnstile required on this form from day one**, verified inside the now-locked-down Astro
    route — closing the `createRule` gap above is what actually makes this protection effective;
    Turnstile alone (previous plan) would not have been.
  - **Nothing is public until Siraphob approves it** in the PocketBase Admin UI, same manual-
    curation approach `testimonials` already uses per `PRD.md`.
  - Publicly displayed reviews on a given page are only ones approved AND targeted at that
    specific item — no more showing the same 5 generic reviews everywhere (this also resolves the
    duplicate-content SEO concern flagged in `/scrutinize`, since each page's reviews are now
    genuinely unique to it, once any exist — expect most pages to show none at first).

**Retrofit required on existing `contact_submissions` (found during the 5th `/scrutinize` pass,
not new scope but blocks calling Turnstile "fixed" on the contact form otherwise):** change its
`createRule` from public to superuser-only, and update `api/contact.ts` to auth as a service
account before writing — same fix, same pass, as the new `reviews` collection above.

**Not yet designed:** exact tab UI/interaction pattern (client-side JS tab switcher — this site
has no client-side JS anywhere yet, everything is server-rendered Astro), the review form's UI
specifics, where the service-account credentials are stored (presumably new env vars alongside
`TURNSTILE_SECRET_KEY`), and the specific drafted copy for each section across all ~13 items. All
implementation work, not decided yet at the planning level.

## Phase 1 implementation notes (2026-08-13)

**Content discoveries during implementation (both confirmed with Siraphob before building):**
- A **10th real course** was found that was never on the old site: **"Genious Summer Intensive
  Skill"**, an annual April-May day camp for ages 5-7 (found via a real promotional flyer in
  `OneDrive/.../Web/คอร์ส/summer25/`, not fabricated). Confirmed with Siraphob: summer courses run
  once a year in this window. Added as course #10, separate from the existing "Exclusive English
  Mentoring" course (different program — Saturday-only intensive vs. this weekday day-camp).
- **STEM Workshop** ("English & STEM Fun Lab"): unlike Insect Pinning, no promotional flyer with a
  real upcoming date/price/seats was found — only a recap post from last year's single run.
  Confirmed with Siraphob: this one runs occasionally (not annually fixed), and it's fine to ship
  the page **without** an event_date/price/seats this round — it works as a photo/atmosphere page
  for now. Add real date/price/seats via the PocketBase Admin UI once a real next session is
  confirmed (same pattern as how Insect Pinning's date was handled last session).
- Per-course FB text search (title/price/schedule) turned out low-yield (Facebook truncates post
  text, no structured pricing in search snippets) — per the time-boxing agreed in Open Questions,
  fell back to the already-audit-confirmed old-site text for the original 9 courses instead of
  continuing to dig.

**Files created:**
`pocketbase/pb_migrations/4_add_courses_and_split_fields.js`,
`pocketbase/migrate-courses.mjs`, `web/src/pages/course/index.astro`,
`web/src/pages/course/[slug].astro`, `web/src/pages/promotions/index.astro`,
`web/src/pages/promotions/[slug].astro`, `web/src/pages/workshops/[slug].astro`,
`web/public/images/courses/*.jpg` (9 files — **correction, 2026-08-13**: these were verified this
session to actually be Facebook ad-graphics with price/QR/text overlays baked in, not real photos;
the OneDrive folder this claim referenced was never reachable from the sandbox to confirm. See
"Phase 1.5 content sourcing findings" below for the fix — all 9 plus 2 more courses and 1 workshop
now use real photos sourced from the FB raw export instead).

**Files changed:** `web/src/lib/pocketbase.ts` (Course interface + fetch functions, Promotion/
Workshop interfaces extended), `web/src/components/Header.astro` (nav label rename + new
`/course` link), `web/src/pages/index.astro` (promo section single-item layout + "ดูคอร์สทั้งหมด"
link), `web/src/pages/services.astro` (title/hero copy), `web/src/pages/workshops/index.astro`
(cards now link to detail pages), `web/src/styles/global.css` (shared `.product-hero-*` classes).

**What Siraphob needs to run, in order, from PowerShell at the project root:**
1. `Remove-Item .git\index.lock -Force` if present (leftover from an earlier sandbox attempt)
2. **Back up `pocketbase/pb_data/`** (copy the whole folder somewhere safe) — required before step 4
3. Restart `pocketbase serve`, confirm the startup log shows migration 4 applying
4. `source .credentials && node pocketbase/migrate-courses.mjs` (or the PowerShell equivalent env
   vars) — creates the 10 courses, deletes the 9 old promotion stand-ins, backfills the 990฿
   promo's slug, adds the STEM workshop
5. `npm run dev` inside `web/` and check `/`, `/course`, `/course/<any-slug>`, `/promotions`,
   `/workshops`, `/workshops/stem-fun-lab` — none of this has been visually verified by anyone yet
6. `git add -A && git commit -m "..." && git push`

Not done yet: Phase 2 (mega-menu, category pages) and Phase 3 (OG tags, `astro.config.mjs` site
field, Course schema) — see "Phasing" above.

## Phase 1.5 content sourcing findings (2026-08-13, this session)

Per "Content sourcing" in the Phase 1.5 section above, went course-by-course through the old site
and the business's real Facebook Page (logged in as page admin) to fill in thin/missing data before
drafting the 3 story sections. Findings, confirmed with Siraphob live:

- **New course found: "English Foundation Group"** — real, currently-run course, not previously
  captured anywhere in this project. Ages 8-11, 2,400 บาท/เดือน (or 8,160 บาท for a 4-month bundle,
  15% off the 9,600 บาท list price), เรียนพุธ+ศุกร์ 17:00-18:00 น. (8 ชม./เดือน). Curriculum: ฝึกอ่าน
  สะกดคำ, เสริมคำศัพท์ตามวัย, วิเคราะห์เนื้อเรื่องภาษาอังกฤษ, ปูพื้นฐานเด็กอ่อนอังกฤษ. Includes a free
  textbook (มูลค่า 500 บาท). **Confirmed with Siraphob: add as course #11** in the `courses`
  collection, same standard as the other 10.
- **Price corrections** (found newer Facebook posts contradicting the old-site-sourced values
  currently in `migrate-courses.mjs`; Siraphob's rule — whichever source has a newer date wins):
  - **ฟิสิกส์ (คอร์สฟิสิกส์ ม.4-ม.6)**: was 2,800 บาท/เดือน (old site, ~พ.ค. 2024 asset date) →
    **6,000 บาท / 18 ชั่วโมง ต่อภาคเรียน** (FB post, ~ส.ค. 2024, confirmed by Siraphob against a
    reference image). Schedule detail confirmed from a second source (a prior Google AI Mode chat
    Siraphob had, cross-checked against the FB post Siraphob pasted directly): ทุกวันอาทิตย์ ม.4
    9:00-10:30 / ม.5 10:30-12:00 / ม.6 13:00-14:30. Institution also offers free midterm/final exam
    tutoring plus video replays for missed sessions.
  - **เพิ่มเกรด เสริมทักษะ (ส-อา)**: was 2,800 บาท/เดือน split into two age-banded time slots (old
    site) → **2,000 บาท/เดือน, single session** เสาร์ 10:00-12:00 + อาทิตย์ 10:00-12:00 (FB post
    dated 6 ต.ค. 2024, newer). Age range also narrows slightly: ป.1-ป.6 (no longer includes อ.3).
  - **คอร์สออนไลน์ตัวต่อตัว (Private)**: existing 3,500 บาท/8 ชม. price still valid, but a second
    pricing tier was found and should be added — **10,500 บาท/30 ชั่วโมง** (bulk package).
  - **เพิ่มเกรด เสริมทักษะ (จ-ศ)**: FB post found matches the existing 4,000 บาท/เทอม, จันทร์-ศุกร์
    16:00-19:00, ป.1-ป.6 exactly — no correction needed, just richer "เหมาะกับใคร" copy sourced
    (เด็ก EP/MEP/IEP, ต้องการปูพื้นฐาน, ต้องการเร่งสปีดก่อนขึ้นประถมปลาย, อ่อนแกรมม่า/ตามครูในห้องไม่ทัน).
  - **ภาษาญี่ปุ่น**: no price/schedule change; found real copy for "เหมาะกับใคร"/"เรียนอะไรบ้าง"
    (เด็กหาความถนัด, หัดเขียน/คำศัพท์เบื้องต้น/แนะนำตัว/ฟังผ่านการ์ตูนญี่ปุ่น, ประโยชน์ด้านสมาธิ/ความจำ).
  - **STEM Fun Lab (workshop)**: the "no confirmed real date/price/seats" gap from Phase 1
    implementation notes is now resolved — found a real, already-run session ("Summer STEM + Math
    Workshop", 21 เม.ย. - 8 พ.ค. 2569, 11 วันเต็ม, 10:00-16:00, 5,500 บาท, activities: Chemistry Fun,
    Young Engineer, Nature Explorer, Physics in Action, Creative Math). **Confirmed with Siraphob:
    use this real data as the page's baseline content** (not a live upcoming booking — event already
    happened), and wait for a new real session (next year's summer, or a mid-term break run) before
    treating it as bookable again.
  - These corrections are not yet applied to `migrate-courses.mjs` or live `pb_data` — captured here
    first per the "no fabricated content" rule, to be applied in the next implementation pass.
- **Out-of-scope discovery: digital study materials / exam-paper products.** Found two real,
  separate product listings on the Facebook Page that are **not courses**: a pure-digital PDF
  product ("Math Test Grade 4-5", 100-question papers with English-translated answer keys, 99 บาท
  per grade or 179 บาท for both) and a physical printed bundle ("หนังสือติวสอบ 5 วิชา", ข้อสอบเข้า ม.1
  ครบ 5 วิชา, 999 บาท bundle or 189-349 บาท per subject separately, + 50 บาท flat shipping — the
  shipping charge implies this one is a mailed physical item, not a download). **Confirmed with
  Siraphob via `/grill-me`: this is real revenue but a genuinely different content type** (no
  "story" tabs, no LINE-booking CTA — needs its own purchase/fulfillment flow, digital delivery for
  one, physical shipping for the other) and does **not** belong in Phase 1.5 or any phase number
  already used above. **Decision: kept as a fully separate future phase, not sequenced yet** — noted
  here only so the discovery isn't lost, not designed further this session.
- **Photo fix (2026-08-13, same session, later pass).** Siraphob flagged the live site's design as
  not matching the apple.com/mac reference, specifically calling out the images as "น่าเกลียดมาก".
  Direct screenshot review (via Chrome MCP against the live `localhost:4321` dev server) confirmed
  the cause: every one of the 9 files in `web/public/images/courses/*.jpg` is a Facebook **ad
  graphic** (price, QR code, decorative icons, text baked into the image) — not a real photo, despite
  this doc's earlier "Files changed" note claiming otherwise. The `OneDrive/.../Web/คอร์ส/` folder
  that note credited was never actually reachable from the sandbox (only `D:\Web EnglishMania`'s `FB
  raw` export and `CI + Logo` are mounted) — that claim could not have been verified and was wrong.
  **Fix applied:** classified all 1,137 photos in `FB raw/Export_1786443238_452bc550/` by aspect
  ratio (≈4:3/3:4 = real camera photo, ≈1:1 or ≈9:16 = ad-graphic/poster export — confirmed correct
  by sampling), found photo4:3 clusters corresponding to distinct real shoots (Insect Pinning
  Workshop, an unlabelled STEM/craft day, and general English Mania classroom/tutoring sessions —
  several visibly showing the "ENGLISH MANIA" banner), and swapped in 12 real, non-duplicate photos:

  | file | replaced with (FB raw) | why |
  |---|---|---|
  | `courses/entrance-exam-m1.jpg` | `image_654.jpg` | solo student, focused worksheet practice |
  | `courses/genious-summer-intensive.jpg` | `image_605.jpg` | teacher with ages ~5-7 — matches course's actual age range |
  | `courses/grade-booster-weekday.jpg` | `image_585.jpg` | full classroom, school uniforms (weekday feel) |
  | `courses/grade-booster-weekend.jpg` | `image_710.jpg` | different classroom group, casual clothes |
  | `courses/japanese.jpg` | `image_670.jpg` | lesson-in-session, projector screen (generic, no Japanese-specific photo exists in the pool) |
  | `courses/native-speaker.jpg` | `image_598.jpg` | English Mania banner visible + English textbook in shot |
  | `courses/physics-sunday.jpg` | `image_695.jpg` | microscope + science worksheet, closest subject match |
  | `courses/private-one-on-one.jpg` | `image_636.jpg` | tutor closely reviewing work with 1-2 students |
  | `courses/tgat-a-level.jpg` | `image_628.jpg` | older-looking group, English grammar lesson on screen |
  | `courses/english-foundation.jpg` (new file) | `image_555.jpg` | solo student writing practice |
  | `courses/exclusive-english-mentoring.jpg` (new file) | `image_620.jpg` | pair tutoring, English Mania banner visible |
  | `workshops/stem-fun-lab.jpg` (new file) | `image_100.jpg` | kids with a hands-on STEM build, energetic |

  `insect-pinning-workshop`'s existing `insect-pinning-specimen.jpg` / `insect-pinning-craft.jpg` were
  already real photos (correctly sourced in an earlier session) — left untouched.
  **Important caveat, per "no fabricated content":** FB raw has no captions or dates, so these are
  real English Mania photos but **not subject-verified** to each specific course (e.g. the
  "physics-sunday" photo shows a generic science activity, not confirmed to be that actual class).
  This matches the exact fallback this doc already specified ("anything with no confident match
  falls back to a general classroom/tutoring photo rather than guessing") — it is a deliberate,
  documented compromise, not a new violation of the rule. If Siraphob later gets access to the
  `OneDrive/.../Web/คอร์ส/` folder (share it into this Cowork session's connected folders), that
  should be treated as the higher-priority source and used to replace these where it has better,
  subject-confirmed matches. DB patch for the 3 previously-`null` image fields (`english-foundation`,
  `exclusive-english-mentoring`, `stem-fun-lab`) is in `pocketbase/patch-course-photos.mjs` — the
  other 9 needed no DB change since their file *path* didn't change, only the file content.

## Out of scope (this pass)

Full historical Facebook audit for additional evergreen courses, TOEIC/IELTS dedicated course
pages (no real course exists for them yet), custom admin UI, `/services` redesign, mobile nav
overhaul beyond what the mega-menu strictly requires. **Digital study materials / exam-paper sales**
(see "Phase 1.5 content sourcing findings" above) — real product line, deliberately deferred to an
unsequenced future phase, not designed this session.
