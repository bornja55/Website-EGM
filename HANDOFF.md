# Handoff: homepage layout, detail-page carousels, catalog bento grid, search+filter, quick-view popup

## Status
Everything below is code-complete and verified live against `localhost:4321` via the Chrome MCP.
Nothing from this session is committed yet — Siraphob is about to push. One PocketBase migration
(the new `badge` field) has been written but **not yet applied** on his machine, confirmed by a
live read of the PocketBase REST API — see "Context the next agent needs".

## Goal
Iteratively restyle the English Mania by KruYam site (Astro + PocketBase) toward an Apple.com
look, working live against the dev server. This session covered: homepage width/spacing, a sticky
header, gallery/reviews carousels on detail pages, a bento grid + search/filter on the course and
workshop listing pages, and a "+" quick-view popup on featured tiles.

---

## What's done

### 1. Homepage width & header
- `Header.astro` / `Footer.astro` keep the original `.container` (1100px, global.css) — the logo
  and "จองผ่าน LINE" button never move, by explicit request after an earlier round accidentally
  widened them.
- New `.container-wide` class in `global.css` (`max-width: calc(50vw + 550px)`) for homepage BODY
  sections only (hero, all 3 tile grids, testimonials, closing CTA) — "eats" 50% of the outer
  gutter per side vs. the old fixed 1100px. Below a ~1100px viewport it degrades to full width via
  normal block `width:auto` behavior, no extra clamp needed.
- `.site-header` is now `position: sticky; top: 0; z-index: 40;` (was `relative`) — freezes on
  scroll; the mega-menu (its own `z-index: 30`, a descendant) still renders correctly on top of
  scrolled content.
- `.section` padding changed from `5rem 0` to `2.5rem 0 5rem` (top halved, bottom untouched) — this
  is what actually closed the "too much gap between sections" complaint, since each section's
  bottom padding was already providing space above the *next* section.
- Fixed a leftover bug: the "บริการอื่นๆ" homepage section was wrapped in a `.full-bleed` class
  with no CSS behind it anymore (dead class from an earlier revert) — rendered edge-to-edge by
  accident. Now uses `.container-wide` like every other section.

### 2. Gallery + reviews carousels (`ProductTabs.astro`)
Used by course/promotion/workshop detail pages (the "รูป" and "รีวิว" tabs).
- Both tabs are now horizontal scroll-snap carousels sharing one pill-shaped prev/dots/next control
  (`.carousel`, `.carousel-track`, `.carousel-item`, `.carousel-nav`, `.carousel-dot`).
- Gallery: several images peek per view (fixed 260px item width). Reviews: one full-width slide at
  a time, centered testimonial-style.
- Bug fixed: the active dot could land on the wrong index mid-animation — the original
  IntersectionObserver approach picked up whichever item crossed its 0.6 ratio threshold at that
  exact animation frame, not necessarily the intended target. Fixed by setting the dot immediately
  on button/dot click, and re-deriving the nearest item from `scrollLeft` on a debounced `scroll`
  listener (for manual swipe/drag).

### 3. Bento grid for course/workshop listings
`CourseGrid.astro` (shared by `/course` and the 4 `/course/{subject,grade,exam,format}/[tag]`
pages) and `pages/workshops/index.astro`:
- 3-column grid, `grid-auto-flow: dense`. Any item with a truthy `badge` spans 2 columns (a "2:1"
  featured tile) with a 21:9 image instead of the normal 4:3. `dense` lets a later 1-wide item
  backfill the gap a wide tile leaves when it doesn't fit the current row — no manual row math.
- Promotions/workshops already carry a synthetic badge label (`"โปรโมชั่น"` / `"Workshop"`,
  hardcoded in `lib/catalog.ts`), so **they render wide automatically today**. Plain courses need
  the new `badge` field (below) set on the record to opt in.
- New migration `pocketbase/pb_migrations/10_add_badge_field.js` — adds an optional `badge` text
  field to the `courses` AND `workshops` collections (not `promotions` — those are already always
  badged by existing design). **Confirmed NOT yet applied** on Siraphob's machine (see below).
- `lib/pocketbase.ts` (`Course`/`Workshop` interfaces) and `lib/catalog.ts` (`courseToItem`)
  updated to read/pass the new field through to the card.
- Fixed a pre-existing, unrelated bug on `/workshops`: `{w.seats_total && <span>...}` rendered a
  literal `"0"` when `seats_total` was falsy-but-numeric-zero — wrapped in `Boolean(...)`.

### 4. Search + filter (`/course` and `/services`)
- `/course`: a search box (matches title+tagline substring) plus a "ตัวกรอง" button opening a
  checkbox panel grouped by the mega-menu's own subject/grade/exam/format tags
  (`buildMenuGroups(courses)` from `lib/courseTags.ts`). Purely client-side — toggles `.is-hidden`
  on `.course-card` elements using `data-search`/`data-tags` attributes added in `CourseGrid.astro`.
  A tag filter narrows to courses only (promotions/workshops have no tags in this vocabulary, same
  as the standalone `/course/[group]/[tag]` pages already behave).
- `/services`: same toolbar pattern, filters by category instead of tags; also hides an entire
  `.category-section` when every card inside it gets filtered out, so no empty heading is left
  floating.
- Two real bugs hit and fixed while verifying live:
  1. **Astro/Vite dev-server stale CSS.** The first edit adding a new `<style>` block to
     `course/index.astro` didn't hot-reload — HTML/script changes showed up live, but
     `document.styleSheets` had zero rules from the new block, confirmed by checking computed
     styles (e.g. a `<svg>` rendering at native ~1060px instead of the CSS'd 18px). A second,
     otherwise-trivial edit to the same file (re-saving it) nudged the watcher and it picked up
     correctly. **If this recurs on another file, re-save it once more before assuming the CSS is
     wrong.**
  2. **`[hidden]` vs. class-based `display` — a CSS specificity tie.** `.filter-panel`/
     `.filter-count` also set `display: flex`/`inline-flex` unconditionally, which ties in
     specificity with the UA stylesheet's `[hidden] { display: none }` rule — and the author style
     wins the tie, so the panel/badge stayed visible despite `hidden` being set. Fixed with an
     explicit `.filter-panel[hidden], .filter-count[hidden] { display: none; }` (duplicated in both
     `course/index.astro` and `services.astro` — they don't share a stylesheet).

### 5. "+" quick-view popup
- New shared component `web/src/components/QuickViewModal.astro` — one `<dialog>` per page, opened
  via event delegation on any `[data-quickview-trigger]` element anywhere on the page (so
  `CourseGrid.astro`'s many cards don't each need their own modal instance).
- The "+" button only renders on featured (2:1, `item.badge` truthy) tiles, in both
  `CourseGrid.astro` and `workshops/index.astro`. It's a real `<button>` inside the card's own
  `<a>` — click handler does `preventDefault()`/`stopPropagation()` before opening the popup, or the
  click would also follow the card's link.
- **Final iteration (explicitly requested):** the popup shows the real detail page inside an
  `<iframe src={item.href}>`, not a hand-built summary card. Siraphob asked for it to feel "like
  opening a new page, just as a popup" — an iframe was the only way to get that without the target
  page's own JS (ProductTabs' tabs, the carousels above, the sticky booking bar) breaking, since
  scripts inside HTML injected via `innerHTML`/fetch don't execute but a real iframe document does.
  `frame.src` resets to `about:blank` on close (Esc, backdrop click, or the × button) so the loaded
  page/media doesn't keep running in the background.
- Sized `min(1100px, 94vw)` × `min(85vh, 900px)`; full-screen (`100vw`/`100vh`, no radius) at
  ≤640px viewports.

---

## Key decisions made
- Header/Footer width was deliberately kept OUT of every width change in this session — only
  page-body content grows, via the separate `.container-wide` class. Confirmed the hard way: an
  earlier round widened `.container` itself and moved the logo/LINE button, which Siraphob rejected.
- The quick-view popup shows the live page via iframe specifically because the alternative (fetch +
  splice HTML) would silently lose all interactivity on the target page — not a stylistic choice,
  a technical constraint once "full page content" was the requirement.
- `badge` is deliberately dual-purpose: both the corner label TEXT and the "make this tile 2:1"
  trigger, reusing one field instead of adding a separate `is_featured` boolean. Confirmed via an
  AskUserQuestion — Siraphob picked "editorial flag, opt-in per record" over an auto-computed
  best-seller heuristic or a fixed "every Nth row" pattern.

---

## Files changed or created
**Modified**
- `HANDOFF.md` — this file (previous version is in git history: `9211b26`).
- `web/src/styles/global.css` — `.container-wide`, `.section` padding.
- `web/src/components/Header.astro` — sticky positioning.
- `web/src/components/Footer.astro` — removed a stray `margin-top` (from an earlier uncommitted
  session, still pending).
- `web/src/components/CourseGrid.astro` — bento grid, `+` quick-view trigger, search/filter data
  attributes.
- `web/src/components/ProductTabs.astro` — gallery/reviews carousels + JS.
- `web/src/lib/catalog.ts` — `CatalogItem.badge`/`.tags` for courses.
- `web/src/lib/pocketbase.ts` — `Course.badge`, `Workshop.badge` fields.
- `web/src/pages/index.astro` — `.container-wide` everywhere, `.full-bleed` bug fix.
- `web/src/pages/course/index.astro` — search+filter toolbar, catalog script.
- `web/src/pages/services.astro` — search+filter toolbar (category-based).
- `web/src/pages/workshops/index.astro` — bento grid, `+` trigger, `Boolean(seats_total)` fix.

**New, untracked**
- `web/src/components/QuickViewModal.astro` — the popup component.
- `pocketbase/pb_migrations/10_add_badge_field.js` — adds `badge` to `courses`/`workshops`.
- `pocketbase/patch-insect-workshop-badge.mjs` — one-off script, sets `badge="แนะนำ"` on the
  "Insect Pinning Workshop" record specifically (Siraphob asked for that one workshop featured).
- `pocketbase/cleanup-services.mjs` — shows untracked in `git status`; the previous handoff
  described this script as already existing/unrun. Status/origin not re-verified this session.

---

## Context the next agent needs
- **PocketBase (127.0.0.1:8090) and the Astro dev server (localhost:4321) run on Siraphob's own
  machine**, not reachable from the sandbox except via the Chrome MCP (browser) for reads. No
  PocketBase write access at all — confirmed again this session. Any data change has to be a
  standalone `.mjs` script under `pocketbase/` (see the existing scripts there for the pattern:
  `SUPERUSER_EMAIL`/`SUPERUSER_PASS` env vars loaded from `.credentials`, admin auth, then a
  `fetch(...)` PATCH) for Siraphob to run himself.
- **Migration 10 has NOT been run yet** — verified live via
  `fetch('http://127.0.0.1:8090/api/collections/workshops/records?perPage=1')` and checking for a
  `badge` key in the response (absent). Until it runs, `courses`/`workshops` records can't carry a
  `badge`, so only promotions (and any workshop once flagged after the migration) show as featured.
- `patch-insect-workshop-badge.mjs` is ready but blocked on migration 10 — see script header for
  exact run steps.
- **The Vite dev-server stale-CSS bug (see "What's done" §4) may recur** on other files — the
  symptom is a newly-added CSS rule visibly not applying even though the file on disk is correct
  and the HTML/JS changes DID hot-reload. Re-save the file (any trivial edit) before assuming the
  CSS itself is broken.
- Sandbox cannot run git (established in an earlier session) — Siraphob runs git himself, which is
  the very next step being asked for.
- **Older, pre-existing open items from the previous HANDOFF.md** (five real courses reportedly
  sitting in the wrong PocketBase collection, ~100 `[MOCKUP]` content blocks, two unrun scripts
  `rollout-story-template.mjs` / `cleanup-services.mjs`) were **not touched or re-verified this
  session** — status unknown. Full detail is recoverable via `git log -- HANDOFF.md` /
  `git show 9211b26:HANDOFF.md` before assuming any of it is resolved.
- User preference: concise, direct, Thai first with English technical terms where natural,
  step-by-step for procedures, references/links included when available.

---

## How to resume
1. Ask Siraphob whether migration 10 has been applied yet and whether he ran
   `patch-insect-workshop-badge.mjs` — if not, the bento grid's "featured" behavior on
   courses/workshops still won't visibly do anything beyond promotions.
2. Run `git show 9211b26:HANDOFF.md` to recover the previous handoff's open items (five misplaced
   courses, content debt, two unrun scripts) if that work is still outstanding — this session did
   not check on any of it.
3. Nothing in this session is blocking — everything under "What's done" is live-verified and ready
   to commit/push as-is.
