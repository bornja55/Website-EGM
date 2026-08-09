# Handoff: English Mania website rebuild (Astro + PocketBase, self-hosted on GCP)

## Status
Design phase is done — all 8 pages are ported from the approved Google Stitch mockups into real
Astro code, `npm install`/`npm run build` both run clean, and the work is committed and pushed to
`origin/main` (commit `d9f0081`). The project also moved to a new location this session (see
"Context the next agent needs" — this is the single most important thing to know before touching
anything). Remaining work is entirely the pre-launch infra checklist (GCP VM, secrets, DNS, legal
review) — no more design or page-porting work is outstanding.

## Goal
Rebuild https://englishmania.co.th (Thai English/math/science tutoring business, "English Mania
by KruYam", registered company ENGLISH MANIA CO., LTD., reg. no. 0125568032059) before the
current MakeWebEasy free-plan hosting expires **2026-11-08**. Same brand identity (yellow circle
+ red speech-bubble logo), new self-built stack, small ~8-page small-business site — not an
enterprise rebuild. User (Siraphob) is doing this themselves with Claude as dev partner; prefers
concise, direct, step-by-step communication, Thai as primary reply language.

## What's done
- **Stack**: Astro (SSR, `@astrojs/node` adapter, standalone mode) + PocketBase (SQLite, single
  binary), Docker Compose, GitHub Actions CI/CD to a GCP `e2-micro` VM. Unchanged from prior
  sessions — see `CLAUDE.md` for full architecture history.
- **Backend/infra code-complete**: PocketBase schema (11 collections), Cloudflare Turnstile
  spam protection, PDPA consent (client + server enforced), backup script
  (`scripts/backup-to-drive.sh`), 4 prior rounds of `/scrutinize` review — all from earlier
  sessions, unchanged this session.
- **All 8 pages ported to the approved Stitch design this session**: Home, Services, Workshops,
  Blog index, Blog post, About, FAQ, Contact. For each page: read the matching file in
  `design/generated_screens/*.html`, translated its layout into the existing
  Astro + `web/src/styles/global.css` class pattern (`.btn`, `.card`, `.section`,
  `.section-neutral`, `.section-yellow`, `.hero-heading`, `.badge`), added a page-scoped
  `<style>` block for anything global.css didn't already cover (grids, icon circles, hero
  decoration), and re-mapped every color to the 7 tokens in `design/DESIGN.md` — none of
  Stitch's invented Material-You blue (`#006385` family) made it into the code. All existing
  PocketBase data-binding (`getServices`, `getActiveWorkshops`, `getActivePromotions`,
  `getTestimonials`, `getFaq`, `getSiteSettings`) was preserved — Stitch's static placeholder
  content was not carried over.
- **Contact page bug fix carried forward from last session, now verified**: Turnstile widget
  resets on every submit outcome (not just success) so a failed send doesn't permanently strand
  the visitor with a spent anti-spam token. Logic untouched during this session's restyle.
- **First-ever real build verification**: `npm install` (218 packages, 0 vulnerabilities) and
  `npm run build` both succeeded on the actual project — previously this had only ever been
  statically/syntactically reviewed, never run. Confirms the whole toolchain (Astro 7,
  `@astrojs/node` ^11.0.0, Node 22) actually works together.
- **Missing assets added**: `web/public/images/logo.png` (was blocked on cross-drive binary copy
  in earlier sessions — resolved), `web/public/fonts/NotoSansThai.ttf`, `web/.nvmrc` (pins Node
  `22` to match the Docker image and README's stated `>=22.12` requirement).
- **Git**: turns out git was already initialized with a real GitHub remote from an earlier
  session (`https://github.com/bornja55/Website-EGM.git`, one prior commit "Scaffold: Astro +
  PocketBase") — HANDOFF.md previously claimed "git has never been initialized," which was wrong.
  This session's changes are now committed (`d9f0081`) and pushed to `origin/main`.

## What's next
1. **GCP VM provisioning** — `e2-micro`, Always Free tier, must be `us-west1`/`us-east1`/
   `us-central1`. Use the wizard script mentioned in earlier CLAUDE.md sessions if it still
   exists, or provision manually.
2. **GitHub Actions secrets** — fill in the checklist in `README.md` (`GCP_SSH_HOST`,
   `GCP_SSH_USER`, `GCP_SSH_KEY`, `SUPERUSER_EMAIL`, `SUPERUSER_PASS`,
   `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_POCKETBASE_URL`, and the
   Google-integration ones if wiring up Sheets/Gmail now). Claude cannot fill these in — the
   user must do it via GitHub's web UI.
3. **Create the real Cloudflare Turnstile widget** for `englishmania.co.th` (a sandbox/test one
   may already exist — check) and a **sandbox LINE OA** if not already set up, feed both into the
   secrets checklist / `pocketbase/seed.mjs`.
4. **Cloudflare DNS cutover** — repoint the A record from the old MakeWebEasy 301 redirect to the
   new VM, set proxy mode to Full (VM serves plain HTTP only, port 443 never opened there).
5. **`scripts/backup-to-drive.sh` needs a live dry-run** against the real VM once it exists — its
   assumptions about PocketBase's `/api/backups` response shape and auth header have never been
   verified against a booted PocketBase instance (network restrictions have blocked this in every
   sandbox session so far).
6. **PDPA legal review** of `web/src/pages/privacy.astro` — it's a draft with bracketed
   placeholders (retention period, last-updated date), not lawyer-reviewed yet.
7. **Refresh About/Services copy** — currently ported from the ~1-year-stale old site content,
   user said they'd revise later rather than block launch on it.
8. Optional polish once the above is done: visually sanity-check all 8 pages with `npm run dev`
   side-by-side against the Stitch mockups in `design/generated_screens/` (this was not done —
   only `npm run build` succeeding was verified, not a visual diff).

## Key decisions made
- **Design direction "clean + minimal, with flair"**, modeled on real apple.com/th screenshots —
  huge whitespace, `--em-neutral-bg` (`#f5f5f7`) as the default second section background, brand
  yellow demoted to one sparse hero accent per page, flatter card shadows, pill buttons, white
  minimal header. Recorded in `design/DESIGN.md`.
- **Strip every color Stitch invented on its own** (the `tertiary` blue family, near-but-not-exact
  reds/yellows) — port using only the 7 exact hex values in `DESIGN.md`'s token table. Confirmed
  with the user in an earlier session, re-applied consistently across all 8 pages this session.
- **No Tailwind adopted** — Stitch's mockups are Tailwind-based exports, but that's just Stitch's
  output format, not a dependency to bring into the actual site. Every page uses plain scoped
  `<style>` blocks + the existing `global.css` classes instead.
- **Project working copy moved from Google Drive to a local drive this session** (see next
  section) — `npm install` was hanging indefinitely on the Google Drive path because Drive's
  desktop client queues file-move-to-trash operations that keep running even while sync is
  "Paused," starving npm's writes to the same files. Moving off Drive entirely fixed it
  permanently rather than working around it each time.
- **Workshops page dropped Stitch's "My Bookings"/"Profile" bottom nav** — no user-account or
  booking system exists in this project (explicit PRD non-goal); the real booking flow everywhere
  on the site is a LINE deep-link, kept consistent with that.
- **Blog/About pages don't hotlink Stitch's placeholder AI-generated images** — those
  `lh3.googleusercontent.com` URLs are Stitch mockup artifacts, not real assets this project owns;
  left as a `TODO` comment for real photography instead (per `DESIGN.md`'s "full-bleed,
  high-quality photography" direction, "once available").

## Files changed or created
All 8 `.astro` pages restyled: `web/src/pages/index.astro`, `services.astro`, `about.astro`,
`faq.astro`, `contact.astro`, `workshops/index.astro`, `blog/index.astro`, `blog/[slug].astro`.
Plus: `web/.nvmrc` (new), `web/package.json` (dependency fix carried forward, see below),
`web/public/images/logo.png` (new), `web/public/fonts/NotoSansThai.ttf` (new). Full diff is in
commit `d9f0081` on `origin/main` — read that rather than trusting this summary for exact line
changes.

**Note on `web/package.json`**: during this session it was accidentally deleted twice (once by a
Linux/Windows filesystem-view desync bug right after the drive move, once by the user running
`Remove-Item` on what turned out to be a stale cached version) and recreated from memory both
times. Final committed content has `"@astrojs/node": "^11.0.0"` (the correct, already-fixed
version) — **do not let anything restore the old `^10.0.0` from the very first git commit**,
that was the original version-mismatch bug from scrutinize round 1.

## Context the next agent needs
- **The project moved this session: `J:\My Drive\Web EngMania\Website-EGM\` →
  `D:\Web EnglishMania\Website-EGM\`.** Always work at the D: path now. The J: drive (Google
  Drive–synced) still holds the `CI + Logo\` source assets folder (not moved, still fine to read
  from) and may have a stale leftover copy of `Website-EGM\` from before the move — don't treat
  anything under J: as current project state.
- **Why the move happened**: `npm install` on J: repeatedly hung for 30+ minutes because Google
  Drive Desktop queues "move to trash" operations for every deleted file and keeps processing
  that backlog even while sync is "Paused" — it was holding file locks that starved npm's writes
  to the same `node_modules` path. This is almost certainly the same root cause an earlier session
  blamed for `git init` not working on J: (both are "lots of small file writes on a Drive-synced
  path" problems). D: is a local, non-synced drive — same problem class should not recur there.
- **A sandbox/bash quirk to know about**: right after the big cross-drive move, this coding
  sandbox's Linux/bash view of files on D: and the user's native Windows view briefly disagreed
  (different byte sizes/timestamps for the same file), and several `rm`/`git` lock-file cleanups
  failed from bash with "Operation not permitted" even though the same operations worked fine
  from the user's own PowerShell. This settled down within about 15–20 minutes and hasn't
  recurred since, but if it happens again: don't fight it from bash, just ask the user to run the
  equivalent command in their own PowerShell.
- **`node_modules` currently has Windows-only native bindings** (installed via the user's
  PowerShell `npm install`) for Astro's `rolldown` compiler — running `npm run build` from this
  sandbox's Linux bash fails with "Cannot find native binding." This is expected, not a code bug.
  **Do not run `npm install` from bash to try to fix it** — that would mix Linux binaries into
  Windows-targeted `node_modules` and likely break the user's local dev environment. Route all
  build verification through the user's own PowerShell (or CI, which reinstalls fresh in Docker
  every time anyway, so this never affects deployment).
- **PocketBase has still never been booted in any sandbox session** — the sandbox's network
  allowlist blocks the GitHub release-asset CDN PocketBase ships from. All PocketBase-related
  claims in this project remain static/syntactic review only, never a live run. Keep flagging
  this limitation rather than implying more confidence than that supports.
- **User preferences**: concise/direct responses, Thai as primary reply language (technical terms
  in English are fine), step-by-step instructions for how-to content, bullet-point summaries for
  long content, runnable code examples with comments on important lines.
- **`/scrutinize` in this project has consistently meant**: actually trace the code path and
  verify claims (rebuild, grep compiled output, execute snippets), not just re-read and restate
  intent. Apply the same bar to any future verification work.

## How to resume
Confirm the working copy is at `D:\Web EnglishMania\Website-EGM\` (not J:) and that
`git status` is clean / `git log -1` shows commit `d9f0081` or later — if not, something about
this handoff's assumptions has changed and needs re-checking before proceeding. From there, pick
up wherever the user wants to go next on the pre-launch checklist in "What's next" above; there is
no more page-porting or design work left to do. If asked to "verify" anything, remember that
`npm run build` can only be confirmed from the user's own PowerShell right now, not from bash in
this sandbox.
