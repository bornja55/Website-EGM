// One-off, IDEMPOTENT seed script — adds 3 MORE course_sections headings
// (sort_order 4-6) on top of the existing 3 (เหมาะกับใคร / เรียนอะไรบ้าง /
// รูปแบบการเรียน) so Siraphob can see the detail-page "เนื้อหา" tab with a
// longer, more story-like layout before real copy exists for these 3 new
// sections.
//
// IMPORTANT: every body here is placeholder/mockup text, clearly prefixed
// "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]" so it can never be mistaken for a real,
// sourced fact — this is a deliberate, visible exception to the project's
// "no fabricated content" rule (agreed with Siraphob 2026-08-13: add the
// headings now to preview the design, fill in real content later). Find all
// of them with: grep -r "MOCKUP" pocketbase/ or check course_sections where
// body LIKE '%MOCKUP%'.
//
// Safe to re-run: skips any item that already has a section with a matching
// heading (checks heading text, not "any sections exist" like
// seed-course-sections.mjs does, so it layers on top of that script's output
// without re-creating the original 3).
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node seed-course-sections-mockup.mjs

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

async function create(token, collection, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`create ${collection} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

const MOCK_TAG = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";

const H4 = "ปัญหาที่คอร์สนี้ช่วยแก้";
const H5 = "จุดเด่นของ English Mania";
const H6 = "ผลลัพธ์หลังเรียนจบ";

// Same relationField / slug pattern as seed-course-sections.mjs. `title` is
// only used to make the placeholder text readable during design review —
// not stored anywhere.
const ITEMS = [
  { collection: "courses", slug: "exclusive-english-mentoring", relationField: "course", title: "Exclusive English Mentoring" },
  { collection: "courses", slug: "native-speaker", relationField: "course", title: "Native Speaker" },
  { collection: "courses", slug: "japanese", relationField: "course", title: "ภาษาญี่ปุ่น" },
  { collection: "courses", slug: "private-one-on-one", relationField: "course", title: "ตัวต่อตัวออนไลน์" },
  { collection: "courses", slug: "entrance-exam-m1", relationField: "course", title: "สอบเข้า ม.1" },
  { collection: "courses", slug: "tgat-a-level", relationField: "course", title: "TGAT & A-Level" },
  { collection: "courses", slug: "grade-booster-weekend", relationField: "course", title: "เพิ่มเกรด (ส-อา)" },
  { collection: "courses", slug: "grade-booster-weekday", relationField: "course", title: "เพิ่มเกรด (จ-ศ)" },
  { collection: "courses", slug: "physics-sunday", relationField: "course", title: "ฟิสิกส์ (อา)" },
  { collection: "courses", slug: "genious-summer-intensive", relationField: "course", title: "Genious Summer Intensive" },
  { collection: "courses", slug: "english-foundation", relationField: "course", title: "English Foundation Group" },
  { collection: "promotions", slug: "online-1on1-990", relationField: "promotion", title: "ตัวต่อตัวออนไลน์ 990" },
  { collection: "workshops", slug: "insect-pinning-workshop", relationField: "workshop", title: "Insect Pinning Workshop" },
  { collection: "workshops", slug: "stem-fun-lab", relationField: "workshop", title: "STEM Fun Lab" },
];

function mockBodies(title) {
  return [
    `${MOCK_TAG} นักเรียนหลายคนที่มาเรียน "${title}" มักเจอปัญหาอะไรมาก่อน? (ใส่ pain point จริง เช่น ตามเพื่อนในห้องไม่ทัน กลัวพูดผิด ไม่มีเวลาติวเอง ฯลฯ — ควรมาจากที่ผู้ปกครอง/นักเรียนเคยบอกจริงๆ ไม่ใช่เดา)`,
    `${MOCK_TAG} จุดต่างของคอร์ส "${title}" ที่ English Mania เมื่อเทียบกับที่อื่นคืออะไร? (เช่น ประสบการณ์ครูแยม เทคนิคการสอนเฉพาะตัว ขนาดกลุ่มเล็ก วิดีโอย้อนหลัง ฯลฯ — ใส่เฉพาะสิ่งที่ยืนยันได้จริง)`,
    `${MOCK_TAG} หลังเรียนจบคอร์ส "${title}" นักเรียนจะทำอะไรได้บ้างที่ทำไม่ได้มาก่อน? (ใส่ผลลัพธ์ที่วัดได้จริง เช่น คะแนนที่เพิ่มขึ้น ทักษะเฉพาะที่ทำได้ — ไม่ใช่คำกว้างๆ แบบ "เก่งขึ้น")`,
  ];
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const [courses, promotions, workshops, existingSections] = await Promise.all([
    listAll(token, "courses"),
    listAll(token, "promotions"),
    listAll(token, "workshops"),
    listAll(token, "course_sections"),
  ]);
  const byCollection = { courses, promotions, workshops };

  let created = 0;
  let skipped = 0;

  for (const item of ITEMS) {
    const records = byCollection[item.collection];
    const rec = records.find((r) => r.slug === item.slug);
    if (!rec) {
      console.warn(`  ! ${item.collection}/"${item.slug}" not found — skipping.`);
      continue;
    }

    const itemSections = existingSections.filter((s) => s[item.relationField] === rec.id);
    const alreadyHasMockups = itemSections.some((s) => s.heading === H4);
    if (alreadyHasMockups) {
      console.log(`  (mockup sections for ${item.collection}/"${item.slug}" already exist, skipping)`);
      skipped++;
      continue;
    }

    const maxSort = itemSections.reduce((max, s) => Math.max(max, s.sort_order || 0), 0);
    const headings = [H4, H5, H6];
    const bodies = mockBodies(item.title);
    for (let i = 0; i < 3; i++) {
      await create(token, "course_sections", {
        [item.relationField]: rec.id,
        heading: headings[i],
        body: `<p>${bodies[i]}</p>`,
        image: null,
        sort_order: maxSort + i + 1,
      });
    }
    console.log(`  + created 3 mockup sections for ${item.collection}/"${item.slug}"`);
    created++;
  }

  console.log(`\nDone. ${created} items got mockup sections, ${skipped} already had them.`);
  console.log(
    "Reminder: these are placeholder text for design preview only — replace before this goes live. " +
      "Find them all via the PocketBase Admin UI: course_sections, filter heading = \"" + H4 + "\"."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
