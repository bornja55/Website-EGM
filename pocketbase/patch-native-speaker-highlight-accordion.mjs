// One-off, IDEMPOTENT patch — turns native-speaker's "จุดเด่นของ English Mania"
// section into the apple.com "Significant others." 3-row ACCORDION (see
// pb_migrations/7_add_section_accordion_layout.js for the schema and
// ProductTabs.astro for the rendering).
//
// Requires migrations 6 AND 7. Restart PocketBase once to auto-apply them; the
// script checks and exits with a clear error rather than writing silently.
//
// What it does:
//   1. Patches the existing "จุดเด่นของ English Mania" record into ROW 1 —
//      group_heading = "จุดเด่นของ English Mania" (heading above the panel),
//      heading       = row 1's question,
//      layout        = "accordion".
//   2. Creates rows 2 and 3 after it.
//
// CONTENT WARNING — all three answers are MOCKUP text carrying the
// "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]" prefix, the project's standing exception for
// clearly-marked placeholder copy. The section they replace was already mockup
// (from seed-course-sections-mockup.mjs), so nothing real is being overwritten.
// The three questions themselves are also provisional — Siraphob has not
// supplied the real ones yet. Everything here must be replaced with answers
// from ครูแยม before this page is advertised against.
//
// Images are REAL photos already vetted into web/public/images/gallery/ for the
// gallery seed. Each row shows a different one so the picture beside the panel
// visibly changes as rows are opened — no fabricated imagery.
//
// Safe to re-run: row 1 is only patched if it isn't already layout="accordion",
// and rows 2-3 are only created if no section with that heading exists yet;
// existing rows get blank fields backfilled but never overwritten.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-native-speaker-highlight-accordion.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const GROUP_HEADING = "จุดเด่นของ English Mania";
const MOCK = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";

const ROWS = [
  {
    heading: "สอนโดยครูแยมและครูเจ้าของภาษา",
    body:
      `<p>${MOCK} อธิบายว่าทีมผู้สอนเป็นใคร ประสบการณ์กี่ปี จบจากไหน ` +
      `ครู Native มาจากประเทศอะไร และแบ่งหน้าที่กันสอนอย่างไร ` +
      `(ใส่เฉพาะข้อมูลที่ยืนยันได้จริง)</p>`,
    image: "/images/gallery/english-teens-01.jpg",
  },
  {
    heading: "เรียนกลุ่มเล็ก ดูแลทั่วถึง",
    body:
      `<p>${MOCK} ระบุจำนวนนักเรียนต่อห้องจริง และบอกว่าขนาดกลุ่มเท่านี้ ` +
      `ทำให้ครูทำอะไรให้นักเรียนได้บ้างที่ห้องใหญ่ทำไม่ได้ ` +
      `(ถ้าจำนวนไม่คงที่ ให้เขียนเป็นช่วง อย่าระบุตัวเลขที่ทำไม่ได้จริง)</p>`,
    image: "/images/gallery/english-lowtable-01.jpg",
  },
  {
    heading: "มีเอกสารและแบบฝึกของสถาบันเอง",
    body:
      `<p>${MOCK} อธิบายว่าเอกสารที่สถาบันทำเองครอบคลุมอะไร ` +
      `ใช้คู่กับหนังสือ California/Oxford อย่างไร และนักเรียนได้กลับไปทำที่บ้านไหม ` +
      `(ต่อยอดจากการ์ด "หนังสือและเอกสารประกอบการเรียน" ด้านบน ไม่ควรเขียนซ้ำ)</p>`,
    image: "/images/gallery/english-writing-01.jpg",
  },
];

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
  if (sections[0] && !("layout" in sections[0])) {
    console.error(
      "course_sections has no `layout` field — migrations 6/7 haven't been applied. " +
        "Restart PocketBase (it auto-applies pb_migrations) and re-run."
    );
    process.exit(1);
  }

  // Row 1 reuses the existing section record so its position in sort_order,
  // and any edits already made to it, are preserved.
  const row1 =
    sections.find((s) => s.heading === GROUP_HEADING) ||
    sections.find((s) => s.heading === ROWS[0].heading);
  if (!row1) {
    console.error(`No section titled "${GROUP_HEADING}" (or "${ROWS[0].heading}") on native-speaker.`);
    process.exit(1);
  }

  if (row1.layout === "accordion") {
    console.log(`  (row 1 "${row1.heading}" already an accordion row, skipping)`);
  } else {
    await patch(token, "course_sections", row1.id, {
      layout: "accordion",
      group_heading: GROUP_HEADING,
      heading: ROWS[0].heading,
      body: ROWS[0].body,
      image: ROWS[0].image,
    });
    console.log(`  + row 1: "${GROUP_HEADING}" -> "${ROWS[0].heading}"`);
  }

  // Rows 2-3 sit immediately after row 1. sort_order is a plain number field,
  // so fractional steps slot them in without renumbering the whole section list.
  for (let i = 1; i < ROWS.length; i++) {
    const row = ROWS[i];
    const existing = sections.find((s) => s.heading === row.heading);
    if (existing) {
      const fix = {};
      if (existing.layout !== "accordion") fix.layout = "accordion";
      if (!existing.image) fix.image = row.image;
      if (Object.keys(fix).length > 0) {
        await patch(token, "course_sections", existing.id, fix);
        console.log(`  ~ row ${i + 1} "${row.heading}" backfilled: ${JSON.stringify(fix)}`);
      } else {
        console.log(`  (row ${i + 1} "${row.heading}" already complete, skipping)`);
      }
      continue;
    }
    await create(token, "course_sections", {
      course: course.id,
      heading: row.heading,
      body: row.body,
      image: row.image,
      sort_order: (row1.sort_order ?? 0) + i * 0.1,
      layout: "accordion",
      group_heading: "", // only the first row of the run carries it
    });
    console.log(`  + row ${i + 1}: "${row.heading}"`);
  }

  console.log("\nDone. Reload /course/native-speaker — the เนื้อหา tab's");
  console.log(`"${GROUP_HEADING}" section is now a 3-row accordion.`);
  console.log("REMINDER: all three questions AND answers are mockup. Replace via the Admin UI.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
