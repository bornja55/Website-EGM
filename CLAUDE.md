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

TODO before launch:
- Flesh out real copy from the old MakeWebEasy site (About/Services/Stats/tutors) —
  site hasn't been updated in ~1 year, expect edits.
- Pull latest workshop/promotion content from the English Mania Facebook page as seed
  data.
- Provision the GCP `e2-micro` VM and populate GitHub Actions secrets.
- Set up the sandbox/test LINE OA for dev; swap to production OA link only at go-live.
- Point Cloudflare DNS at the new VM at cutover (currently 301-redirects to
  `ballevrtgab.makeweb.co`).
- Copy `CI + Logo\logo new.png` into `web/public/images/logo.png` (see that folder's
  README.txt).
- `git init` this folder and push to `github.com/bornja55/Website-EGM` from your own
  machine (Claude cannot handle GitHub credentials).
