// One-off, TWO-PHASE data migration — see COURSE_PAGES_PRD.md "Live data
// migration". Moves the 9 real named courses out of `promotions` (where they
// were seeded as a stand-in before the `courses` collection existed) into
// their own `courses` records, and adds a 10th real course found during this
// project ("Genious Summer Intensive Skill" — annual summer camp, confirmed
// with Siraphob 2026-08-13, not on the old site at all). Also backfills the
// slug/image on the one real remaining `promotions` record (990฿ online 1:1)
// so /promotions/[slug] works for it too.
//
// SAFETY: run pb_migrations/4_add_courses_and_split_fields.js FIRST (schema
// only). Then, BEFORE running this script, back up pocketbase/pb_data/ —
// this is live seeded data with no other copy.
//
// Phase 1 creates all `courses` records and verifies the count. Phase 2 only
// runs — and only deletes the matching `promotions` records — if Phase 1
// fully succeeded. If this script dies partway through Phase 1, nothing has
// been deleted yet; just fix and re-run (re-running Phase 1 will duplicate
// already-created course records, so check the Admin UI at /_/ first if a
// partial run happened).
//
// Usage: source .credentials && node migrate-courses.mjs

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
  const qs = filter ? `?filter=${encodeURIComponent(filter)}&perPage=200` : "?perPage=200";
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records${qs}`, {
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

async function updateRecord(token, collection, id, patch) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update ${collection}/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function deleteRecord(token, collection, id) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`delete ${collection}/${id} failed: ${res.status} ${await res.text()}`);
}

// Exact titles as originally seeded into `promotions` by seed.mjs — used to
// find and later delete the 9 course-shaped records. If a title doesn't
// match exactly (e.g. hand-edited via Admin UI since), this script will
// report it as "not found in promotions" rather than silently skipping.
const COURSES = [
  {
    matchTitle: "Exclusive English Mentoring by English Mania",
    title: "Exclusive English Mentoring by English Mania",
    slug: "exclusive-english-mentoring",
    tagline: "คอร์สเมนเทอริ่งซัมเมอร์เข้มข้น ตัวต่อตัวรายกลุ่มเล็ก",
    price: 29800,
    duration: "64 ชม.",
    schedule: "เสาร์ 10:00-15:00 น.",
    description: "<p>คอร์ส Summer 68 แบบเข้มข้น เรียนรวม 64 ชั่วโมง ทุกวันเสาร์ เวลา 10:00-15:00 น. ออกแบบเนื้อหาเฉพาะสำหรับผู้เรียนที่ต้องการพัฒนาภาษาอังกฤษอย่างจริงจังในช่วงปิดเทอม</p>",
    image: null, // no confidently-matched real photo found — falls back to /images/classroom.jpg in the page template
    tags: ["ภาษาอังกฤษ"],
    sort_order: 1,
  },
  {
    matchTitle: "คอร์ส Native Speaker (อา)",
    title: "คอร์ส Native Speaker (อา)",
    slug: "native-speaker",
    tagline: "เรียนกับเจ้าของภาษา 100% ทุกวันอาทิตย์",
    price: 3500,
    duration: null,
    schedule: "ทุกวันอาทิตย์",
    description: "<p>เรียนภาษาอังกฤษกับครูเจ้าของภาษาโดยตรง ทุกวันอาทิตย์ เร่งสปีดความรู้เมื่อพื้นฐานเป๊ะ ช่วยให้ต่อยอดได้ง่ายขึ้น ราคา 3,500 บาท/เดือน</p>",
    image: "/images/courses/native-speaker.jpg",
    tags: ["ภาษาอังกฤษ"],
    sort_order: 2,
  },
  {
    matchTitle: "คอร์สภาษาญี่ปุ่น",
    title: "คอร์สภาษาญี่ปุ่น",
    slug: "japanese",
    tagline: "ภาษาญี่ปุ่นพื้นฐาน เรียนได้ทุกวัย",
    price: 3500,
    duration: "10 ชม.",
    schedule: null,
    description: "<p>คอร์สภาษาญี่ปุ่นพื้นฐาน 10 ชั่วโมง เหมาะสำหรับผู้เริ่มต้น ราคา 3,500 บาท</p>",
    image: "/images/courses/japanese.jpg",
    tags: ["ภาษาญี่ปุ่น"],
    sort_order: 3,
  },
  {
    matchTitle: "คอร์สออนไลน์ตัวต่อตัว",
    title: "คอร์สออนไลน์ตัวต่อตัว",
    slug: "private-one-on-one",
    tagline: "เรียนตัวต่อตัว ออกแบบบทเรียนเฉพาะคุณ",
    price: 3500,
    duration: "8 ชม.",
    schedule: null,
    description: "<p>คอร์สเรียนตัวต่อตัวออนไลน์ ภาษาอังกฤษ/คณิตศาสตร์/วิทยาศาสตร์ ออกแบบเนื้อหาตามเป้าหมายผู้เรียนแต่ละคน 8 ชั่วโมง ราคา 3,500 บาท</p>",
    image: "/images/courses/private-one-on-one.jpg",
    tags: ["ตัวต่อตัว", "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์"],
    sort_order: 4,
  },
  {
    matchTitle: "คอร์สสอบเข้า ม.1",
    title: "คอร์สสอบเข้า ม.1",
    slug: "entrance-exam-m1",
    tagline: "ติวเข้มสอบเข้า ม.1 ครบทุกวิชา",
    price: 4500,
    duration: "45 ชม.",
    schedule: null,
    description: "<p>ติวเข้มเตรียมสอบเข้า ม.1 ครบทุกวิชา รวม 45 ชั่วโมง ราคา 4,500 บาท</p>",
    image: "/images/courses/entrance-exam-m1.jpg",
    tags: ["ติวสอบเข้า ม.1", "ป.6"],
    sort_order: 5,
  },
  {
    matchTitle: "คอร์ส TGAT & A-Level",
    title: "คอร์ส TGAT & A-Level",
    slug: "tgat-a-level",
    tagline: "ปลดล็อกภาษาอังกฤษ พิชิต TGAT & A-Level",
    price: 3500,
    duration: "12 ชม.",
    schedule: null,
    description: "<p>เตรียมสอบ TGAT และ A-Level วิชาภาษาอังกฤษ รวม 12 ชั่วโมง ราคา 3,500 บาท</p>",
    image: "/images/courses/tgat-a-level.jpg",
    tags: ["TGAT & A-Level", "ภาษาอังกฤษ", "ม.6"],
    sort_order: 6,
  },
  {
    matchTitle: "คอร์สเพิ่มเกรด เสริมทักษะ (ส-อา)",
    title: "คอร์สเพิ่มเกรด เสริมทักษะ (ส-อา)",
    slug: "grade-booster-weekend",
    tagline: "เพิ่มเกรด เสริมทักษะ เรียนวันเสาร์-อาทิตย์",
    price: 2800,
    duration: null,
    schedule: "เสาร์-อาทิตย์",
    description: "<p>คอร์สเพิ่มเกรด เสริมทักษะ สำหรับ อ.3 - ป.6 เรียนวันเสาร์-อาทิตย์ ราคา 2,800 บาท/เดือน</p>",
    image: "/images/courses/grade-booster-weekend.jpg",
    tags: ["อ.3", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"],
    sort_order: 7,
  },
  {
    matchTitle: "คอร์สเพิ่มเกรด เสริมทักษะ (จ-ศ)",
    title: "คอร์สเพิ่มเกรด เสริมทักษะ (จ-ศ)",
    slug: "grade-booster-weekday",
    tagline: "เพิ่มเกรด เสริมทักษะ เรียนวันจันทร์-ศุกร์",
    price: 4000,
    duration: null,
    schedule: "จันทร์-ศุกร์",
    description: "<p>คอร์สเพิ่มเกรด เสริมทักษะ สำหรับ ป.1 - ป.6 เรียนวันจันทร์-ศุกร์ ราคา 4,000 บาท/เทอม</p>",
    image: "/images/courses/grade-booster-weekday.jpg",
    tags: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"],
    sort_order: 8,
  },
  {
    matchTitle: "คอร์สฟิสิกส์ (อา)",
    title: "คอร์สฟิสิกส์ (อา)",
    slug: "physics-sunday",
    tagline: "ฟิสิกส์ ม.4-ม.6 เรียนทุกวันอาทิตย์",
    price: 2800,
    duration: null,
    schedule: "อาทิตย์",
    description: "<p>คอร์สฟิสิกส์ ม.4-ม.6 เรียนทุกวันอาทิตย์ ราคา 2,800 บาท/เดือน</p>",
    image: "/images/courses/physics-sunday.jpg",
    tags: ["วิทยาศาสตร์", "ม.4", "ม.5", "ม.6"],
    sort_order: 9,
  },
  {
    // NOT in promotions — brand new find, no matchTitle/delete step for this one.
    matchTitle: null,
    title: "Genious Summer Intensive Skill",
    slug: "genious-summer-intensive",
    tagline: "แคมป์ซัมเมอร์เข้มข้น สำหรับเด็กอายุ 5-7 ขวบ (จัดปีละครั้ง)",
    price: 2500,
    duration: "รอบละ 3 ชม. หรือเต็มวัน",
    schedule: "จันทร์-ศุกร์ ช่วงเดือนเมษายน-พฤษภาคม",
    description:
      "<p>แคมป์ซัมเมอร์ Genious Summer Intensive Skill สำหรับเด็กอายุ 5-7 ขวบ เรียนวันจันทร์-ศุกร์ ช่วงเดือนเมษายน-พฤษภาคมของทุกปี</p>" +
      "<ul>" +
      "<li>รอบเช้า 9:00-12:00 น. (Eng, Science, Math) — 2,500 บาท</li>" +
      "<li>รอบบ่าย 13:00-15:00 น. (ฝึกทักษะการฟัง การโต้ตอบ การจดโน้ต อ่านคำศัพท์ Phonetics) — 2,500 บาท</li>" +
      "<li>เต็มวัน (เช้า-บ่าย รวมอาหารกลางวันและของว่าง) — 5,500 บาท</li>" +
      "</ul>",
    image: "/images/courses/genious-summer-intensive.jpg",
    tags: ["ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์", "อ.3"],
    sort_order: 10,
  },
];

// Same shared placeholder every other collection in seed.mjs uses — swap for
// the real sandbox/production LINE OA link at the same time everything else
// does (see seed.mjs's own note about this).
const LINE_LINK = "https://lin.ee/REPLACE_WITH_SANDBOX_OA";

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS (source .credentials first).");
    process.exit(1);
  }
  const token = await authAdmin();

  console.log("--- Housekeeping: backfill slug/image on the existing 990฿ promotion ---");
  const existingPromos = await listAll(token, "promotions");
  const stillPromo = existingPromos.find((p) => !COURSES.some((c) => c.matchTitle === p.title));
  if (stillPromo && !stillPromo.slug) {
    await updateRecord(token, "promotions", stillPromo.id, {
      slug: "online-1on1-990",
    });
    console.log(`  + backfilled slug on promotions/${stillPromo.id} ("${stillPromo.title}")`);
  } else {
    console.log("  (nothing to backfill, or already has a slug)");
  }

  console.log("\n--- Phase 1: create all courses records ---");
  const created = [];
  for (const c of COURSES) {
    const { matchTitle, ...record } = c;
    const rec = await create(token, "courses", { ...record, is_active: true, line_link: LINE_LINK });
    created.push({ ...c, id: rec.id });
    console.log(`  + courses: ${rec.id} ${c.title}`);
  }

  if (created.length !== COURSES.length) {
    console.error(
      `Phase 1 INCOMPLETE: expected ${COURSES.length} courses, created ${created.length}. ` +
        "Stopping BEFORE Phase 2 — nothing has been deleted from promotions. Check the Admin UI, fix, and re-run."
    );
    process.exit(1);
  }
  console.log(`Phase 1 verified: all ${created.length} courses created successfully.`);

  console.log("\n--- Phase 2: delete the 9 original course-shaped promotions records ---");
  for (const c of COURSES) {
    if (!c.matchTitle) continue; // Genious Summer wasn't in promotions, nothing to delete
    const match = existingPromos.find((p) => p.title === c.matchTitle);
    if (!match) {
      console.warn(`  ! "${c.matchTitle}" not found in promotions — skipping delete (already gone, or title changed).`);
      continue;
    }
    await deleteRecord(token, "promotions", match.id);
    console.log(`  - deleted promotions/${match.id} ("${match.title}")`);
  }

  console.log("\n--- Phase 3: add STEM Workshop (English & STEM Fun Lab) ---");
  // Confirmed with Siraphob 2026-08-13: this workshop runs occasionally (once
  // last year, no fixed schedule), unlike Insect Pinning which has a real
  // upcoming date. No date/price/seats this year yet — deliberately left
  // unset rather than guessed. Page functions as an atmosphere/gallery page
  // for now; add event_date/price/seats_total via the Admin UI once a real
  // next session is confirmed (same pattern as Insect Pinning last session).
  const existingWorkshops = await listAll(token, "workshops");
  const stemExists = existingWorkshops.some((w) => w.slug === "stem-fun-lab");
  if (stemExists) {
    console.log("  (stem-fun-lab already exists, skipping)");
  } else {
    const stem = await create(token, "workshops", {
      title: "English & STEM Fun Lab",
      slug: "stem-fun-lab",
      tagline: "ค่ายภาษาอังกฤษและวิทยาศาสตร์ เรียนรู้ผ่านกิจกรรมลงมือทำ",
      description:
        "<p>ค่าย English & STEM Fun Lab เวิร์กช็อปภาษาอังกฤษและวิทยาศาสตร์ผ่านกิจกรรมลงมือทำ เช่น การทำ mind map จัดระบบความคิด จัดขึ้นปีละครั้ง</p>" +
        "<p>ยังไม่ประกาศรอบถัดไปของปีนี้ — ติดตามรอบใหม่ได้ทาง Facebook</p>",
      event_date: null,
      price: null,
      seats_total: null,
      cover_image: null,
      line_link: LINE_LINK,
      is_active: true,
    });
    console.log(`  + workshops: ${stem.id} English & STEM Fun Lab`);
  }

  console.log("\nDone. 10 courses now live in the `courses` collection. Re-run `npm run dev` and check /course.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
