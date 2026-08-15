// IDEMPOTENT cleanup — rebuilds the `services` collection around what /services
// is actually FOR: the school's non-teaching business (room and venue hire,
// selling study documents, translation, LINE OA training).
//
// Why: the page had grown 20 rows, most of them course categories
// (ภาษาอังกฤษ / คณิตศาสตร์ / วิทยาศาสตร์ split by level) that overlap the
// mega-menu and the /course/subject|grade pages.
//
// ---------------------------------------------------------------------------
// THIS SCRIPT DOES NOT DELETE ANYTHING BY DEFAULT — READ THIS
// ---------------------------------------------------------------------------
// An earlier draft deleted every row in those three categories, on the
// assumption that they duplicated real courses and that
// "ติวสอบ TOEIC/IELTS/Toefl" advertised a course the school doesn't run
// (COURSE_PAGES_PRD.md says a TOEIC/IELTS tag was excluded for that reason).
//
// That assumption was WRONG. Siraphob confirmed 2026-08-14 that TOEIC, IELTS
// and TOEFL prep are all real, along with คอร์สสนทนาธุรกิจ and
// ตะลุยสอบด่วนพิเศษ. The PRD's note is out of date, and a row not existing in
// the `courses` collection turns out to say nothing about whether the school
// sells it.
//
// So the default run only RE-CATEGORISES and REPORTS. Deleting requires
// --delete plus an explicit list in DELETE_TITLES below, filled in once a
// human has confirmed each row really is a duplicate. Nothing sellable should
// disappear from the site because a script inferred it was redundant.
//
// ---------------------------------------------------------------------------
// TWO NEW ROWS ARE CREATED WITH PLACEHOLDER COPY
// ---------------------------------------------------------------------------
// "เช่าสถานที่จัดกิจกรรม" and "ขายเอกสาร/หนังสือติวสอบ" were named as real
// services but exist nowhere in the data. They are created here so the page
// reflects the actual business, with "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]"
// descriptions — the project's standing rule for clearly-marked placeholders.
// Rates, capacity and what documents are sold all need real answers.
//
// Deleted rows are written to deleted-services.json before removal.
//
// Safe to re-run: deletes only titles on the removal list, creates only rows
// that don't already exist.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node cleanup-services.mjs
//   node cleanup-services.mjs --dry-run

import { writeFile } from "node:fs/promises";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;
const DRY = process.argv.includes("--dry-run");
const DELETE = process.argv.includes("--delete");

const MOCK = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";

// EMPTY ON PURPOSE. Add exact titles here only after confirming, row by row,
// that the same thing is genuinely sold elsewhere on the site. Then run with
// --delete. See the header comment for why this is not inferred.
const DELETE_TITLES = [];

// Explicit new category per row. Every row currently in the collection is
// listed, so nothing falls through to a default and quietly changes meaning.
const RECATEGORISE = {
  // Non-teaching services — what this page is actually for.
  "เช่า Co-Working Space / ห้องประชุม": "ให้เช่าสถานที่",
  "แปลเอกสาร ราชการ/วิจัย/บทความ": "บริการอื่นๆ",

  // B2B, delivered at the client's own office — sold to companies, not to
  // parents, and never on a public class timetable. These genuinely BELONG on
  // /services; they are not misplaced course records.
  // (Siraphob, 2026-08-14: "สนทนาธุรกิจ เป็นการไปสอนกลุ่มที่บริษัทลูกค้า")
  "Digital Marketing | LINE OA": "อบรมในองค์กร (In-house)",
  "คอร์สการสนทนาทางธุรกิจ (ภาษาอังกฤษ)": "อบรมในองค์กร (In-house)",

  // Sold to students, so these are courses in the wrong collection. Parked
  // under a real category until they get proper `courses` records — see the
  // script's closing report.
  "ตะลุยสอบ ด่วนพิเศษ": "ติวสอบ",
  "ติวสอบ TOEIC/IELTS/Toefl": "ติวสอบ",
};

// Named by Siraphob as real services with no record anywhere.
const CREATE = [
  {
    title: "เช่าสถานที่จัดกิจกรรม",
    category: "ให้เช่าสถานที่",
    icon: "เ",
    description:
      `<p>${MOCK} ให้เช่าพื้นที่สำหรับจัดกิจกรรม — ต้องระบุ: รองรับกี่คน ` +
      `จัดกิจกรรมแบบไหนได้บ้าง คิดค่าเช่าเป็นรายชั่วโมงหรือรายวัน ราคาเท่าไร ` +
      `และมีอุปกรณ์อะไรให้บ้าง</p>`,
    sort_order: 91,
  },
  {
    title: "จำหน่ายเอกสารและหนังสือติวสอบ",
    category: "บริการอื่นๆ",
    icon: "จ",
    description:
      `<p>${MOCK} จำหน่ายเอกสารและหนังสือติวสอบที่สถาบันเรียบเรียงเอง — ต้องระบุ: ` +
      `มีวิชาและระดับชั้นอะไรบ้าง ราคาต่อเล่ม ซื้อผ่านช่องทางไหน ` +
      `และเป็นเล่มจริงหรือไฟล์ PDF</p>`,
    sort_order: 92,
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

async function listAll(token, collection) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).items;
}

async function call(method, path, token, body) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/services/records${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  if (DRY) console.log("DRY RUN — nothing will be written.\n");
  const token = await authAdmin();
  const services = await listAll(token, "services");

  const toDelete = DELETE
    ? services.filter((s) => DELETE_TITLES.includes(s.title))
    : [];

  if (toDelete.length > 0 && !DRY) {
    await writeFile("deleted-services.json", JSON.stringify(toDelete, null, 2), "utf8");
  }
  for (const s of toDelete) {
    await call("DELETE", `/${s.id}`, token);
    console.log(`  - deleted "${s.title}" (${s.category})`);
  }

  // Re-categorise: the old buckets were school subjects, the new ones describe
  // what KIND of thing each row is.
  for (const s of services) {
    const category = RECATEGORISE[s.title];
    if (!category || s.category === category) continue;
    await call("PATCH", `/${s.id}`, token, { category });
    console.log(`  ~ "${s.title}" -> "${category}"`);
  }

  // Anything not in RECATEGORISE is a row this script has no instruction for —
  // surfaced rather than left to a default, since those are exactly the rows
  // whose status is unconfirmed.
  const unhandled = services.filter((s) => !(s.title in RECATEGORISE));

  for (const row of CREATE) {
    if (services.some((s) => s.title === row.title)) {
      console.log(`  (already exists: "${row.title}")`);
      continue;
    }
    await call("POST", "", token, row);
    console.log(`  + created "${row.title}" (MOCKUP description)`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Deleted: ${toDelete.length}${DELETE ? "" : "  (no --delete flag; DELETE_TITLES is empty by design)"}`);

  if (unhandled.length > 0) {
    console.log(`\n${unhandled.length} rows have NO instruction in this script — confirm each one:`);
    console.log(`  Is the same thing already sold elsewhere on the site (a real course record)?`);
    console.log(`    yes -> add its exact title to DELETE_TITLES and re-run with --delete`);
    console.log(`    no  -> add it to RECATEGORISE with the category it belongs in`);
    for (const s of unhandled) console.log(`  · [${s.category || "-"}] ${s.title}`);
  }

  console.log(`\nSTAYS HERE — genuinely a service, not a misplaced course:`);
  console.log(`  - คอร์สการสนทนาทางธุรกิจ (ภาษาอังกฤษ)  — taught on-site at client companies (B2B)`);
  console.log(`  - Digital Marketing | LINE OA`);

  console.log(`\nSTILL IN THE WRONG PLACE — sold to students, so these belong in \`courses\`.`);
  console.log(`Until moved they have no detail page, no price, and no mega-menu entry:`);
  console.log(`  - ตะลุยสอบ ด่วนพิเศษ        — runs in rounds, 2-3 months before entrance exams.`);
  console.log(`                                Seasonal, same as Genious Summer Intensive, which is`);
  console.log(`                                already a normal course record — handle it the same way.`);
  console.log(`  - ติวสอบ TOEIC/IELTS/Toefl  — one row today; unconfirmed whether it is 1 course or 3.`);
  console.log(`  Needs real price / schedule / description per course before promoting.`);

  console.log(`\nNew rows carrying [MOCKUP] descriptions, still needing real details:`);
  for (const r of CREATE) console.log(`  - ${r.title}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
