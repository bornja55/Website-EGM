# PRD: English Mania Website Rebuild

**Status**: Draft
**Author**: Siraphob (with Claude)
**Date**: 2026-08-08

---

## Problem

English Mania's website (English Mania by KruYam, a Thai English-tutoring business
run by ENGLISH MANIA CO., LTD., registration 0125568032059) currently runs on
MakeWebEasy, a rented page-builder SaaS (free plan, 66.2/100MB used, expiring
**2026-11-08**). The site hasn't been updated in roughly a year and no longer
reflects the business's actual activity — workshops (e.g. Insect Pinning Workshop,
2,599฿) and course promotions (e.g. 990฿ online 1:1) are posted actively on the
Facebook page (19K followers, 100% recommend from 14 reviews) but are entirely
absent from the website. The business is also locked into platform-specific
storage limits and lacks a code-owned, extensible foundation for planned future
automation (chatbot/RAG, auto-posting).

## Goals

- Fully migrate off MakeWebEasy before the 2026-11-08 plan expiry, at $0
  recurring hosting cost.
- Bring the website's content in line with what the business actually offers
  today (workshops, promotions) instead of ~1-year-stale copy.
- Keep the same brand identity (CI/logo) — no redesign needed, just a rebuild
  on new infrastructure.
- Ship in roughly a week, since scope is intentionally small.
- Build the content layer (PocketBase) as a clean API so it can be reused by
  phase-2 automation (chatbot/RAG, auto cross-posting) without a redesign.

## Non-goals

- E-commerce / shopping cart checkout.
- In-house quotation or tax-invoice/receipt generation — the company's external
  bookkeeper handles all of that outside the website.
- SMS notifications, marketplace listing — present in the old MakeWebEasy plan
  but unused in practice.
- On-site booking / seat-reservation system in v1 — the real business runs
  100% through LINE OA DMs today; the site just deep-links to LINE.
- Rebrand or visual redesign — CI (logo, yellow/red color scheme) stays exactly
  as-is.
- Chatbot + RAG and automated fanpage cross-posting — explicitly phase 2, not
  part of this build.

## Users

- **Primary**: parents/students discovering English Mania via Google or
  Facebook, browsing courses/workshops and deciding whether to contact via
  LINE.
- **Secondary**: Siraphob, who edits content directly via code (no non-dev CMS
  users) and handles deploys; the business's admin, who continues to manage
  bookings and payments through LINE OA outside the website.

## Requirements

### Must have (P0)
- Astro frontend + PocketBase headless CMS (SQLite, single binary), containerized
  via Docker Compose — mirrors the `empire-website` architecture pattern, scoped
  down.
- Pages: home, services, workshops, blog (index + post), about, faq, contact.
- Contact form writes to PocketBase `contact_submissions`; also mirrors to a
  Google Sheet (backup log) and sends a Gmail notification.
- PocketBase collections: `site_settings`, `services`, `workshops`,
  `promotions`, `testimonials`, `blog_posts`, `gallery_albums`/`gallery_images`,
  `faq`, `contact_submissions`, `editors`.
- Deploy target: GCP Compute Engine `e2-micro` (Always Free tier — region must
  be `us-west1`/`us-east1`/`us-central1`), billing consolidated under the
  user's existing GCP account.
- Domain `englishmania.co.th` (Cloudflare, user-managed) repointed from the old
  301 redirect to the new VM at cutover.
- CI/CD: GitHub Actions, build + deploy on push to `main`
  (`.github/workflows/deploy.yml`), repo at
  `github.com/bornja55/Website-EGM`.
- Use a **sandbox/test LINE OA** during development; only wire the production
  OA link at go-live, since the real one is actively used by customers daily.

### Should have (P1)
- Testimonials section, manually curated from Facebook/Google reviews (100%
  recommend, 14 reviews at time of writing) — no live API pull.
- `LocalBusiness` schema markup using registered company details (ENGLISH
  MANIA CO., LTD., registration 0125568032059) for SEO.
- Seed content (workshops, promotions) pulled from the latest Facebook posts
  rather than starting blank.

### Nice to have (P2)
- Blog/SEO content — the old site had none actively published.
- Full booking/seat-management system — revisit only if LINE-based booking
  volume outgrows manual handling.

## Success metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Recurring hosting cost | MakeWebEasy free plan (about to expire) | ฿0/เดือน (GCP Always Free) | At launch |
| Site reflects active promotions/workshops | 0 (not on site today) | All live FB workshops/promos mirrored on site | At launch |
| Migration completed before plan expiry | N/A | Live before 2026-11-08 | 2026-11-08 |
| Build time | N/A | ~1 week | From 2026-08-08 |

## Open questions

- **GitHub push**: repo scaffold was committed locally during this session, but
  the mounted project folder doesn't support git's file-locking operations, and
  Claude cannot enter GitHub credentials on the user's behalf either way — the
  user needs to `git init`/`add`/`commit`/`push` from their own machine.
- **GCP VM not yet provisioned** — `e2-micro` instance and the GitHub Actions
  secrets (`GCP_SSH_HOST`, `GCP_SSH_USER`, `GCP_SSH_KEY`, `SUPERUSER_EMAIL`,
  `SUPERUSER_PASS`) still need to be set up.
- **Sandbox LINE OA link** not yet supplied — placeholder in `seed.mjs`.
- **Google Maps embed URL** for the contact page not yet supplied.
- **Logo/brand assets** not yet copied into `web/public/images/` — blocked in
  this session by a cross-drive binary-copy limitation; manual step noted in
  `web/public/images/README.txt`.
- **About/Services copy** is ~1 year stale and needs a content pass from the
  user before launch.

## Out of scope

E-commerce/shopping cart, quotation and tax-invoice/receipt generation
(external bookkeeper's responsibility), SMS, marketplace listing, on-site
booking/seat-reservation, chatbot + RAG, and automated fanpage cross-posting
are all explicitly excluded from this build to prevent scope creep. The latter
two are planned as a separate phase-2 effort that will consume the same
PocketBase API built here.
