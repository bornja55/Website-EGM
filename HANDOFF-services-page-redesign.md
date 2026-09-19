# Handoff: /services page redesign (4-section layout rebuild)

## Status

**UPDATE 2026-09-19 — re-verified live at https://dev.englishmania.co.th/services (Chrome MCP):**
all 4 sections still match this spec exactly — Section 1's 66/33 grid, Section 2's stacked
half-height workshop cards, Section 3's dual-row sync-track carousel (different tile sizes per
row, centered pill nav, autoplay looping through all dots), and Section 4's uniform-height 3x2
grid. Two items NOT covered by this doc were found live and are still open:

1. ~~Every "จองผ่าน LINE" button site-wide links to a placeholder.~~ **FIXED and CONFIRMED LIVE
   2026-09-19:** real LINE OA link is `https://lin.ee/pnahe9i` (LINE ID `@english_mania.th`).
   Updated the 3 hardcoded blog-page instances (`web/src/pages/blog/[slug].astro`, `_preview.astro`,
   `_previewtemp.astro`) directly in code. Every other button reads `settings.line_oa_url` / each
   record's own `line_link` from PocketBase — `pocketbase/patch-line-oa-links.mjs` was run by
   Siraphob via `docker exec` on the VM (`egm-web` container → PocketBase at `http://pb:8090`),
   updating `site_settings.line_oa_url` plus every `courses`/`workshops`/`promotions` record that
   was still on the placeholder. Verified live on dev.englishmania.co.th — LINE buttons now open
   `lin.ee/pnahe9i`.
2. **Section 4 (อื่นๆ)'s icon-on-flat-tint fallback renders as a single raw Thai character**, not
   an icon — e.g. `.tile-fallback.other-fallback` shows literally "จ" for "จำหน่ายเอกสารและหนังสือ
   ติวสอบ" and "เ" for "เช่า Co-Working Space / ห้องประชุม" (first character of the label, all 7
   tiles affected). **Confirmed by Siraphob 2026-09-19: this is expected — the real images/icons
   for this section just haven't been made yet.** Not a bug; leave the fallback as-is until he
   supplies the artwork (fits his page-by-page image touch-up pass, not a code fix).

**Also corrected 2026-09-19 (from Siraphob, not code-side findings):** the site's on-file address
had the wrong house number/soi (scraped 2026-08-11 from the old site's own /contact page, never
cross-checked against Maps). Real address is `61/578 บางใหญ่ซิตี้ซอย 8, ตำบลเสาธงหิน, อำเภอบางใหญ่,
นนทบุรี 11140`, confirmed against a fresher Google Maps share link
(https://maps.app.goo.gl/m3oHomg381jPQorRA) that resolves to the same Place ID as the one already
on file — same business, more precise pin. Updated in code: `pocketbase/seed.mjs` (REAL_ADDRESS,
for future reseeds), `web/src/pages/index.astro` (GOOGLE_MAPS_URL/MAP_LAT/MAP_LNG), and
`web/src/layouts/BaseLayout.astro` (LocalBusiness geo schema). Live PocketBase `site_settings.address` was updated the same way — `pocketbase/patch-address.mjs`
run via `docker exec` on the VM — and confirmed live on `/contact` and the homepage map.

**Follow-up, same day — ตำบล text vs. Google's own auto-filled locality:** Siraphob's real, VERIFIED
Google Business Profile listing ("You manage this Business Profile" panel) auto-shows the locality
as **บางรักพัฒนา**, not เสาธงหิน. Briefly "corrected" the address text to match — Siraphob then said
directly that Google's own locality/boundary data is wrong here ("เหมือนใน google มันจะผิด") and the
real, registered ตำบล is เสาธงหิน. **Resolved per Siraphob's explicit decision:** keep the
*displayed address text* as เสาธงหิน (the real, registered one), but make the *map itself* not
depend on that text at all — `google_maps_embed_url` (both `seed.mjs` and `patch-address.mjs`) now
builds from the verified lat/lng directly (`?q=13.8819899,100.4055284&output=embed`, same Place ID
`0x30e28f28749cb20f:0x15d61fc70cfafcc6`) instead of a free-text `?q=<address>` search. So the map
always lands on the correct real-world pin regardless of which ตำบล name Google's own UI happens to
show for that spot, and the page text stays accurate to Siraphob's actual registration. Final state:
`address` = `...ตำบลเสาธงหิน...`, `google_maps_embed_url` = lat/lng-based, unaffected by the ตำบล
debate. `pocketbase/patch-address.mjs` was updated accordingly — **needs to be re-run on the VM**
(`docker exec -e PB_URL=http://pb:8090 -i egm-web node - < pocketbase/patch-address.mjs`) once this
commit is deployed, then re-check `/contact` and the homepage map.

All 4 sections have been rebuilt to Siraphob's literal layout spec and were originally verified
live via Chrome MCP against `http://localhost:4321/services`. As of first writing, every open
request had been implemented and confirmed — there was no known outstanding bug from this doc's
own scope. Treat this as a stable checkpoint, not a "resume mid-task" state; the two items above
are new findings from live re-verification, not regressions in this doc's own work.

## Goal

Redesign `/services` (Astro + PocketBase site, "English Mania") into 4 fixed sections per Siraphob's exact literal specs (column/row percentages, card aspect ratios, carousel behavior), matching apple.com's real visual patterns where referenced — and to re-verify every change live in the browser before reporting it done, never guessing.

## What's done

- **Section 1 (รายวิชา & รูปแบบ)** — fixed 3-col CSS Grid (`BentoGrid.astro`, `columns={3}`), literal spans: 66% ภาษาอังกฤษ / 33% คณิตศาสตร์ / 33% วิทยาศาสตร์ / 33% onsite / 33% online / 33% เรียนกลุ่ม / 66% ตัวต่อตัว. ภาษาญี่ปุ่น removed from this grid only (still a real tag elsewhere). Photo forced to a true 16:9 crop, bottom-anchored, centered horizontally, CI (`--em-neutral-bg`) background showing in any letterbox gap.
- **Section 2 (เวิร์กช็อป)** — 1-column stack, one card per workshop (`BentoGrid.astro`, `columns={1}`, `layout="stacked"`). Card height halved (`cardAspect="32/9"`), title in plain flow at the top, photo below it shrunk to 50% of the card's own height (`mediaScale={0.5}`), `justify-content: space-between` so the title hugs the top and the photo hugs the bottom (not vertically centered as a block).
- **Section 3 (ติวสอบ & ชั้นปี)** — two independently-wrapping horizontal tracks (`.sync-track`) sharing ONE prev/dot/next control. Tile sizing is intentionally DIFFERENT per row (see Key decisions). Autoplay every 5s, starts on the 3rd dot, loops past the last dot back to the first. Dot nav matches apple.com's real "Endless entertainment." gallery: small 8px circle by default, only the active dot grows into a 32px progress-bar pill. Nav bar is horizontally centered under the section.
- **Section 4 (อื่นๆ)** — fixed 3-col, 2-row grid (own bespoke `.grade-tile` markup, not `BentoGrid`, since there's no `image` field on Service records — icon-on-flat-tint fallback only). Every card the same height across BOTH rows, computed from the widest tile's real measured width (JS, not CSS `calc()` — see Key decisions). Section's own background matches Sections 1–3 (transparent/white, no `section-neutral`).

## What's next

Nothing is queued. If Siraphob raises a new visual issue on `/services`, the standing workflow is:
1. Reproduce it live first (navigate to `http://localhost:4321/services` via Chrome MCP, screenshot, measure with `getBoundingClientRect`/`getComputedStyle` — don't diagnose from a description alone).
2. If the fix requires a design judgment call (not a clear bug), ask before coding — Siraphob has repeatedly flagged rework caused by guessing.
3. After editing, reload with `location.reload(true)` and re-measure/screenshot before reporting done.

## Key decisions made

- **Section 3's two rows use DIFFERENT tile sizes on purpose.** ติวสอบ = `syncTileWidth(1)` (1 full tile + 2×33% peeks → big tile). ชั้นปี = `syncTileWidth(3)` (3 full tiles + 2×33% peeks → smaller tile). I briefly "fixed" this to one universal size after measuring apple.com's single-slide gallery, but Siraphob corrected me: this was the ORIGINAL spec, not a bug — apple.com's model doesn't have this per-row-density idea at all and isn't the right reference for that particular question. Do not unify these two rows' sizes again without explicit confirmation.
- **The peek fraction (`SYNC_PEEK = 0.33`) is correct and apple-verified.** Measured apple.com's own "Endless entertainment." gallery live: current-item width / outer-row width gives a peek ratio of ≈0.338, matching the 0.33 already in use. This was never the bug.
- **Section 3 tracks loop independently via modulo, not clamp.** ติวสอบ has 6 items, ชั้นปี has 10. The old code clamped each track at `Math.min(index, items.length-1)`, so once the shared index passed 5, ติวสอบ froze on its last card with nothing to peek on the right — a real dead-end blank gap (this was the actual bug behind Siraphob's "การ์ดแสดงไม่เต็มจอ" screenshot, not the differing tile sizes). Fixed with `itemIndex = clamped % items.length` per track in the `<script>` block of `services.astro`.
- **Never use a CSS percentage inside `grid-auto-rows` to encode a width-based formula.** Section 4's row height used to be `grid-auto-rows: calc((2 * (100% - 32px) / 3 + 16px) * 0.5625)`, assuming `100%` meant "the grid's own width." It doesn't — percentages in `grid-auto-rows` resolve against the grid's own (auto/indefinite) height, which is circular. This silently produced a row height barely half of what the widest tile's 16:9 icon needed, so that tile's fallback icon overflowed its own card edge-to-edge with no CI-neutral gutter showing — which Siraphob correctly read as "background color doesn't match other sections." Fixed by measuring the actual widest tile's rendered width in a small inline `<script>` (`syncOtherGridRowHeight()`) and writing the row height to `--other-row-h` as a CSS custom property. Re-measures on `resize`.
- **`aspect-ratio` on an `<img>` does not force a true crop when combined with `object-fit`.** `object-fit`'s fit calculation uses the image's REAL/source natural dimensions, ignoring any CSS `aspect-ratio` override on the replaced element itself. A true forced 16:9 crop needs a wrapper `<div>` (a non-replaced element, so `aspect-ratio` genuinely controls its box) with `object-fit: cover` on the `<img>` inside it. This is why `BentoGrid.astro` wraps media in `.bento-media` rather than sizing the `<img>` directly.
- **`display: inline-flex` + `margin: auto` does not center.** Auto-margin centering only applies to block-level boxes; `inline-flex` is inline-level and silently ignores it. This was the root cause of Section 3's nav bar reading as "stuck on the left" — fixed by using `display: flex` instead.
- **`scrollTo({ behavior: "smooth" })` proved unreliable in live testing** (worked for 1–2 clicks then silently no-op'd while JS state kept advancing). `behavior: "instant"` was 100% reliable across repeated tests and is the permanent implementation choice for Section 3's track centering — not just a testing workaround.
- **Vite/Astro dev-server stale-CSS bug** (documented project-wide in `HANDOFF.md`): newly added CSS in a component sometimes doesn't hot-reload even though HTML/JS changes do. Fix is a trivial re-save of the file to nudge the watcher, or a hard reload (`location.reload(true)`).

## Files changed or created

- `web/src/pages/services.astro` — main page; all 4 sections' markup, the Section 3 `<script>` (sync carousel + autoplay + dot nav), the Section 4 `<script>` (`syncOtherGridRowHeight`), and all section-specific CSS.
- `web/src/components/BentoGrid.astro` — shared static-grid tile component used by Sections 1 and 2. Has a `layout` prop (`"overlay"` default for Section 1, `"stacked"` for Section 2) and a `.bento-media` wrapper div for true 16:9 cropping.
- `web/src/components/TileRow.astro` — the OLD single-track carousel component from before Section 3 became bespoke sync-track markup. Left in place, currently unused, in case it's useful elsewhere later.
- `web/src/lib/courseTags.ts` — untouched, read-only reference (tag → group/href mapping used to build Section 1/3's items).
- `web/src/styles/global.css` — untouched this session; `.section-neutral` (line 110, `background: var(--em-neutral-bg)`) is the shared class Section 4 used to have and no longer does.

## Context the next agent needs

- Dev server: `http://localhost:4321/services`. PocketBase backend at `http://127.0.0.1:8090`.
- CI/brand color CSS variables (in `web/src/styles/global.css`): `--em-yellow: #fada56`, `--em-yellow-dark: #f0c930`, `--em-red: #e5402d`, `--em-red-dark: #c9301f`, `--em-ink: #2b2b2b`, `--em-neutral-bg: #f5f5f7`, `--em-white: #ffffff`. `--em-neutral-bg` is the standard "background behind media that doesn't fill its box" color — used consistently in `BentoGrid.astro`'s `.bento-tile`, `services.astro`'s `.grade-tile` and `.sync-tile`.
- Siraphob's standing instruction, repeated multiple times this session: **ask before coding if anything is ambiguous** ("สงสัยหรือไม่เคลียให้ถามก่อนเริ่มแก้"). Guessing at a design intent and being wrong costs a full extra round-trip — always reproduce/measure live first, and ask rather than assume when a spec could go two ways.
- When told to reference apple.com, use the EXACT URL `https://www.apple.com/` and actually measure the relevant component live via Chrome MCP (`getBoundingClientRect`, `getComputedStyle`) rather than describing it from memory — this was explicitly called out as a repeat mistake earlier in the project.
- This project's sandbox can read `D:\Web EnglishMania` but git commit/rm needs the user's own machine (per project memory `project_englishmania_sandbox_drive_access.md`).

## How to resume

There is no in-progress work to resume. If picking this up fresh: open `http://localhost:4321/services` via Chrome MCP, screenshot all 4 sections top to bottom to confirm the current state still matches this document (dev-server stale-CSS or an unrelated change could have drifted since), then wait for Siraphob's next specific request.
