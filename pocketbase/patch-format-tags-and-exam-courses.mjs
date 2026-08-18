// One-off, IDEMPOTENT patch script — the /services redesign's data side,
// decided over a long /grill-me session with Siraphob (2026-08-16). Depends
// on pb_migrations/11_add_format_and_exam_tags.js having already applied
// (run pocketbase serve with it first, or this script's tag writes will be
// rejected as invalid select values).
//
// Three things, in order:
//
// 1. รูปแบบ (format) tags on all 11 EXISTING courses. Confirmed rule: every
//    course gets exactly one of เรียนกลุ่ม/ตัวต่อตัว (never both) — 5 courses
//    are ตัวต่อตัว-only (private-one-on-one, TGAT & A-Level, ภาษาญี่ปุ่น,
//    ฟิสิกส์ — the last 3 previously read as fixed-schedule group classes,
//    corrected this session) and also get online+onsite; the other 6 are
//    เรียนกลุ่ม+onsite only (fixed-schedule classes, no online option).
//
// 2. Price/content correction on the 5 ตัวต่อตัว courses (+ physics' title):
//    a shared private-tutoring rate replaces their old subject-specific
//    prices — Siraphob, verbatim: "เป็นเรทกลางของทุกคอร์สที่ตัวต่อตัว" (this
//    is the shared rate for every ตัวต่อตัว course), after confirming
//    "เปลี่ยนใหม่หมด" (change all of it) when asked to double check this
//    really does replace the FB-post-sourced prices from the Phase 1.5 pass.
//    Rate: 2,400 บาท online / 3,500 บาท onsite, per 8 ชั่วโมง. The `price`
//    field only holds one number (see the services.astro grill-me thread —
//    deliberately NOT adding a second price field for this, no purchase flow
//    exists on this site to need it structured), so `price`/`duration` show
//    the cheaper online figure as the headline and the full split lives in
//    `description` + `summary_note`, same pattern private-one-on-one's own
//    8hr/30hr tiers already used.
//    ฟิสิกส์ also loses its "(อา)" title suffix and fixed Sunday
//    per-grade schedule — it's individual tutoring now, not a fixed group
//    timetable — but KEEPS its slug (`physics-sunday`) so no existing link
//    breaks.
//
// 3. Four new courses: TOEIC / IELTS / TOEFL as three SEPARATE course
//    records (Siraphob explicitly rejected one bundled course — a single
//    3,500 บาท price previously read as "ทั้งหมดในราคาเดียว" (everything for
//    one price) to customers, which was never true), all on the same shared
//    ตัวต่อตัว rate above. Plus "ตะลุยสอบ ด่วนพิเศษ", moved out of `services`
//    (see cleanup-services.mjs) into `courses` where it belongs — it's sold
//    to students on a real timetable, not a facilities/B2B service. Its
//    price is genuinely unknown (never given a number, only "10-20
//    ชม./สัปดาห์" was real, from the old services record) — left blank with
//    an explicit [MOCKUP] marker rather than inventing a figure, per this
//    project's standing "no fabricated content" rule.
//
// NOT in scope for this script, both found on the same "Course Roadmap"
// flyer (2026-08-16):
//   - "คอร์สสนทนาภาษาอังกฤษ" (อายุ 8-11, รายเดือน 4 ครั้ง, เสาร์/อาทิตย์
//     10:00-12:00 น., 2,800 บาท/เดือน) — Siraphob confirmed this is NOT a new
//     course, it's the current real name/price for an EXISTING course
//     (native-speaker and/or grade-booster-weekend — which exactly, still
//     being confirmed in chat before any rename/reprice happens here).
//     Not the same as "คอร์สการสนทนาทางธุรกิจ" (that one is B2B, adults,
//     stays in `services` — see cleanup-services.mjs).
//   - "Summer for English up skill", "STEM Sci Math play & learn" (มี.ค.-พ.ค.),
//     "October English Camp" (ต.ค.) — Siraphob confirmed these 3 are
//     WORKSHOPS, not courses (belong in the `workshops` collection, not
//     here). Real dates/price/seats not sourced yet — same "ships as a
//     photo/atmosphere page for now" treatment as STEM Fun Lab got in an
//     earlier session. Separate follow-up script, not this one.
//
// Safe to re-run: every write is a no-op if the target already has the new
// value(s); creates are skipped if the slug already exists.
//
// Usage: source .credentials && node patch-format-tags-and-exam-courses.mjs
// Usage (PowerShell): see cleanup-services.mjs's header for the env-var-load
// one-liner, then `node patch-format-tags-and-exam-courses.mjs`

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;
const DRY = process.argv.includes("--dry-run");

const MOCK = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";
const LINE_LINK = "https://lin.ee/REPLACE_WITH_SANDBOX_OA";

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

async function updateRecord(token, id, patch) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/courses/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update courses/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function create(token, record) {
  if (DRY) return { id: "(dry-run)" };
  const res = await fetch(`${PB_URL}/api/collections/courses/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`create courses failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function deleteRecord(token, id) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/courses/records/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`delete courses/${id} failed: ${res.status} ${await res.text()}`);
}

const uniq = (arr) => [...new Set(arr)];

// --- 1. รูปแบบ tags on all 11 existing courses ------------------------------
// slug -> extra tags to MERGE into whatever tags the record already has
// (never a replace — subject/grade/exam tags already on these records stay).
// Also folds in 2 real grade-tag gaps found on the "Course Roadmap" flyer
// (2026-08-16): Exclusive English Mentoring and สอบเข้า ม.1 are both
// explicitly ป.5-ป.6 there; the site only had ป.6 (or no grade tag at all)
// on these two before.
const FORMAT_TAGS = {
  "exclusive-english-mentoring": ["เรียนกลุ่ม", "onsite", "ป.5", "ป.6"],
  "native-speaker": ["เรียนกลุ่ม", "onsite"],
  "japanese": ["ตัวต่อตัว", "online", "onsite"],
  "private-one-on-one": ["ตัวต่อตัว", "online", "onsite"],
  "entrance-exam-m1": ["เรียนกลุ่ม", "onsite", "ป.5"],
  "tgat-a-level": ["ตัวต่อตัว", "online", "onsite"],
  "grade-booster-weekend": ["เรียนกลุ่ม", "onsite"],
  "grade-booster-weekday": ["เรียนกลุ่ม", "onsite"],
  "physics-sunday": ["ตัวต่อตัว", "online", "onsite"],
  "genious-summer-intensive": ["เรียนกลุ่ม", "onsite"],
  "english-foundation": ["เรียนกลุ่ม", "onsite"],
};

// --- 2. Price/content corrections on the 5 ตัวต่อตัว courses ----------------
// Rate + structure confirmed 2026-08-16 against the real "Course Roadmap"
// marketing flyer (English Mania by Kru Yam) Siraphob shared mid-session —
// exact match on both prices, plus real structural detail the flyer had that
// nothing in this project had captured yet.
const PRIVATE_RATE_NOTE =
  "เรทกลางสำหรับเรียนตัวต่อตัวทุกคอร์ส — ออนไลน์ 2,400 บาท หรือเรียนที่ศูนย์ (onsite) 3,500 บาท ต่อแพ็ก 8 ชั่วโมง " +
  "(เรียนสัปดาห์ละ 1 วัน ครั้งละ 1 ชม. ครบใน 8 สัปดาห์) เลือกวันเวลาเรียนได้ตามตารางสถาบัน คอร์สมีอายุ 3 เดือน รับสอนตั้งแต่ชั้นประถมถึง ม.ปลาย";

const CORRECTIONS = [
  {
    slug: "japanese",
    patch: {
      price: 2400,
      duration: "8 ชม.",
      description:
        "<p>คอร์สภาษาญี่ปุ่นตัวต่อตัว เหมาะสำหรับผู้เริ่มต้นทุกวัย ออกแบบเนื้อหาตามเป้าหมายผู้เรียน</p>" +
        "<ul>" +
        "<li>เรียนออนไลน์ 8 ชั่วโมง — 2,400 บาท</li>" +
        "<li>เรียนที่ศูนย์ (onsite) 8 ชั่วโมง — 3,500 บาท</li>" +
        "</ul>",
      summary_note: PRIVATE_RATE_NOTE,
    },
    note: "3,500/10ชม. คอร์สกลุ่ม -> 2,400(online)/3,500(onsite) ต่อ 8ชม. ตัวต่อตัว — Siraphob 2026-08-16, เรทกลาง",
  },
  {
    slug: "private-one-on-one",
    patch: {
      price: 2400,
      duration: "8 ชม.",
      description:
        "<p>คอร์สเรียนตัวต่อตัวออนไลน์ ภาษาอังกฤษ/คณิตศาสตร์/วิทยาศาสตร์ ออกแบบเนื้อหาตามเป้าหมายผู้เรียนแต่ละคน</p>" +
        "<ul>" +
        "<li>เรียนออนไลน์ 8 ชั่วโมง — 2,400 บาท</li>" +
        "<li>เรียนที่ศูนย์ (onsite) 8 ชั่วโมง — 3,500 บาท</li>" +
        "<li>แพ็ก 30 ชั่วโมง — 10,500 บาท/คน</li>" +
        "</ul>" +
        "<p>รับชำระผ่านบัตรเครดิต (ค่าธรรมเนียม 3%)</p>",
      summary_note: PRIVATE_RATE_NOTE,
    },
    note: "3,500 คงที่/8ชม. -> แยก 2,400(online)/3,500(onsite), คงแพ็ก 30ชม./10,500 เดิมไว้",
  },
  {
    slug: "tgat-a-level",
    patch: {
      price: 2400,
      duration: "8 ชม.",
      description:
        "<p>เตรียมสอบ TGAT และ A-Level วิชาภาษาอังกฤษ ตัวต่อตัว ออกแบบเนื้อหาตามเป้าหมายคะแนนผู้เรียน</p>" +
        "<ul>" +
        "<li>เรียนออนไลน์ 8 ชั่วโมง — 2,400 บาท</li>" +
        "<li>เรียนที่ศูนย์ (onsite) 8 ชั่วโมง — 3,500 บาท</li>" +
        "</ul>",
      summary_note: PRIVATE_RATE_NOTE,
    },
    note: "3,500/12ชม. -> 2,400(online)/3,500(onsite) ต่อ 8ชม. — Siraphob 2026-08-16, เรทกลาง",
  },
  {
    // Real name/price for this real course, confirmed against the "Course
    // Roadmap" flyer + follow-up chat (2026-08-16). "Native Speaker (อา)"
    // (deleted below) was a stale duplicate of the SAME real class — the
    // flyer only shows one box for weekend English conversation, and
    // Siraphob confirmed the schedule is "pick ONE day, Sat OR Sun, per
    // week" (not both days combined the way either old record described
    // it) — a real correction to both old records' summary_note/schedule
    // text, not just the rename.
    slug: "grade-booster-weekend",
    patch: {
      title: "คอร์สสนทนาภาษาอังกฤษ",
      tagline: "เสริมทักษะการสนทนาภาษาอังกฤษ เลือกเรียนวันเสาร์หรืออาทิตย์",
      price: 2800,
      duration: "รายเดือน (4 ครั้ง)",
      schedule: "เลือกเรียนวันเสาร์ หรือ วันอาทิตย์ 10:00-12:00 น. (เลือก 1 วัน/สัปดาห์)",
      description:
        "<p>คอร์สเสริมทักษะการสนทนาภาษาอังกฤษ สำหรับ อ.3-ป.6 เลือกเรียนวันเสาร์หรืออาทิตย์ วันใดวันหนึ่ง " +
        "10:00-12:00 น. รายเดือน 4 ครั้ง ราคา 2,800 บาท/เดือน</p>",
      summary_note: "เลือกวันเดียว เสาร์ หรือ อาทิตย์ 10:00-12:00 น. ราคา 2,800 บาท/เดือน (4 ครั้ง) รับชำระผ่านบัตรเครดิต",
    },
    note: "\"เพิ่มเกรด เสริมทักษะ (ส-อา)\" 2,000/เดือน (ทั้ง 2 วัน) -> \"คอร์สสนทนาภาษาอังกฤษ\" 2,800/เดือน (เลือก 1 วัน) — เช็คกับใบปลิว + ยืนยันกับ Siraphob 2026-08-16",
  },
  {
    slug: "physics-sunday",
    patch: {
      title: "คอร์สฟิสิกส์", // slug stays physics-sunday — existing links keep working
      tagline: "ฟิสิกส์ ม.4-ม.6 ตัวต่อตัว เรียนได้ทั้งออนไลน์และที่ศูนย์",
      price: 2400,
      duration: "8 ชม.",
      schedule: "", // was a fixed Sun per-grade group timetable — doesn't apply to individual tutoring
      description:
        "<p>คอร์สฟิสิกส์ ม.4-ม.6 ตัวต่อตัว ออกแบบเนื้อหาตามเป้าหมายผู้เรียนแต่ละคน นัดเวลาเรียนได้ยืดหยุ่นกว่าคลาสกลุ่ม</p>" +
        "<ul>" +
        "<li>เรียนออนไลน์ 8 ชั่วโมง — 2,400 บาท</li>" +
        "<li>เรียนที่ศูนย์ (onsite) 8 ชั่วโมง — 3,500 บาท</li>" +
        "</ul>",
      summary_note: PRIVATE_RATE_NOTE,
    },
    note: "6,000/18ชม. คอร์สกลุ่มตรึงวัน อา. -> 2,400(online)/3,500(onsite) ต่อ 8ชม. ตัวต่อตัว, ตัดชื่อ \"(อา)\" (slug คงเดิม)",
  },
];

// --- 3. New courses ----------------------------------------------------------
function privateExamCourse({ examTag, title, tagline, slug, sortOrder }) {
  return {
    title,
    slug,
    tagline,
    price: 2400,
    duration: "8 ชม.",
    description:
      `<p>${tagline} ตัวต่อตัว ออกแบบเนื้อหาตามเป้าหมายคะแนนของผู้เรียน</p>` +
      "<ul>" +
      "<li>เรียนออนไลน์ 8 ชั่วโมง — 2,400 บาท</li>" +
      "<li>เรียนที่ศูนย์ (onsite) 8 ชั่วโมง — 3,500 บาท</li>" +
      "</ul>",
    summary_note: PRIVATE_RATE_NOTE,
    image: null,
    tags: [examTag, "ภาษาอังกฤษ", "ตัวต่อตัว", "online", "onsite"],
    sort_order: sortOrder,
    is_active: true,
    line_link: LINE_LINK,
  };
}

const NEW_COURSES = [
  privateExamCourse({
    examTag: "TOEIC",
    title: "คอร์สติว TOEIC",
    tagline: "เตรียมสอบ TOEIC",
    slug: "toeic-prep",
    sortOrder: 12,
  }),
  privateExamCourse({
    examTag: "IELTS",
    title: "คอร์สติว IELTS",
    tagline: "เตรียมสอบ IELTS",
    slug: "ielts-prep",
    sortOrder: 13,
  }),
  privateExamCourse({
    examTag: "TOEFL",
    title: "คอร์สติว TOEFL",
    tagline: "เตรียมสอบ TOEFL",
    slug: "toefl-prep",
    sortOrder: 14,
  }),
  {
    // Moved from `services` (see cleanup-services.mjs) — real tagline/duration
    // carried over from that record; price was never a real number anywhere
    // in this project, so it's left MOCKUP rather than guessed. Siraphob
    // confirmed this one is เรียนกลุ่ม, not ตัวต่อตัว, so it does NOT use the
    // shared private rate above.
    title: "ตะลุยสอบ ด่วนพิเศษ",
    slug: "express-cram",
    tagline: "คอร์สติวเข้มก่อนสอบ",
    price: null,
    duration: "10-20 ชม./สัปดาห์",
    description: `<p>${MOCK} คอร์สติวเข้มก่อนสอบ 10-20 ชม./สัปดาห์ — ต้องระบุ: วิชา/ระดับชั้นที่ติวได้ ราคา และช่วงเวลาที่เปิดรับ</p>`,
    summary_note: "",
    image: null,
    tags: ["ตะลุยสอบ ด่วนพิเศษ", "เรียนกลุ่ม", "onsite"],
    sort_order: 15,
    is_active: true,
    line_link: LINE_LINK,
  },
];

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS (source .credentials first).");
    process.exit(1);
  }
  if (DRY) console.log("DRY RUN — nothing will be written.\n");
  const token = await authAdmin();
  const courses = await listAll(token, "courses");

  console.log("--- 1. Applying รูปแบบ tags (merge, not replace) ---");
  for (const [slug, extraTags] of Object.entries(FORMAT_TAGS)) {
    const rec = courses.find((c) => c.slug === slug);
    if (!rec) {
      console.warn(`  ! slug "${slug}" not found — skipping (check it hasn't been renamed).`);
      continue;
    }
    const merged = uniq([...(rec.tags || []), ...extraTags]);
    if (extraTags.every((t) => (rec.tags || []).includes(t))) {
      console.log(`  (courses/${rec.id} "${slug}" already has all format tags, skipping)`);
      continue;
    }
    await updateRecord(token, rec.id, { tags: merged });
    console.log(`  + courses/${rec.id} "${slug}" tags -> ${merged.join(", ")}`);
  }

  console.log("\n--- 2. Price/content corrections (shared ตัวต่อตัว rate) ---");
  for (const c of CORRECTIONS) {
    const rec = courses.find((r) => r.slug === c.slug);
    if (!rec) {
      console.warn(`  ! slug "${c.slug}" not found — skipping.`);
      continue;
    }
    const alreadyApplied = Object.entries(c.patch).every(([k, v]) => JSON.stringify(rec[k] ?? "") === JSON.stringify(v ?? ""));
    if (alreadyApplied) {
      console.log(`  (courses/${rec.id} "${c.slug}" already up to date, skipping)`);
      continue;
    }
    await updateRecord(token, rec.id, c.patch);
    console.log(`  + patched courses/${rec.id} "${c.slug}" — ${c.note}`);
  }

  console.log("\n--- 2b. Deleting \"Native Speaker (อา)\" — superseded by คอร์สสนทนาภาษาอังกฤษ above ---");
  const nativeSpeaker = courses.find((r) => r.slug === "native-speaker");
  if (!nativeSpeaker) {
    console.log("  (slug \"native-speaker\" not found — already deleted, or renamed)");
  } else {
    await deleteRecord(token, nativeSpeaker.id);
    console.log(`  - deleted courses/${nativeSpeaker.id} "คอร์ส Native Speaker (อา)"`);
  }

  console.log("\n--- 3. New courses: TOEIC, IELTS, TOEFL, ตะลุยสอบด่วนพิเศษ ---");
  for (const nc of NEW_COURSES) {
    if (courses.some((r) => r.slug === nc.slug)) {
      console.log(`  (slug "${nc.slug}" already exists, skipping create)`);
      continue;
    }
    const rec = await create(token, nc);
    console.log(`  + created courses/${rec.id} "${nc.title}" (${nc.slug})`);
  }

  console.log(
    "\nDone. Re-run `npm run dev` and check /course, /course/japanese, /course/private-one-on-one, " +
      "/course/tgat-a-level, /course/physics-sunday, /course/grade-booster-weekend (now \"คอร์สสนทนาภาษาอังกฤษ\"), " +
      "/course/toeic-prep, /course/ielts-prep, /course/toefl-prep, /course/express-cram — " +
      "and confirm /course/native-speaker now 404s (deleted)."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
