# English Mania — architecture notes

Rebuild of https://englishmania.co.th (Thai English-tutoring business, KruYam / English
Mania Co., Ltd., registration 0125568032059). Previously on MakeWebEasy (page builder
SaaS, free plan, expires 2026-11-08). Same brand identity (yellow circle + red speech
bubble logo), new stack, small feature set on purpose — this is a ~5-page small-business
site, not an enterprise rebuild.

Pattern borrowed from `empire-website` (Astro + PocketBase), scoped down: no
investor-relations section, no disclosure syncing, no dual-environment Jenkins deploy —
single environment, GitHub Actions instead of Jenkins, GCP `e2-micro` instead of a
shared company box.

## Stack

- **`web/`** — Astro site, `@astrojs/node` adapter, `standalone` mode. Pages that read
  from PocketBase use `export const prerender = false` so content edits show up without
  a rebuild.
- **`pocketbase/`** — PocketBase (SQLite, single Go binary). No separate DB server.
- Content flow: PocketBase REST API → `web/src/lib/pocketbase.ts` (plain `fetch`) → Astro
  pages.

## Content model (PocketBase collections)

- `site_settings` (singleton) — phone, LINE OA link (currently a **sandbox/test** OA,
  not the production one the business uses daily — swap before go-live), address, hours,
  company registration info, social links.
- `services` — the 4 existing service types (rent classroom, group class, 1:1 tutoring,
  online).
- `workshops` — limited-seat events (e.g. Insect Pinning Workshop). NOT a booking system
  in v1 — each workshop just links out to LINE OA to book. Fields: title, description,
  date, price, seats_total (display only, not decremented), cover_image, line_link.
- `promotions` — course pricing promos mirrored from Facebook posts (e.g. 990฿ online
  1:1). Fields: title, price, description, valid_until, line_link.
- `testimonials` — manually curated from Facebook/Google reviews (100% recommend, 14
  reviews at time of writing). No live API pull — copy/paste by hand.
- `blog_posts` — optional/SEO content, was unused on the old site.
- `gallery_albums` / `gallery_images` — activity photos.
- `faq`.
- `contact_submissions` — public-create, superuser-read. On create: (1) stored in
  PocketBase, (2) mirrored to a Google Sheet via the Sheets API as a human-friendly
  backup log, (3) notification email sent via Gmail API.
- `editors` — auth collection for content-writer access (not used for public site
  logic), same pattern as empire-website in case an AI-editor account is added later.

## Deliberately out of scope for v1

- E-commerce / shopping cart, quotations, formal receipts/tax invoices — the company's
  external bookkeeper handles all of that outside the website entirely.
- SMS, marketplace listing — present in the old MakeWebEasy plan but unused in practice.
- On-site booking/seat-reservation system — the real business runs 100% through LINE OA
  DMs today; workshops/promotions just deep-link to LINE. Revisit if volume outgrows
  manual LINE handling.
- Chatbot + RAG, automated cross-posting to Facebook/other fanpages — explicitly a
  phase-2 idea. Keep the PocketBase API clean/stable now so these can consume it later
  without a redesign.

## Deployment

- Host: GCP Compute Engine `e2-micro` (Always Free tier — must be in `us-west1`,
  `us-east1`, or `us-central1` to stay free), billed on the same account as the user's
  other GCP projects.
- Build happens on the dev machine / GitHub Actions runner — **not** on the e2-micro VM
  itself (too underpowered to build on).
- Domain `englishmania.co.th` — already owned, DNS on Cloudflare (user-managed). Points
  at the old 301 redirect today; repoint the A record to the new VM at cutover.
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) builds both Docker images on
  push to `main`, then SSHes into the VM and runs `docker compose up -d --build`.
  Required repo secrets (Settings → Secrets and variables → Actions):
  - `GCP_SSH_HOST` — VM external IP
  - `GCP_SSH_USER`
  - `GCP_SSH_KEY` — private key for the deploy user (set up a dedicated key, don't
    reuse a personal one)
  - `SUPERUSER_EMAIL` / `SUPERUSER_PASS` — PocketBase superuser, for first-boot only
  - `GOOGLE_SERVICE_ACCOUNT_JSON` — for Sheets API + Gmail API access
- TLS: terminate at Cloudflare (proxy mode), or certbot on the VM directly — decide once
  the VM is provisioned.

## Google ecosystem integrations

- **Gmail API** — send a notification email on new contact-form submissions.
- **Google Sheets API** — append a row per contact-form submission as a human-readable
  backup log (`web/src/pages/api/contact.ts`).
- **Google Maps Embed** — contact page.
- Billing consolidated under the user's existing GCP account (multiple other projects
  already live there).

## Status (as of 2026-08-08 scaffold)

Done: repo structure, PocketBase collection migrations, Astro page skeletons, brand
theme tokens from the existing logo, docker-compose, GitHub Actions workflow skeleton.
Project relocated from D:\Web EnglishMania to J:\My Drive\Web EngMania on 2026-08-08 —
this is now the single working copy.

## Decisions from the second planning round (2026-08-08)

- **TLS**: Cloudflare Proxy mode (Full) — Cloudflare terminates HTTPS; the VM
  serves plain HTTP behind it, port 443 is never opened on the VM itself.
- **Spam protection**: Cloudflare Turnstile on the contact form (free,
  unlimited requests, no per-verification cap). Implemented in
  `web/src/pages/contact.astro` (widget) and `web/src/pages/api/contact.ts`
  (server-side `siteverify` check). Silently no-ops (protection OFF, not a
  hard failure) if `TURNSTILE_SECRET_KEY` isn't set — don't ship to prod
  without it configured.
- **GCP VM provisioning**: via a generated bash wizard (not manual Console
  clicking) to avoid mistyped `gcloud` commands — see the wizard script this
  produced.
- **GitHub Actions secrets**: the user fills these in by hand from the
  checklist in README.md; Claude cannot touch credentials.
- **Sandbox LINE OA**: a brand-new "English Mania (Test)" OA, not reused from
  anything existing.
- **Google Maps embed**: resolved without an API key — plain
  `https://www.google.com/maps?q=<address>&output=embed`, already in
  `pocketbase/seed.mjs`.
- **About/Services copy**: shipping with the drafted-from-old-content version
  now; user will revise later rather than blocking launch on new copy.

## Decisions from the third planning round (2026-08-08, later same day)

- **Backups**: `pb_data` is now a bind mount (`/data/englishmania/pb_data` on
  the VM), not a Docker named volume, specifically so
  `scripts/backup-to-drive.sh` can run from host crontab without `docker
  exec`. The script uses PocketBase's own `/api/backups` endpoint (a
  consistent server-side zip snapshot) rather than copying live SQLite files,
  uploads to Google Drive via `rclone`, keeps 14 days by default. Needs
  one-time setup on the VM (rclone install + `rclone config` + crontab entry
  — see the script's header comment).
- **PDPA**: added `web/src/pages/privacy.astro` (draft privacy policy — NOT
  lawyer-reviewed, has placeholder brackets to fill in, get an actual PDPA
  reviewer before launch) and a required consent checkbox on the contact
  form, enforced both client-side (UX) and server-side in `api/contact.ts`
  (real enforcement — a required checkbox alone doesn't stop a direct POST).
  `contact_submissions` now has a required `consent_given` bool field as the
  audit trail.

TODO before launch:
- Provision the GCP `e2-micro` VM (wizard script) and fill in the GitHub
  Actions secrets checklist in README.md.
- Create the Cloudflare Turnstile widget for `englishmania.co.th` and the new
  sandbox LINE OA; feed both sets of keys/links into the secrets checklist /
  `seed.mjs`.
- Point Cloudflare DNS at the new VM at cutover (currently 301-redirects to
  `ballevrtgab.makeweb.co`), and set the proxy to Full mode.
- Copy `CI + Logo\logo new.png` into `web/public/images/logo.png` (see that
  folder's README.txt) — still blocked on binary file copy in-session.
- `git init` this folder and push to `github.com/bornja55/Website-EGM` from
  your own machine (Claude cannot handle GitHub credentials) — the repo is
  still empty, so the GitHub Actions workflow is unexercised until this
  happens.
- Revise the About/Services copy (currently ported from the ~1-year-stale old
  site) when you're ready.
- Set up `scripts/backup-to-drive.sh` on the VM (rclone + crontab) — see the
  script's header for the one-time steps.
- Get `web/src/pages/privacy.astro` reviewed by someone PDPA-qualified before
  launch; fill in the `[bracketed placeholders]` (retention period, last
  updated date).

## Scrutinize round 3 (2026-08-08)

- **Fixed**: contact.astro didn't reset the Turnstile widget on a failed
  submit, only on success. Turnstile tokens are single-use and get consumed
  by `siteverify` before the PocketBase write even happens — so any failure
  after that point (PB down, network blip) left the button enabled with an
  already-spent token, meaning retry would fail Turnstile a second time
  every time. Now resets `turnstile.reset()` and re-disables the button in
  a `finally` block covering both outcomes.
- **Not yet verified live**: `scripts/backup-to-drive.sh`'s assumptions
  about `/api/backups`'s response shape (flat array) and auth header
  (`Authorization: <token>`, no `Bearer` prefix) — still can't boot
  PocketBase in this sandbox to confirm. Dry-run this script by hand against
  the real VM before trusting the cron schedule with it.

## Scrutinize round 4 (2026-08-08) — Stitch design output review

- **Found**: `design/generated_screens/` (20 files) had output from at least
  3-4 unrelated Stitch projects mixed in with the real English Mania
  screens — a durian-farm tracking app, a "Sovereign Global Holdings"
  investor-relations dashboard, 4x "Origin Global Empire" screens, and a
  "Green to Gold" services page with an unrelated olive/gold palette. User
  is deleting these by hand — **if you see any of those names still in this
  folder next session, they weren't cleaned up yet, don't port them.**
- **Found**: even the correctly-named English Mania screens didn't follow
  `DESIGN.md`'s 7 locked color tokens — Stitch invented its own Material-You
  palette including a `tertiary` blue family (`#006385` etc.) with no basis
  in this brand, plus near-but-not-exact reds/yellows. **Decision: strip the
  invented blue entirely, port colors using the exact hex values in
  `DESIGN.md`'s token table, not whatever class names Stitch generated.**
  See the decision note added directly in `design/DESIGN.md`.
- **Not done yet**: none of the Stitch HTML/CSS has been ported into
  `web/src` — every `.astro` page/component is still the pre-Stitch
  skeleton. **This is next session's main task**: once the user has pruned
  `design/generated_screens/` down to the real ~8 English Mania screens,
  port each into its matching Astro page/component, applying the color-token
  substitution above as you go (don't copy Stitch's Tailwind color classes
  verbatim — map them to the existing `global.css` tokens/classes).
