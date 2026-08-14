// One-off, IDEMPOTENT patch script — fixes the course/workshop photo problem
// found this session: the 9 files in web/public/images/courses/*.jpg were
// Facebook AD GRAPHICS (price/QR/text overlays baked in), not real photos,
// contradicting HANDOFF.md's stale claim that they were "9 real photos
// matched from OneDrive". Verified by directly viewing every file.
//
// The OneDrive `.../Web/คอร์ส/` folder HANDOFF referenced is not reachable
// from this environment, so replacements were sourced from FB raw export
// (`FB raw/Export_1786443238_452bc550/`, 1,137 photos, no captions/dates —
// classified by aspect ratio to separate real camera photos, ~4:3, from
// square/9:16 ad-graphic exports) per Siraphob's explicit choice (2026-08-13:
// "ใช้ FB raw ไปก่อน"). These are real English Mania classroom/activity
// photos but NOT subject-matched to each course (no captions to match on) —
// generic tutoring/classroom fallback per HANDOFF's own matching-pass rule.
//
// This script only patches the 3 DB records whose image path was null (the
// file path itself is unchanged for the other 9 — only the file *content*
// on disk changed, which needs no DB update). Safe to re-run.
//
// Usage: source .credentials && node patch-course-photos.mjs

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

async function listAll(token, collection) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=200`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).items;
}

async function updateRecord(token, collection, id, patch) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update ${collection}/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

const PATCHES = [
  {
    collection: "courses",
    slug: "english-foundation",
    field: "image",
    value: "/images/courses/english-foundation.jpg",
  },
  {
    collection: "courses",
    slug: "exclusive-english-mentoring", // "Exclusive English Mentoring by English Mania"
    field: "image",
    value: "/images/courses/exclusive-english-mentoring.jpg",
  },
  {
    collection: "workshops",
    slug: "stem-fun-lab",
    field: "cover_image",
    value: "/images/workshops/stem-fun-lab.jpg",
  },
];

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS (source .credentials first).");
    process.exit(1);
  }
  const token = await authAdmin();
  const cache = {};

  console.log("--- Patching photo fields (null -> real FB-raw photo) ---");
  for (const p of PATCHES) {
    if (!cache[p.collection]) cache[p.collection] = await listAll(token, p.collection);
    const rec = cache[p.collection].find((r) => r.slug === p.slug);
    if (!rec) {
      console.warn(`  ! slug "${p.slug}" not found in ${p.collection} — skipping (check it hasn't been renamed).`);
      continue;
    }
    if (rec[p.field] === p.value) {
      console.log(`  (${p.collection}/${rec.id} "${p.slug}" already has this ${p.field}, skipping)`);
      continue;
    }
    await updateRecord(token, p.collection, rec.id, { [p.field]: p.value });
    console.log(`  + patched ${p.collection}/${rec.id} "${p.slug}" — ${p.field} -> ${p.value}`);
  }

  console.log(
    "\nDone. The other 9 course images (entrance-exam-m1, grade-booster-weekday/weekend, japanese, " +
      "native-speaker, physics-sunday, private-one-on-one, tgat-a-level, genious-summer-intensive) " +
      "needed no DB change — same file path, new file content. Re-run `npm run dev` and check /course."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
