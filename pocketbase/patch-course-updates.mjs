// One-off, IDEMPOTENT patch script — applies the price/data corrections and the
// new course found during this session's Phase 1.5 content-sourcing pass (see
// COURSE_PAGES_PRD.md "Phase 1.5 content sourcing findings", 2026-08-13).
//
// Every value here traces to a real Facebook post from the business's own Page
// (logged in as page admin), cross-checked by post date against the old-site
// data already live in `courses` — per Siraphob's rule, the newer-dated source
// wins. Nothing here is invented; see the PRD section for the exact source and
// date behind each change.
//
// Safe to re-run: each update is a no-op if the target already has the new
// value, and the English Foundation Group create is skipped if a course with
// that slug already exists.
//
// Usage: source .credentials && node patch-course-updates.mjs

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

async function updateRecord(token, collection, id, patch) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update ${collection}/${id} failed: ${res.status} ${await res.text()}`);
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

// Same shared placeholder every other collection uses — swap for the real
// sandbox/production LINE OA link at go-live (see seed.mjs / migrate-courses.mjs).
const LINE_LINK = "https://lin.ee/REPLACE_WITH_SANDBOX_OA";

// --- Price/data corrections to existing courses (source: real FB posts, newer
// date than the old-site text currently live) -----------------------------
const CORRECTIONS = [
  {
    slug: "physics-sunday",
    patch: {
      price: 6000,
      duration: "18 ชม. (ต่อภาคเรียน)",
      schedule: "อาทิตย์ (ม.4 9:00-10:30 / ม.5 10:30-12:00 / ม.6 13:00-14:30 น.)",
    },
    note: "2,800/เดือน -> 6,000/18ชม. ต่อภาคเรียน (FB post, ~ส.ค. 2024, ยืนยันกับ Siraphob)",
  },
  {
    slug: "grade-booster-weekend",
    patch: {
      price: 2000,
      schedule: "เสาร์ 10:00-12:00 น. / อาทิตย์ 10:00-12:00 น.",
      tags: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"], // was อ.3-ป.6, FB post (6 ต.ค. 2024) says ป.1-ป.6
    },
    note: "2,800/เดือน (2 รอบ อ.3-ป.6) -> 2,000/เดือน (รอบเดียว ป.1-ป.6), FB post 6 ต.ค. 2024",
  },
  {
    slug: "native-speaker",
    patch: {
      price: 3200,
      schedule: "เสาร์-อาทิตย์ 10:00-12:00 น. (ครูไทย 10:00-11:00 แกรมม่า/เขียน/อ่าน, Native 11:00-12:00 พูด/ฟัง/โต้ตอบ)",
    },
    note: "3,500/เดือน -> 3,200/เดือน (ราคาปกติ, ไม่ใช่ Early bird), FB post 3 พ.ค. 2025 — โครงสร้างคลาสเปลี่ยนเป็นครูไทย+Native ผสมกัน",
  },
  {
    slug: "private-one-on-one",
    patch: {
      description:
        "<p>คอร์สเรียนตัวต่อตัวออนไลน์ ภาษาอังกฤษ/คณิตศาสตร์/วิทยาศาสตร์ ออกแบบเนื้อหาตามเป้าหมายผู้เรียนแต่ละคน</p>" +
        "<ul>" +
        "<li>แพ็ก 8 ชั่วโมง — 3,500 บาท/คน</li>" +
        "<li>แพ็ก 30 ชั่วโมง — 10,500 บาท/คน</li>" +
        "</ul>" +
        "<p>รับชำระผ่านบัตรเครดิต (ค่าธรรมเนียม 3%)</p>",
    },
    note: "เพิ่มแพ็กเกจ 30 ชม./10,500 บาท ควบคู่กับแพ็กเดิม 8 ชม./3,500 บาท (ราคาเดิมยัง valid)",
  },
];

// --- New course found this session ----------------------------------------
const NEW_COURSE = {
  title: "English Foundation Group",
  slug: "english-foundation",
  tagline: "ปูพื้นฐานภาษาอังกฤษสำหรับเด็ก 8-11 ปี",
  price: 2400,
  duration: "8 ชม./เดือน",
  schedule: "พุธและศุกร์ 17:00-18:00 น.",
  description:
    "<p>คอร์สเสริมทักษะภาษาอังกฤษสำหรับเด็กอายุ 8-11 ปี ฝึกการอ่านสะกดคำ เสริมคำศัพท์ที่เหมาะสมกับช่วงวัย " +
    "ฝึกวิเคราะห์เนื้อเรื่องภาษาอังกฤษ ปูพื้นฐานสำหรับเด็กที่อ่อนภาษาอังกฤษ เรียนสัปดาห์ละ 2 วัน (พุธ+ศุกร์) " +
    "รวม 8 ชั่วโมง/เดือน ฟรีหนังสือเรียนมูลค่า 500 บาท</p>" +
    "<p>สมัครทีเดียว 4 เดือน (มิ.ย.-ก.ย.) ลด 15% เหลือ 8,160 บาท จาก 9,600 บาท รับชำระผ่านบัตรเครดิต (ค่าธรรมเนียม 3%)</p>",
  image: null, // no confidently-matched real photo found yet — falls back to /images/classroom.jpg in the page template
  tags: ["ภาษาอังกฤษ"],
  sort_order: 11,
  is_active: true,
  line_link: LINE_LINK,
};

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS (source .credentials first).");
    process.exit(1);
  }
  const token = await authAdmin();
  const courses = await listAll(token, "courses");

  console.log("--- Applying price/data corrections ---");
  for (const c of CORRECTIONS) {
    const rec = courses.find((r) => r.slug === c.slug);
    if (!rec) {
      console.warn(`  ! slug "${c.slug}" not found in courses — skipping (check it hasn't been renamed).`);
      continue;
    }
    const alreadyApplied = Object.entries(c.patch).every(([k, v]) => JSON.stringify(rec[k]) === JSON.stringify(v));
    if (alreadyApplied) {
      console.log(`  (courses/${rec.id} "${c.slug}" already up to date, skipping)`);
      continue;
    }
    await updateRecord(token, "courses", rec.id, c.patch);
    console.log(`  + patched courses/${rec.id} "${c.slug}" — ${c.note}`);
  }

  console.log("\n--- Adding new course: English Foundation Group ---");
  const exists = courses.some((r) => r.slug === NEW_COURSE.slug);
  if (exists) {
    console.log(`  (slug "${NEW_COURSE.slug}" already exists, skipping create)`);
  } else {
    const rec = await create(token, "courses", NEW_COURSE);
    console.log(`  + created courses/${rec.id} "${NEW_COURSE.title}"`);
  }

  console.log("\nDone. Re-run `npm run dev` and check /course, /course/physics-sunday, " +
    "/course/grade-booster-weekend, /course/native-speaker, /course/private-one-on-one, " +
    "/course/english-foundation.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
