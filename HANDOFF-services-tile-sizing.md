# Handoff: /services page — tile sizing model is wrong, needs full rebuild

## Status
**Broken / not yet fixed.** The current `/services` page (all 6 category rows: รายวิชา,
รูปแบบ, เวิร์กช็อป, ติวสอบ, ชั้นปี, อื่นๆ) uses a sizing model that Siraphob has explicitly said
is wrong across every section. No code has been changed yet in response to the correction —
the previous session spent its remaining time re-examining apple.com references and got
interrupted mid-investigation, then the user cut off further questions ("หยุดๆๆๆๆๆ") because
the agent looked at the wrong apple.com page. **Do not resume by guessing — re-read "What's
next" below and confirm with Siraphob before touching code.**

## Goal
Redesign `/services` (Astro + PocketBase site, "English Mania by KruYam") to match apple.com's
visual language for photo-tile category rows. Specifically fix two concrete, confirmed bugs:

1. **Wrong sizing model.** Siraphob's original spec used shorthand like "50% | 100% | 50%" for
   a 3-tile row (ติวสอบ) and "50% | 100% | 100% | 100% | 50%" for a 5-tile row (ชั้นปี). The
   agent misread this as "resize the edge tiles down to 50% of the row width" and built a CSS
   Grid with `fr`-ratio columns (1fr/2fr/1fr etc.) — tiles that are narrower but still 100%
   visible. **This is wrong.** Siraphob's correction, verbatim: "ที่บอก 50% คือตัดรูปแสดงผลออก
   เลย ไม่ใช่ปรับขนาดให้เหลือ 50%" (50% means the image is CUT OFF/clipped, not resized down to
   50%). Confirmed against live apple.com behavior (see "Key decisions made").
2. **Row heights jump between sections** ("ความสูงในแต่ละแถวถึงไม่เท่ากัน มันกระโดดไปมา").
   Root cause almost certainly the same bug: `.hero-tile.size-full { aspect-ratio: 16/9 }` is
   applied to a box whose absolute pixel width differs per row (pageSize=3 vs pageSize=5 produce
   different fr-column widths), so the 16:9-driven height differs row to row. **Not yet verified
   against the live page — only a working theory.**

Siraphob explicitly said this is wrong in **every** section, not just ติวสอบ/ชั้นปี, and asked
the agent to go re-examine the real apple.com reference before writing any more code:
"มันผิดทุก section เลย ช่วยไปดูตัวอย่างอีกทีแล้วกลับมาถามฉันได้ไหม https://www.apple.com/"

## What's done
- Investigated apple.com's actual tile/carousel mechanism on two pages and confirmed a pattern
  (see "Key decisions made") — **but this investigation was later flagged by Siraphob as the
  wrong reference page.** He pointed at `https://www.apple.com/` specifically (the plain global
  homepage), not `apple.com/th` (Thai) or `apple.com/us-edu/store` (Education Store), which is
  where the agent actually looked. The findings below may still be directionally useful but are
  **not confirmed against the page Siraphob actually meant.**
- Asked Siraphob 3 clarifying questions via AskUserQuestion (peek pattern / tile-count meaning /
  row-height strategy) — he did not answer them normally. His answers were "ได้อ่านที่ฉันบอกไหม
  https://www.apple.com/" (did you even read what I told you) and "หยุด" (stop) twice, i.e. he
  rejected the whole line of questioning because it was built on investigation of the wrong page.
- No changes have been made to `TileRow.astro` or `services.astro` since the prior "Round 4"
  merge work (already live, already verified, NOT the subject of this bug).

## What's next
1. **First action: navigate to `https://www.apple.com/` (plain global homepage, en locale,
   nothing appended) and screenshot/inspect it top to bottom.** Do not substitute a country
   variant or sub-store page unless Siraphob names one. Use Chrome MCP
   (`mcp__claude-in-chrome__navigate` + `computer` screenshot, or `javascript_tool` to inspect
   DOM/computed styles directly — see prior session's technique below).
2. Look specifically for a horizontally-scrolling photo-tile row where edge tiles are visibly
   cut off/clipped by the container (not proportionally resized). This is what "50%" should map
   to. If the plain apple.com homepage genuinely has no such row (a prior investigation note says
   it only had standard 2-column full-bleed boxed grids — MacBook Air / MacBook Pro / iPad Air —
   no carousel), say so plainly to Siraphob rather than wandering off to another Apple page again.
   **Ask him directly where on apple.com/ he wants the agent to look**, rather than guessing a
   substitute URL — that guess is exactly what caused the "หยุด" rejection last time.
3. Once the correct reference pattern is confirmed (with Siraphob's explicit sign-off, not just
   the agent's own read of the DOM), re-ask the sizing/tile-count/row-height questions from a
   clean slate — those 3 questions themselves may still be the right questions, just need to be
   asked with real evidence behind them this time.
4. Rebuild `TileRow.astro`'s tile layout: replace the `RATIO_3`/`RATIO_5` fr-column grid model
   entirely with uniform-width tiles in a scroll/peek container. Likely a `flex` row with
   `overflow-x: auto`, `scroll-snap-type: x mandatory`, every `.hero-tile` at the same fixed
   width/aspect-ratio, and the container's box edge (not the tile) doing the clipping.
5. Fix the row-height-jump bug as part of the same rebuild — once tile width is uniform and not
   derived from `pageSize`, the 16:9 aspect-ratio height should naturally stay consistent. Verify
   this explicitly (not just assume it's fixed) via `getBoundingClientRect()` on tiles across at
   least 2 different-pageSize rows on the live dev server.
6. Re-verify live via Chrome MCP screenshots + computed-style checks before reporting done, per
   Siraphob's established working style this whole project.
7. Only after `/services` is finalized and approved: remind Siraphob of the still-pending
   PocketBase migration 12 run order (see "Files changed or created").

## Key decisions made
- **Tile sizing model must be "uniform tile width + container-clipped peek", not "proportional
  fr-ratio grid."** Basis: DOM inspection of two apple.com pages (see caveat above — page choice
  itself was wrong, so treat this conclusion as a strong hypothesis to re-confirm, not settled
  fact):
  - `apple.com/th` homepage, "ความบันเทิงไม่รู้จบ" carousel (`.media-gallery-item`): 9 items, every
    one exactly 1263px wide, positioned via `transform: translateX()` on a `ul`, clipped by an
    ancestor `<main class="main">` with `overflow-x: clip`. Center item fully visible, left/right
    neighbors show only a partial sliver — a true carousel, not a static scroll row.
  - `apple.com/us-edu/store`, "Buy Mac or iPad..." row and "Education savings" row
    (`.rf-cards-scroller-*` classes): 5 items each, uniform width (400px, 400px, 400px, 400px,
    540px for the first; roughly uniform in the second), inside a platter wider than the viewport
    with native `overflow-x: scroll` — last item visibly clipped by the browser viewport edge.
  - Both mechanisms produce the same visual result (uniform tiles, edge tile clipped/peeking) via
    different implementations (JS-driven carousel transform vs. native scroll overflow). For this
    project's simpler needs, native `overflow-x` + `scroll-snap` (like the us-edu/store example)
    is almost certainly the practical choice — cheaper to build and maintain than a
    transform-driven carousel — but **confirm this with Siraphob**, don't just assume.
- Prior architecture decisions from earlier rounds (NOT in question, keep as-is): single shared
  `TileRow.astro` component for รายวิชา/รูปแบบ/เวิร์กช็อป/ติวสอบ/ชั้นปี; อื่นๆ keeps its own
  bespoke markup directly in `services.astro`; `cat.` badge top-left names the GROUP not the
  value; `nav="pill"` (prev/dots/next) for the merged ติวสอบ+ชั้นปี section, `nav="arrow"`
  (single round button) everywhere else.

## Files changed or created
No files have changed since this bug was reported. Relevant files to edit next:
- `web/src/components/TileRow.astro` — the shared paged tile-row component. Its `RATIO_3`/
  `RATIO_5` const arrays and the `grid-template-columns: ${ratio...}fr` inline style (lines ~34-46
  as of last read) are the core of what needs replacing. Its `<style>` block (`.tile-page`,
  `.hero-tile.size-full { aspect-ratio: 16/9 }`, `.hero-tile.size-half`) also needs rework.
- `web/src/pages/services.astro` — six `<section>` blocks calling `<TileRow>` (or, for อื่นๅ, its
  own bespoke `.grade-tile` markup + `chunk()`/`RATIO_5` — check whether that bespoke code has
  the *same* proportional-sizing bug and needs the same fix, since Siraphob said "ทุก section").
- **Unrelated, still pending, not blocked by this bug:** `pocketbase/pb_migrations/
  12_add_workshop_duration_type.js` has not been applied on Siraphob's machine yet. Run order
  once he's ready: (1) restart `pocketbase serve` to pick up migration 12, (2) PocketBase Admin
  UI → workshops → set `duration_type` on the 2 existing workshops ("English & STEM Fun Lab",
  "Insect Pinning Workshop"), (3) `npm run dev` and verify. Also still deferred: 3 new workshops
  from a marketing flyer (Summer for English up skill, STEM Sci Math play & learn, October
  English Camp) need real dates/price/seats before being added — do not add without new
  instruction from Siraphob.

## Context the next agent needs
- **Sandbox/access constraints:** bash sandbox reads `D:\Web EnglishMania` fine but cannot run
  `git commit`/`git rm` or reach PocketBase directly — those need Siraphob's own machine. `J:\`
  drive is fully unreachable from bash. All PocketBase writes must be prepared as `.mjs` scripts
  under `pocketbase/` for Siraphob to run himself.
- **Astro CSS scoping gotcha (bit the project twice already):** Astro appends a
  `[data-astro-cid-XXXX]` attribute to every class in a scoped selector, silently inflating
  specificity in ways that aren't visually obvious from the selector text. Also, moving CSS into
  a separate component file means base rules no longer apply to markup still rendered directly in
  `services.astro`'s own scope (this caused a real regression — อื่นๆ fallback tiles went blank
  white until `.tile-fallback`'s background rule was duplicated back into `services.astro`'s own
  `<style>` block). Watch for the same class of bug when rebuilding TileRow's tile-sizing CSS.
- **Verification discipline Siraphob expects:** always confirm changes live via Chrome MCP
  (`mcp__claude-in-chrome__*`) screenshots and `getComputedStyle()`/`getBoundingClientRect()`
  checks before saying something is done — this has been the working pattern all session and he
  visibly does not want another guessed rebuild presented without that verification.
- **Communication style:** Siraphob wants concise, direct, Thai-primary responses, step-by-step
  when explaining. When a request is genuinely ambiguous on a structural decision, ask via
  AskUserQuestion — **but only after doing the legwork he actually asked for.** The trigger for
  his frustration this round was answering/investigating against a URL he did not specify,
  effectively skipping his explicit instruction. Re-read his literal message before acting on it,
  especially URLs — do not substitute a "close enough" page.
- **Chrome tab in use:** tabId `1660965224` was the working tab all session, last left on
  `https://www.apple.com/` (navigated there in response to "หยุด", not yet inspected further).

## How to resume
Navigate the Chrome MCP to `https://www.apple.com/` (exactly that URL, no locale/store suffix),
take a full-page screenshot (or scroll + screenshot in sections), and either (a) find a
peek/clip-style tile row on that exact page and report back to Siraphob with what was found before
touching any code, or (b) if no such row exists on that plain page, ask Siraphob directly what he
wants inspected there rather than guessing a substitute page.
