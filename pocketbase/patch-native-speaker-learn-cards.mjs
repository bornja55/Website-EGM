// One-off, IDEMPOTENT patch — converts native-speaker's "เรียนอะไรบ้าง"
// section into the apple.com "iPhone essentials." TWO-CARD row (see
// pb_migrations/6_add_section_card_layout.js for the schema, ProductTabs.astro
// for the rendering).
//
// Requires migration 6 to have been applied first (start PocketBase once and
// it auto-applies). If `layout`/`group_heading` don't exist yet this script
// exits with a clear error instead of silently writing nothing.
//
// What it does:
//   1. Patches the existing "เรียนอะไรบ้าง" record into CARD 1 —
//      group_heading = "เรียนอะไรบ้าง" (the big heading above the row),
//      heading       = the card's own short title,
//      body/image    = UNCHANGED (real content + real photo, already live).
//   2. Creates CARD 2 ("หนังสือและเอกสารประกอบการเรียน") right after it.
//
// Card 2's body is REAL content, confirmed by Siraphob: the institute's own
// materials plus the California and Oxford English books, ป.1-6. The only
// still-unknown detail is which series/level of each — kept out of the copy
// rather than guessed, so nothing here needs a [MOCKUP] marker.
//
// Card 2's image is /images/courses/books-english-mania.jpg — English Mania's
// OWN "ภาษาอังกฤษ / ABC" A4 cover, supplied by Siraphob ("A4 ปก อังกฤษ.pdf",
// the school's own artwork, so no third-party rights involved). Publisher
// cover art for California/Oxford was deliberately NOT used: those are
// copyrighted and this is a commercial page. If the school later wants the
// commercial books shown too, the safe asset is a photo of their own copies.
//
// The tile was composed from that PDF, not used raw: the cover is A4 portrait
// and the card's media slot is 4:3 landscape, so used directly it would either
// crop the artwork or letterbox. Recipe — render page 1 at 200dpi, scale it to
// the FULL height of a 1400x1050 (4:3) canvas, centre horizontally, flush to
// the bottom edge, soft drop shadow, save as PNG with a TRANSPARENT
// background. Transparent (not #f5f5f7) matters: the card's own background
// shows through, so there's no second grey rectangle with a visible edge
// inside the grey card. Flush-to-bottom matters too — it lines the cover up
// with the left card's full-bleed photo. Re-run the recipe if the art changes;
// the same tile for all 4 subjects lives in "D:\Web EnglishMania\Book + doc".
//
// Safe to re-run: card 1 is only patched if it isn't already layout="card",
// and card 2 is only created if no section with that heading exists yet.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-native-speaker-learn-cards.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;
const CARD2_IMAGE = process.env.CARD2_IMAGE || "/images/courses/books-english-mania.png";

const GROUP_HEADING = "เรียนอะไรบ้าง";
const CARD1_HEADING = "ครูไทย + ครู Native ในคลาสเดียว";
const CARD2_HEADING = "หนังสือและเอกสารประกอบการเรียน";
const CARD2_BODY =
  "<p>เรียนจากเอกสารที่สถาบันเรียบเรียงเอง ควบคู่กับหนังสือ California " +
  "และ Oxford สำหรับภาษาอังกฤษระดับ ป.1-6</p>";

async function authAdmin() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`admin auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

async function listAll(token, collection, filter) {
  const qs = filter ? `&filter=${encodeURIComponent(filter)}` : "";
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=200${qs}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).items;
}

async function patch(token, collection, id, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`patch ${collection}/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function create(token, collection, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`create ${collection} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const [course] = await listAll(token, "courses", `slug="native-speaker"`);
  if (!course) {
    console.error('courses/"native-speaker" not found.');
    process.exit(1);
  }

  const sections = await listAll(token, "course_sections", `course="${course.id}"`);

  // Fail loudly if migration 6 hasn't been applied — otherwise PocketBase
  // would accept the PATCH and quietly drop the unknown fields, and the page
  // would look unchanged with no explanation.
  const sample = sections[0];
  if (sample && !("layout" in sample)) {
    console.error(
      "course_sections has no `layout` field — migration 6_add_section_card_layout.js " +
        "hasn't been applied yet. Restart PocketBase (it auto-applies pb_migrations) and re-run."
    );
    process.exit(1);
  }

  // --- card 1: the existing section, re-flagged ----------------------------
  const card1 =
    sections.find((s) => s.heading === GROUP_HEADING) ||
    sections.find((s) => s.heading === CARD1_HEADING);
  if (!card1) {
    console.error(`No section titled "${GROUP_HEADING}" (or "${CARD1_HEADING}") on native-speaker.`);
    process.exit(1);
  }
  if (card1.layout === "card") {
    console.log(`  (card 1 "${card1.heading}" already flagged layout=card, skipping)`);
  } else {
    await patch(token, "course_sections", card1.id, {
      layout: "card",
      group_heading: GROUP_HEADING,
      heading: CARD1_HEADING,
    });
    console.log(`  + card 1: "${GROUP_HEADING}" -> "${CARD1_HEADING}" (body/image untouched)`);
  }

  // --- card 2: books / institute documents ---------------------------------
  const existingCard2 = sections.find((s) => s.heading === CARD2_HEADING);
  if (existingCard2) {
    // "Already exists" is NOT the same as "already correct": an earlier run of
    // this script created card 2 before the cover tile existed, so the record
    // is there with an empty image and a plain existence check would skip it
    // forever. Backfill anything still blank — same "only fill if empty, never
    // clobber" rule as patch-native-speaker-section-images.mjs.
    const fix = {};
    // The first version of this tile was an opaque .jpg on a #f5f5f7 canvas;
    // it was replaced by a transparent .png (see the recipe note at the top).
    // That one specific superseded path is safe to overwrite — anything else
    // is treated as a real editorial choice and left alone.
    const SUPERSEDED = "/images/courses/books-english-mania.jpg";
    if ((!existingCard2.image || existingCard2.image === SUPERSEDED) && CARD2_IMAGE) {
      fix.image = CARD2_IMAGE;
    }
    if (existingCard2.layout !== "card") fix.layout = "card";
    if (Object.keys(fix).length > 0) {
      await patch(token, "course_sections", existingCard2.id, fix);
      console.log(`  ~ card 2 "${CARD2_HEADING}" backfilled: ${JSON.stringify(fix)}`);
    } else {
      console.log(`  (card 2 "${CARD2_HEADING}" already complete, skipping)`);
    }
  } else {
    // +0.5 slots it immediately after card 1 without renumbering every other
    // section (sort_order is a plain number field, decimals are fine).
    await create(token, "course_sections", {
      course: course.id,
      heading: CARD2_HEADING,
      body: CARD2_BODY,
      image: CARD2_IMAGE,
      sort_order: (card1.sort_order ?? 0) + 0.5,
      layout: "card",
      group_heading: "", // only the first card of the run carries it
    });
    console.log(`  + card 2: "${CARD2_HEADING}" (image ${CARD2_IMAGE})`);
  }

  console.log("\nDone. Reload /course/native-speaker and check the เนื้อหา tab.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
