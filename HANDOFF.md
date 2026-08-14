# Handoff: Apple-style redesign of course/promotion/workshop detail pages

## Status
`/course/native-speaker` is the **approved reference page** — its เนื้อหา tab is signed off by
Siraphob. The rendering layer now supports the whole template and is wired into all three page
types (course / promotion / workshop). What remains is a **data** rollout to the other 13 items,
plus the real copy for everything currently marked `[MOCKUP]`.

## The template (as approved on native-speaker)
The เนื้อหา tab, top to bottom:

| Section | Layout | Notes |
| --- | --- | --- |
| รูปแบบการเรียน | summary block | headline + big photo + stat row, derived from tags/schedule |
| เหมาะกับใคร | plain centred block | |
| เรียนอะไรบ้าง | **2-up photo card row** | card 1 = course copy, card 2 = books/documents |
| ปัญหาที่คอร์สนี้ช่วยแก้ | plain centred block | image deliberately cleared |
| จุดเด่นของ English Mania | **3-row accordion** | rows left, photo right, photo swaps per row |
| ผลลัพธ์หลังเรียนจบ | **3-up text card row** | copy only, no images |

Reference pages Siraphob matched against: apple.com/macbook-pro's "iPhone essentials." (card row),
"Significant others." (accordion), "Our values lead the way." (text cards).

## How the layouts work (read this before adding another one)
`course_sections` gained a `layout` select (`card` / `accordion` / `text-card`) and a
`group_heading` text field — migrations **6, 7, 8**. A widget is **N consecutive records sharing
the same `layout`**; `group_heading` on the FIRST record is the big heading above the widget.
No new collections, no parent/child relations. `ProductTabs.astro` collapses the flat section list
into render groups in its frontmatter (`sectionGroups`), because Astro templates can't carry state
across a `.map()`.

Adding a 4th layout = widen the select's values in a new migration, add one entry to `GROUP_KIND`,
one branch in the template, one CSS block. Do NOT branch on "does this record have an image" —
that makes the page layout depend on an editor forgetting to attach a photo.

## What's done
- **Component/CSS** (`web/src/components/ProductTabs.astro`): sticky tab bar + LINE CTA, summary
  stat block, alternating photo/text story blocks, and the three new grouped layouts above.
  Accordion JS keeps exactly one row open (clicking the open row does nothing — the picture beside
  it would have nothing to show) and cross-fades the photos in one grid cell so the panel height
  doesn't jump.
- **`web/src/lib/summaryStats.ts`** (new): the stat-row logic, extracted out of
  `course/[slug].astro` so promotions and workshops can share it. Workshops get a **different**
  stat set (วันที่จัด / ระดับชั้น / วิชา / ที่นั่ง / ราคา) and empty cells are dropped rather than
  shown as "-" — STEM Fun Lab has no date/price/seats and a row of four dashes reads as broken.
- **`promotions/[slug].astro` and `workshops/[slug].astro`** now pass `lineLink` + summary props.
  This closes the gap the previous handoff flagged. Verified live on both.
- **Books card artwork**: `web/public/images/courses/books-english-mania.png` — English Mania's OWN
  A4 cover (`A4 ปก อังกฤษ.pdf`) plus three real document samples, composed into a 4:3 flat-lay that
  FILLS the frame. Publisher cover art for California/Oxford was rejected as a copyright risk on a
  commercial page. All four subject covers converted to images in `D:\Web EnglishMania\Book + doc\`
  (full-size) and `Book + doc\web-tiles\` (cover-only 4:3 tiles, NOT the flat-lay treatment).
- **`CONTENT_TEMPLATE_STORY_SECTIONS.md`** updated to the new structure: heading 5 now asks for
  3 question/answer pairs, heading 6 for 3 title/description pairs.

## What's next
1. **Run the rollout** — `node rollout-story-template.mjs --dry-run` first, then for real. It
   converts the other 13 items and reports what it skipped. Not yet run at time of writing.
2. **Two things the rollout deliberately does NOT do**, both by design, not oversight:
   - **Books card only goes on ภาษาอังกฤษ-tagged items.** The card names California and Oxford for
     ป.1-6 — untrue for ฟิสิกส์ / ญี่ปุ่น / TGAT / the workshops. Items without it keep
     เรียนอะไรบ้าง as a plain block rather than becoming a lone card in a 2-up grid. To extend:
     make the same flat-lay for คณิต/วิทย์ from `Book + doc`, copy into `web/public/images/courses/`,
     add to `BOOKS_CARD_BY_SUBJECT` — and only if the copy is true for that subject.
   - **Accordion is skipped for items with no tag-matched gallery photo.** An accordion with an
     empty picture column looks broken. Fix by tagging photos in the Admin UI, then re-run.
3. **Real copy.** This is the blocking item for anything commercial.

## Content debt — read before pointing ads anywhere
Every item already carries 3 `[MOCKUP]` sections from `seed-course-sections-mockup.mjs`, and the
rollout splits two of them into 3 blocks each, so the site will hold **~100 mockup blocks**.
Siraphob accepted this knowingly (2026-08-14: "update ไปเลยเพราะต้องกลับมาแก้เนื้อหาทั้งหมดอีกที").

Find them all: Admin UI → `course_sections` → body contains `MOCKUP`. Collect replacements with
`CONTENT_TEMPLATE_STORY_SECTIONS.md` (already updated for the new 3+3 structure) from ครูแยม.
**No page whose blocks still say `[MOCKUP]` should be used as a paid-ad landing page.**

## Key decisions (do not re-litigate without asking)
- **Tabs stay.** Siraphob overruled removing the เนื้อหา/รูป/รีวิว tabs for a continuous scroll.
- **Mockup on one item first**, then roll out. Followed for every layout this session.
- **Placeholder copy is allowed ONLY with the `[MOCKUP — ต้องแก้เป็นข้อมูลจริง]` prefix.** This does
  not extend to images: a duplicated or unrelated photo has nothing marking it as placeholder, so
  it reads as a bug. When there was no books photo, the card shipped with no image rather than a
  stand-in.
- **Real photos only**, and only ones the school owns or has rights to. Facebook ad-graphics are
  excluded from the gallery; third-party publisher artwork is excluded everywhere.
- **A full-bleed-photo card with text overlaid was tried and rejected** (2026-08-14) — the
  classroom photos are bright and busy, so the copy needed a scrim heavy enough to dull the photo.
  Reverted to text-above / photo-below. Don't re-propose it without a darker, calmer photo set.

## Scripts (all idempotent, all run BY SIRAPHOB — PocketBase is on his machine)
From `pocketbase/`, after loading credentials:
```powershell
Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
```
| Script | Purpose | Run? |
| --- | --- | --- |
| `seed-gallery-images.mjs` | 18 real photos into `gallery_images` | done |
| `seed-course-sections-mockup.mjs` | 3 mockup sections × 14 items | done |
| `patch-native-speaker-section-images.mjs` | photos on story sections | done |
| `remove-native-speaker-schedule-section.mjs` | drop redundant section | done |
| `patch-native-speaker-learn-cards.mjs` | เรียนอะไรบ้าง → 2 cards | done |
| `patch-native-speaker-highlight-accordion.mjs` | จุดเด่น → accordion | done |
| `patch-native-speaker-outcome-cards.mjs` | ผลลัพธ์ → 3 text cards | done |
| `clear-native-speaker-problem-image.mjs` | centre the ปัญหา block | done |
| `rollout-story-template.mjs` | **the other 13 items** | **NOT YET** |

## Context the next agent needs
- **PocketBase (127.0.0.1:8090) and the Astro dev server (localhost:4321) run on Siraphob's
  machine, not reachable from the sandbox.** Every seed/patch script must be run by him. The
  sandbox CAN read/write files under `D:\Web EnglishMania` and CAN screenshot the dev server via
  the Chrome MCP.
- `npm run build` / `astro check` **cannot run in the sandbox** — `node_modules` holds Windows
  binaries. Verify changes by loading the page in Chrome instead.
- **AskUserQuestion popups do not work reliably for this user** — ask clarifying questions as plain
  chat text.
- **Chrome MCP screenshots** are viewport-only. For a full-page shot: hide `.tabs-sticky-bar` with
  `visibility:hidden` (NOT `display:none` or a `position` change — those reflow the full-bleed bar
  and shift the whole page), scroll in steps of `innerHeight - 64`, trim ~24px off each slice's
  bottom to drop Chrome's screen-share pill, and stitch with PIL.
- The tag vocabulary lives in `pb_migrations/4_add_courses_and_split_fields.js` and
  `5_add_story_content.js`, mirrored in `web/src/lib/summaryStats.ts`. Don't invent new values.
- User preference: concise, direct, Thai first with English technical terms, step-by-step for
  procedures.
