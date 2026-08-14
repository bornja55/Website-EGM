// One-off, IDEMPOTENT patch — turns native-speaker's "ผลลัพธ์หลังเรียนจบ"
// section into the apple.com "Our values lead the way." 3-up TEXT CARD row
// (see pb_migrations/8_add_section_text_card_layout.js for the schema and
// ProductTabs.astro for the rendering).
//
// Requires migrations 6 AND 8. Restart PocketBase once to auto-apply.
//
// What it does:
//   1. Patches the existing "ผลลัพธ์หลังเรียนจบ" record into CARD 1 —
//      group_heading = "ผลลัพธ์หลังเรียนจบ", layout = "text-card", and CLEARS
//      its `image` (this layout has no media slot, so a leftover path would
//      just be dead data in the record).
//   2. Creates cards 2 and 3 after it.
//
// CONTENT WARNING — all three cards are MOCKUP, carrying the
// "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]" prefix. The section they replace was already
// mockup (seed-course-sections-mockup.mjs), so nothing real is overwritten,
// but this page now has THREE mockup blocks on it (this row, the จุดเด่น
// accordion, and ปัญหาที่คอร์สนี้ช่วยแก้). None of it can be advertised against
// until ครูแยม supplies real copy — see CONTENT_TEMPLATE_STORY_SECTIONS.md.
//
// The three card titles below are a deliberate split of one idea into three
// measurable outcome types (skill / confidence / school results) purely so the
// layout can be judged. They are placeholders, not a content decision.
//
// Safe to re-run: card 1 is only patched if it isn't already layout="text-card",
// and cards 2-3 are only created if no section with that heading exists yet.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-native-speaker-outcome-cards.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const GROUP_HEADING = "ผลลัพธ์หลังเรียนจบ";
const MOCK = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";

const CARDS = [
  {
    heading: "พูดกับเจ้าของภาษาได้",
    body:
      `<p>${MOCK} ระบุให้ชัดว่าหลังเรียนจบนักเรียนพูด/ฟังอะไรได้บ้าง ` +
      `ที่ก่อนเรียนทำไม่ได้ — เขียนเป็นสิ่งที่ทำได้จริง ไม่ใช่ "กล้าพูดขึ้น"</p>`,
  },
  {
    heading: "แกรมม่าและคำศัพท์แน่นขึ้น",
    body:
      `<p>${MOCK} ระบุขอบเขตที่วัดได้ เช่น ครอบคลุมโครงสร้างอะไร ` +
      `คำศัพท์กี่คำ หรือทำแบบฝึกระดับไหนได้ (อ้างอิงจากเอกสารของสถาบันได้)</p>`,
  },
  {
    heading: "ผลสอบที่โรงเรียนดีขึ้น",
    body:
      `<p>${MOCK} ถ้ามีตัวเลขจริงให้ใส่ เช่น คะแนนเฉลี่ยที่ขยับ ` +
      `หรือจำนวนนักเรียนที่สอบผ่าน — ถ้าไม่มีสถิติที่ยืนยันได้ ` +
      `ให้ตัดการ์ดใบนี้ทิ้ง อย่าเขียนลอยๆ</p>`,
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
      "course_sections has no `layout` field — migrations 6/8 haven't been applied. " +
        "Restart PocketBase (it auto-applies pb_migrations) and re-run."
    );
    process.exit(1);
  }

  const card1 =
    sections.find((s) => s.heading === GROUP_HEADING) ||
    sections.find((s) => s.heading === CARDS[0].heading);
  if (!card1) {
    console.error(`No section titled "${GROUP_HEADING}" (or "${CARDS[0].heading}") on native-speaker.`);
    process.exit(1);
  }

  if (card1.layout === "text-card") {
    console.log(`  (card 1 "${card1.heading}" already a text card, skipping)`);
  } else {
    await patch(token, "course_sections", card1.id, {
      layout: "text-card",
      group_heading: GROUP_HEADING,
      heading: CARDS[0].heading,
      body: CARDS[0].body,
      image: "", // this layout has no media slot
    });
    console.log(`  + card 1: "${GROUP_HEADING}" -> "${CARDS[0].heading}"`);
  }

  for (let i = 1; i < CARDS.length; i++) {
    const card = CARDS[i];
    const existing = sections.find((s) => s.heading === card.heading);
    if (existing) {
      if (existing.layout !== "text-card") {
        await patch(token, "course_sections", existing.id, { layout: "text-card" });
        console.log(`  ~ card ${i + 1} "${card.heading}" re-flagged layout=text-card`);
      } else {
        console.log(`  (card ${i + 1} "${card.heading}" already complete, skipping)`);
      }
      continue;
    }
    await create(token, "course_sections", {
      course: course.id,
      heading: card.heading,
      body: card.body,
      image: "",
      sort_order: (card1.sort_order ?? 0) + i * 0.1,
      layout: "text-card",
      group_heading: "", // only the first card of the run carries it
    });
    console.log(`  + card ${i + 1}: "${card.heading}"`);
  }

  console.log(`\nDone. "${GROUP_HEADING}" is now a 3-up text card row.`);
  console.log("REMINDER: all three cards are mockup copy. Replace via the Admin UI.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
