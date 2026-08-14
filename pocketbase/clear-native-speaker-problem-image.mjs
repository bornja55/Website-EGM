// One-off, IDEMPOTENT patch — clears the photo on native-speaker's
// "ปัญหาที่คอร์สนี้ช่วยแก้" section so it renders as a centred text-only block.
//
// No CSS change is needed: ProductTabs.astro already routes any section
// WITHOUT an image to `.section-item.is-text-only`, which is centred and
// capped at 640px. Removing the image is the whole change.
//
// patch-native-speaker-section-images.mjs has had this heading removed from
// its map in the same commit, so re-running that script won't put the photo
// back.
//
// Safe to re-run: does nothing once the field is already empty.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node clear-native-speaker-problem-image.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const HEADING = "ปัญหาที่คอร์สนี้ช่วยแก้";

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
  const section = sections.find((s) => s.heading === HEADING);
  if (!section) {
    console.error(`No section titled "${HEADING}" on native-speaker.`);
    process.exit(1);
  }
  if (!section.image) {
    console.log(`  (section "${HEADING}" already has no image, nothing to do)`);
    return;
  }

  const res = await fetch(`${PB_URL}/api/collections/course_sections/records/${section.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ image: "" }),
  });
  if (!res.ok) throw new Error(`patch failed: ${res.status} ${await res.text()}`);

  console.log(`  - cleared image on "${HEADING}" (was ${section.image})`);
  console.log("\nDone. That section now renders as a centred text-only block.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
