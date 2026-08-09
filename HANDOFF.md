# Handoff: English Mania website rebuild (Astro + PocketBase, self-hosted on GCP)

## Status
Backend/infra (Astro + PocketBase, Docker, CI/CD, backups, PDPA) is code-complete and has
passed 4 rounds of scrutinize (real bugs found and fixed each round, not just talk). The visual
design phase just produced Google Stitch mockups, but **none of that design has been ported into
the actual Astro site code yet** — that porting is the next session's main job.

## Goal
Rebuild https://englishmania.co.th (Thai English/math/science tutoring business, "English Mania
by KruYam", registered company ENGLISH MANIA CO., LTD., reg. no. 0125568032059) before the
current MakeWebEasy free-plan hosting expires **2026-11-08**. Same brand identity (yellow circle
+ red speech-bubble logo), new self-built stack, small ~8-page small-business site — not an
enterprise rebuild. User (Siraphob) is doing this themselves with Claude as dev partner; prefers
concise, direct, step-by-step communication, Thai primary language.

## What's done
- **Stack decided & scaffolded**: Astro (SSR, `@astrojs/node`, standalone mode) + PocketBase
  (SQLite, single binary), pattern scoped down from the user's other company reference repo
  `empire-website`.
- **Hosting/CI**: GCP `e2-micro` (Always Free tier, must be `us-west1`/`us-east1`/`us-central1`),
  GitHub Actions deploy on push to `main` (rsync + SSH + `docker compose up -d --build`), secrets
  passed via step-level `env:` blocks (not inline `${{ secrets.X }}` — GitHub's documented
  anti-pattern, fixed after scrutinize round 1).
- **TLS**: Cloudflare Proxy mode (Full) — VM only serves plain HTTP, port 443 never opened.
- **Spam protection**: Cloudflare Turnstile on the contact form, verified server-side in
  `web/src/pages/api/contact.ts`.
- **PocketBase schema**: 11 collections in `pocketbase/pb_migrations/1_collections.js`, all with
  explicit `created`/`updated` autodate fields (PocketBase v0.23+ doesn't add these implicitly —
  found by static review, this would have 400'd on every homepage load otherwise).
- **PDPA compliance**: `web/src/pages/privacy.astro` (draft, NOT lawyer-reviewed) + required
  consent checkbox on the contact form, enforced both client-side and server-side
  (`api/contact.ts` rejects `consent_given !== true` with a 400 regardless of what the client
  sends).
- **Backups**: `pb_data` is a Docker bind mount (not a named volume) specifically so
  `scripts/backup-to-drive.sh` can run from host crontab, using PocketBase's own `/api/backups`
  REST endpoint (not raw SQLite copying — avoids WAL-mode torn-copy risk) + `rclone` to Google
  Drive, 14-day retention default.
- **4 scrutinize rounds completed**, each finding and fixing real bugs:
  1. Round 1: `@astrojs/node` version mismatch (npm install failure), `import.meta.env` vs
     `process.env` bug (POCKETBASE_URL silently never reaching runtime), GitHub Actions secret
     interpolation anti-pattern.
  2. Round 2: missing `created`/`updated` autodate fields in PocketBase migration (static review
     only — PocketBase itself has never been booted in this sandbox; GitHub release-asset CDN is
     network-blocked here).
  3. Round 3: `gallery_images.deleteRule` inconsistency (reverted to superuser-only).
  4. Round 4 (this session): Turnstile widget wasn't reset after a failed submit — since
     Turnstile tokens are single-use and get consumed by `siteverify` *before* the PocketBase
     write, any failure after that point (PB down, network blip) left the user stuck retrying
     with an already-spent token forever. Fixed with a `finally` block that resets on every
     outcome. Also audited `design/generated_screens/` (see below).
- **Google Stitch design phase**: `design/DESIGN.md` (brand/CI reference + "clean + minimal, with
  flair" Apple-inspired direction, screenshotted from real apple.com/th pages) and
  `design/STITCH_PROMPTS.md` (one ready-to-paste prompt per of the 8 pages) were written and used
  to generate mockups in Google Stitch, exported to `design/generated_screens/*.html`.

## What's next
1. **User is manually pruning `design/generated_screens/`** — it currently has ~20 files but only
   ~8-12 belong to English Mania. Confirmed contamination from unrelated Stitch projects: a
   durian-farm tracking app ("ข้อมูลต้นทุเรียนรายต้น"), a "Sovereign Global Holdings"
   investor-relations dashboard, 4x "Origin Global Empire" screens, and a "Green to Gold" services
   page with an unrelated olive/gold palette. **Do not port any file with those names — if they're
   still there, the user hasn't finished cleaning up.**
2. **Port the real Stitch HTML/CSS into `web/src/`** — this is the core remaining task. For each
   of the 8 pages (Home, Services, Workshops, Blog index, Blog post, About, FAQ, Contact), take
   the matching Astro page under `web/src/pages/` and update its markup/styling to match the
   Stitch mockup's layout, **but**:
   - Do NOT copy Stitch's Tailwind color classes verbatim. Stitch invented its own Material-You
     palette in every screen, including a `tertiary` blue family (`#006385`, `#007da8`, `#78d1ff`)
     that has no basis in this brand, plus near-but-not-exact reds/yellows (`#b51c0f`,
     `#fede5a`). **Map everything back to the 7 tokens in `design/DESIGN.md`'s color table**
     (`--em-yellow #fada56`, `--em-red #e5402d`, `--em-red-dark #c9301f`, `--em-ink #2b2b2b`,
     `--em-neutral-bg #f5f5f7`, `--em-white #ffffff`, LINE green `#06c755`). This decision is
     recorded in `design/DESIGN.md` right after the color token table.
   - Keep using the existing CSS classes/tokens already in `web/src/styles/global.css`
     (`.btn`, `.btn-line`, `.card`, `.section`, `.section-neutral`, `.section-yellow`,
     `.hero-heading`, `.badge`) rather than introducing Tailwind — the site doesn't use Tailwind,
     Stitch's output does (it's just an export format, not a dependency to adopt).
   - The site still needs to actually pull data from PocketBase (`getServices`,
     `getActivePromotions`, etc. in `web/src/lib/pocketbase.ts`) — Stitch's mockups use static
     placeholder content, don't lose the dynamic data-binding when porting layout/style.
3. After porting, rebuild (`npm run build` inside `web/`) and visually sanity-check before
   considering the design phase actually complete.
4. Once design + backend are both done, work through the launch TODO list already in
   `CLAUDE.md` (GCP VM provisioning via the `/wizard` script, GitHub Actions secrets, Turnstile
   widget creation, sandbox LINE OA, logo file copy, `git init`/push, Cloudflare DNS cutover,
   backup script VM setup, PDPA legal review of `privacy.astro`).

## Key decisions made
- **GCP over other clouds**: user has other projects already billed there, wants consolidated
  billing.
- **Astro + PocketBase over full CMS/e-commerce**: e-commerce (quotes/receipts) already handled
  by an external bookkeeper outside the website entirely — deliberately out of scope.
- **No booking/reservation system**: workshops/promotions just deep-link to LINE OA; the real
  business runs 100% through LINE DMs today.
- **Cloudflare Turnstile over other CAPTCHA**: free, unlimited, already using Cloudflare for DNS.
- **PDPA enforcement is server-side, not just the checkbox**: a required HTML checkbox alone
  doesn't stop a direct POST to the API.
- **Design direction "clean + minimal, with flair"**: explicitly modeled on 4 real apple.com/th
  pages (screenshotted, not guessed from memory) — huge whitespace, neutral `#f5f5f7` as the
  default second background, brand yellow demoted to a single sparse accent per page (was
  previously the default alternating-section color), flatter card shadows, pill buttons, white
  minimal header (not a yellow band).
- **Strip Stitch's invented blue accent, do not adopt it** — confirmed with the user this session;
  port using only the 7 original DESIGN.md tokens, nothing Stitch added on its own.
- **User is doing the `design/generated_screens/` cleanup by hand**, not Claude — Claude flagged
  which files are contamination but did not delete anything.

## Files changed or created
- `web/src/pages/contact.astro` — Turnstile now resets on every submit outcome (success or
  failure), not just success. Fixes a stuck-retry bug found this session.
- `design/DESIGN.md` — added a decision note after the color token table: strip Stitch's invented
  blue, port using exact hex values from the table.
- `CLAUDE.md` — added "Scrutinize round 3" (backup/PDPA fixes) and "Scrutinize round 4" (Stitch
  design audit + next-session task) sections; TODO-before-launch list is near the bottom.
- No other files changed this session — everything else (`docker-compose.yml`,
  `.github/workflows/deploy.yml`, `pocketbase/pb_migrations/1_collections.js`,
  `scripts/backup-to-drive.sh`, `web/src/pages/api/contact.ts`, `web/src/pages/privacy.astro`,
  `web/src/styles/global.css`, all other `.astro` pages) is unchanged from prior sessions and
  already scrutinized — see `CLAUDE.md`'s "Decisions from the Nth planning round" sections for
  full history.

## Context the next agent needs
- **PocketBase has never actually been booted in this sandbox** — the sandbox's network allowlist
  blocks `release-assets.githubusercontent.com`, so the PocketBase binary can't be downloaded
  here. All PocketBase-related verification in this project has been static/syntactic review
  only (`node --check`, careful reading against documented PocketBase semantics), never a live
  run. Flag this limitation again if asked to "verify" anything PocketBase-related — don't imply
  more confidence than static review actually supports.
- **`scripts/backup-to-drive.sh`'s `/api/backups` response-shape and auth-header assumptions are
  unverified** for the same reason — dry-run it by hand against the real VM before trusting the
  cron schedule.
- **The project lives at `J:\My Drive\Web EngMania\Website-EGM\`** — this is the single working
  copy (migrated from `D:\Web EnglishMania` earlier; that copy no longer exists). Always work
  here, not on D:.
- **Git has never been initialized in this repo** — `git init`/commit/push to
  `github.com/bornja55/Website-EGM` must be done by the user from their own machine (a sandbox
  mount to the Windows drive doesn't support git's file-locking semantics; this was tried and
  failed early in the project).
- **Logo file (`CI + Logo/logo new.png` → `web/public/images/logo.png`) still hasn't been
  copied** — binary file copy across drives wasn't possible with available tools; still a manual
  TODO for the user.
- **User preferences**: concise/direct responses, Thai as primary reply language (technical terms
  in English fine), step-by-step for how-to content, bullet-point summaries for long content,
  runnable code examples with comments on important lines.
- **`/scrutinize` in this project has consistently meant**: actually trace the code path and
  verify claims (rebuild, grep compiled output, execute snippets), not just re-read and restate
  intent — every round so far has found at least one real, fixable issue this way. Keep that bar
  for future scrutinize passes too.

## How to resume
Check whether `design/generated_screens/` has been pruned down to only the real English Mania
files yet (list the directory — if `ข้อมูลต้นทุเรียนรายต้น`, `Sovereign Global Holdings`,
`Origin Global Empire`, or `Green to Gold` files are still present, ask the user to finish
cleanup first). Once clean, start porting the Stitch mockups into `web/src/pages/` one page at a
time, beginning with `index.astro` (homepage) since it's the highest-traffic page — read the
matching Stitch HTML export, translate its layout/copy into the existing Astro+CSS-class pattern,
substitute Stitch's invented colors for the 7 tokens in `design/DESIGN.md`, then rebuild
(`cd web && npm run build`) to confirm no errors before moving to the next page.
