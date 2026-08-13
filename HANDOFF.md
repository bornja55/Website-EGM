# Handoff: English Mania website — real content pass + team page (blocked on a PocketBase seed error)

## Status
All 8 original pages were previously ported to Astro and building clean (see git history —
that work is done and out of scope for this handoff). This session's work was a "replace
placeholder content with real content" pass: real business data was pulled from the live old
site, the business's Facebook Page, and two OneDrive asset folders, and wired into the code.
That code work is complete and committed-ready, but **it has not been verified end-to-end** —
the user's local PocketBase reseed is currently failing with generic 400 errors on every
collection, and a 404 on the new `tutors` collection. This is the single open blocker.

## Goal
User (Siraphob) is rebuilding englishmania.co.th (Thai tutoring business "English Mania by
KruYam") in Astro + PocketBase. This session's specific ask, over several turns: stop using
placeholder/mockup content and replace it with real, verifiable data — real address/contact
info, real course catalog and prices, real testimonials, real photography, and (once real
tutor profile data was discovered) a real team page. User explicitly refuses fabricated
content — every claim added this session traces back to a named source (old live site, FB
Page, or an OneDrive folder). User prefers concise, step-by-step, Thai-language replies.

## What's done
- **Real business data corrected in `pocketbase/seed.mjs`**:
  - Fixed a wrong address (was "...บางบัวทอง...", real one is "...เขตบางใหญ่...", confirmed
    from the old live site's `/contact` page).
  - Added real email `englishmaniabkk@gmail.com` (new `site_settings.email` field).
  - Expanded `services` from 4 generic delivery-mode rows to 17 real subject-catalog rows
    grouped by category (ภาษาอังกฤษ/คณิตศาสตร์/วิทยาศาสตร์/อื่นๆ), sourced from the old
    site's footer menu.
  - Added 9 real named courses with real prices to `promotions` (sourced from the old site's
    `/course` page).
  - Added real detail to the one seeded `workshops` record (Insect Pinning Workshop): seat
    count (10, from a promo flyer found in the FB photo export), and a **real next event date,
    2026-08-22, which the user supplied directly in chat** — do not treat this as inferred.
  - **Testimonials were replaced twice**: first with 3 "real named student achievements" (from
    the old site's carousel, used because no review *text* could be found at the time), then
    **replaced again with 5 real Google/Facebook review quotes** once an OneDrive folder with
    actual review screenshots was found. The current seed data is the 5-review version — the
    achievement-based version is superseded, not both.
- **New `tutors` collection + `/team` page** — a real 9-person tutor roster (including the
  founder) was found as designed profile-card graphics in OneDrive. Data (education,
  credentials, subjects) was transcribed from those cards into `pocketbase/seed.mjs`. Photos
  were cropped out of each card (fixed crop box `360x360+90+95` on the source 1040x1040
  images — same template across all 9) and saved to `web/public/images/tutors/*.jpg`.
- **Real photography wired into 3 pages** (Home, About, Services all had zero real photography
  before): see "Files changed" below for exact files/sources.
- **Fixed a real bug**: the site header was serving `logo2.png` (a blue/red variant) renamed to
  `logo.png`, instead of the correct yellow-circle CI mark. Fixed by copying the correct source
  file over.
- **New PocketBase migrations** (`2_add_service_category_and_email.js`,
  `3_add_tutors.js`) add the `services.category` field, `site_settings.email` field, and the
  whole `tutors` collection. **These have not been confirmed to actually apply** — see Status.

## What's next
1. **Unblock the PocketBase reseed** (see below, this is the immediate next step).
2. Once seeding succeeds, visually check all pages via `npm run dev`, especially: Home/About/
   Services (new photo-bleed sections), Workshops (new cover image + real seat count/date),
   `/team` (new page, not yet visually verified at all), Home testimonials section (new
   Google/Facebook source labels).
3. Commit + push. Nothing from this session has been committed yet.
4. Optional, not yet asked for by user but flagged as available: ~20 more real reviews and 8
   more student-achievement graphics exist unused in the OneDrive `รีวิว/` and `Congratulation/`
   folders — could support a dedicated reviews page later. Also more course photos in `คอร์ส/`.
5. Resume the original pre-launch checklist (GCP VM, GitHub Actions secrets, Turnstile, LINE
   OA, DNS cutover, PDPA legal review) — untouched this session, still outstanding from before.

### Debugging the seed failure (do this first)
Latest `node seed.mjs` run produced: 404 "Missing or invalid collection context" for every
`tutors` insert (collection doesn't exist yet — migration 3 never applied), and a generic 400
"Failed to create record" with an **empty** `data` object for every other collection, including
`testimonials` whose schema didn't even change this session. That last part is the confusing
part — it means this probably isn't a simple "new field doesn't exist yet" issue, or at least
not only that.

Most likely cause: the user's `pocketbase serve` process was never restarted after the new
migration files were added, so it's still running the old (pre-this-session) schema in memory.
Already asked the user to: stop the server, check for/delete `pb_data`, restart
`pocketbase serve` and paste back the startup log (should show 3 migrations applying), then
re-run `superuser upsert` + `node seed.mjs`. **That response hasn't arrived yet — check for it
first before re-diagnosing from scratch.** If the restart alone doesn't fix it, the next
diagnostic step suggested was: open the PocketBase Admin UI (`http://127.0.0.1:8090/_/`) and
try creating one `services` record by hand, since the UI surfaces the actual per-field
validation error instead of the SDK's generic empty-data message.

## Key decisions made
- **Chose real customer reviews over the achievement-based testimonials** once real review text
  was found — the achievement approach was a deliberate compromise for "I won't fabricate
  testimonials" when no real review text was available; once real text turned up, it fully
  replaced that compromise rather than supplementing it.
- **Chose photos from the business's own Facebook Page/photo export and two OneDrive folders
  over any stock/AI imagery** — matches this project's standing rule (see PRD.md / DESIGN.md)
  of never inventing content that isn't real and sourced.
- **Built `/team` as a genuinely new page**, not in the original 8-page scope — user explicitly
  approved this scope addition when asked (see "How to resume" for the exact question asked/
  answered, in case it needs re-confirming with a fresh reviewer).
- **Left the Insect Pinning Workshop's `event_date` unset until the user supplied a real one**
  rather than guessing — the photos found were from a session that had already happened
  (25 July), and only after the user was asked did they supply 2026-08-22 as the real next date.
- **Declined to unilaterally pursue a full "Apple.com-style" redesign** when the user first
  asked for one — investigated first (found a real bug: wrong logo file), then scoped the ask
  down to what DESIGN.md already called for (full-bleed real photography) rather than a full
  visual overhaul, since DESIGN.md already documents an Apple-inspired direction from an earlier
  session and a full redesign would conflict with PRD.md's explicit "no redesign" non-goal.

## Files changed or created
- `pocketbase/seed.mjs` — extensively rewritten, see "What's done" above. Read the whole file,
  it's short enough — don't rely on this summary for exact field values.
- `pocketbase/pb_migrations/2_add_service_category_and_email.js` — new.
- `pocketbase/pb_migrations/3_add_tutors.js` — new.
- `web/src/lib/pocketbase.ts` — added `email`/`category` to existing interfaces, added `Tutor`
  interface + `getTutors()`.
- `web/src/pages/team.astro` — new page.
- `web/src/components/Header.astro` — added nav link to `/team`.
- `web/src/pages/index.astro` — added a full-bleed photo section after the hero; testimonials
  section subtitle and source-label rendering updated for real Google/Facebook reviews.
- `web/src/pages/about.astro` — added a full-bleed photo section (replacing an old TODO
  comment) and a new founder portrait section.
- `web/src/pages/services.astro` — added a full-bleed photo section; also (from earlier in this
  session) reworked to group service cards by `category`.
- `web/public/images/logo.png` — replaced (was the wrong file, see bug fix above).
- `web/public/images/classroom.jpg`, `services-tutoring.jpg`, `kruyam-portrait.jpg`,
  `workshops/insect-pinning-specimen.jpg`, `workshops/insect-pinning-craft.jpg`,
  `tutors/*.jpg` (9 files) — all new, all real photos. Exact source file for each is recorded
  in `web/public/images/README.txt` — read that file, it's the authoritative source list.

## Context the next agent needs
- **Three extra folders were connected mid-session via `request_cowork_directory`** beyond the
  original `D:\Web EnglishMania\` mount:
  `C:\Users\siraphob.a\OneDrive\English Mania Ball\English mania x boat\` (founder portrait,
  a signage design file) and `C:\Users\siraphob.a\OneDrive\English Mania Ball\Web\` (the big
  one — tutor profiles, review screenshots, achievement graphics, course photos). If a fresh
  session doesn't have these mounted, it will need to request them again before any of the
  "unused real assets" mentioned above are reachable.
- **A separate `D:\Web EnglishMania\FB raw\Export_1786443238_452bc550\` folder** holds 1137
  photos exported from the FB Page directly (2018-2026 by file date). Already mined for a few
  good photos (see README.txt in images folder); not exhaustively reviewed — a subagent sampled
  ~45 of them and reported a shortlist, most of which is still unused.
- **Read tool quirk**: fails with a generic `EUNKNOWN` error on some pure-Thai filenames (no
  Latin characters mixed in) inside the OneDrive folders, even though the files are completely
  fine — confirmed via `file` and `cp` in bash. Workaround used throughout this session: `cp`
  the file to an ASCII filename first (bash has no trouble with the Thai paths), then `Read`
  the copy.
- **PocketBase has never been successfully booted+seeded from inside this sandbox** — the
  sandbox can't reach the PocketBase binary download or the user's local `127.0.0.1:8090`. All
  seeding/build verification for this whole project has always had to happen in the user's own
  PowerShell. This session's blocker (see "What's next") is happening on the user's machine, not
  observable directly by the agent — rely on the user pasting back terminal output.
- **The user's local PocketBase superuser credentials used in this session**:
  email `siraphob.an@gmail.com`, password `P@ssw0rd` (as typed by the user in chat — a
  throwaway local-dev password, not a secret worth protecting, but note it's not from
  `.credentials`/`.env.example`, it's whatever the user actually typed when running
  `superuser upsert`).
- **User's tone/workflow preferences** (consistent across a very long session): concise Thai
  replies, step-by-step PowerShell instructions when something needs to run on their machine,
  no unilateral large scope changes without asking first (see the AskUserQuestion calls used
  before building `/team` and before replacing testimonials) — keep using that pattern for any
  further scope-expanding discoveries in the OneDrive folders.

## How to resume
1. Check the conversation for whether the user already replied with the `pocketbase serve`
   restart log / reseed result requested in the last message before this handoff was generated.
   If not, that's the literal next question to ask.
2. Once seeding succeeds, ask the user to run `npm run dev` and visually check `/`, `/about`,
   `/services`, `/workshops`, and the new `/team` page — none of the new photo/team work has
   been visually confirmed by anyone yet, only written and reasoned about.
3. Then commit + push (nothing from this session is committed).
