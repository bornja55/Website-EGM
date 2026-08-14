// One-off, IDEMPOTENT delete — removes the "รูปแบบการเรียน" course_sections
// record from native-speaker's story-content list. Now redundant: this
// heading's info (day/time/price) moved into the new content-summary stat
// row at the top of the เนื้อหา tab (see web/src/components/ProductTabs.astro
// `.content-summary`, wired from web/src/pages/course/[slug].astro). Keeping
// both would show the same schedule info twice on the page.
//
// Deliberately narrow: only touches native-speaker (the one course this
// summary block has been mocked up on), and only deletes a record whose
// heading is EXACTLY "รูปแบบการเรียน" — never touches the other 5 headings.
//
// Safe to re-run: if the record is already gone, it just reports that and
// exits cleanly.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node remove-native-speaker-schedule-section.mjs

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

async function del(token, collection, id) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`delete ${collection}/${id} failed: ${res.status} ${await res.text()}`);
}

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
  const target = sections.find((s) => s.heading === "รูปแบบการเรียน");

  if (!target) {
    console.log('  (no "รูปแบบการเรียน" section found on native-speaker — already removed, nothing to do)');
    return;
  }

  await del(token, "course_sections", target.id);
  console.log('  - deleted "รูปแบบการเรียน" section (id: ' + target.id + ') from native-speaker');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
