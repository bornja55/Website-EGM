// One-off, IDEMPOTENT patch — attaches real photos to 3 of the 6
// course_sections on the "native-speaker" course (the agreed mockup/test
// course for the sticky-tabs redesign). Purely visual: proves out the
// apple.com-style "big headline directly on a big photo" rhythm inside the
// เนื้อหา tab before rolling it out further. Alternates photo / no-photo
// sections on purpose (Apple's own feature pages don't put an image under
// every single headline either).
//
// All 3 images are real photos already vetted and copied into
// web/public/images/gallery/ for the gallery_images seed (see
// seed-gallery-images.mjs) — general English-classroom shots, a reasonable
// match for a general English course. No fabricated content.
//
// Safe to re-run: only patches a section if its `image` field is currently
// empty, so it never clobbers a real photo added later via the Admin UI.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-native-speaker-section-images.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

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

// heading -> image path
//
// "ปัญหาที่คอร์สนี้ช่วยแก้" was REMOVED from this map: Siraphob asked for that
// section to go back to a centred text-only block. Leaving it here would have
// silently re-attached the photo the next time this script ran.
// "เรียนอะไรบ้าง" is now an accordion/card group and owns its own images
// (patch-native-speaker-learn-cards.mjs), but it is left in place because the
// "only patch if empty" guard below means it can no longer take effect.
const IMAGE_BY_HEADING = {
  "เรียนอะไรบ้าง": "/images/gallery/english-writing-01.jpg",
  "ผลลัพธ์หลังเรียนจบ": "/images/gallery/english-coloring-01.jpg",
};

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const courses = await listAll(token, "courses", `slug="native-speaker"`);
  const course = courses[0];
  if (!course) {
    console.error('courses/"native-speaker" not found.');
    process.exit(1);
  }

  const sections = await listAll(token, "course_sections", `course="${course.id}"`);

  let patched = 0;
  let skipped = 0;
  for (const [heading, image] of Object.entries(IMAGE_BY_HEADING)) {
    const section = sections.find((s) => s.heading === heading);
    if (!section) {
      console.warn(`  ! section "${heading}" not found on native-speaker — skipping.`);
      continue;
    }
    if (section.image) {
      console.log(`  (section "${heading}" already has an image, skipping)`);
      skipped++;
      continue;
    }
    await patch(token, "course_sections", section.id, { image });
    console.log(`  + set image on "${heading}" -> ${image}`);
    patched++;
  }

  console.log(`\nDone. ${patched} sections patched, ${skipped} already had an image.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
