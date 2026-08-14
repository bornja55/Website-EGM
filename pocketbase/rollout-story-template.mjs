// IDEMPOTENT rollout — applies the native-speaker "story template" to every
// other course, the promotion, and both workshops.
//
// The template, as approved on /course/native-speaker:
//   เหมาะกับใคร            -> unchanged (plain centred block)
//   เรียนอะไรบ้าง          -> 2-up photo CARD row (existing copy + a books card)
//   รูปแบบการเรียน         -> DELETED (its day/time/price now live in the
//                             summary stat row at the top of the tab; keeping
//                             both prints the same schedule twice)
//   ปัญหาที่คอร์สนี้ช่วยแก้  -> unchanged, image cleared so it centres
//   จุดเด่นของ English Mania -> 3-row ACCORDION with a photo per row
//   ผลลัพธ์หลังเรียนจบ      -> 3-up TEXT CARD row
//
// Requires migrations 6, 7, 8 and 9. Restart PocketBase once to auto-apply.
//
// ---------------------------------------------------------------------------
// TWO THINGS THIS SCRIPT DELIBERATELY DOES NOT DO
// ---------------------------------------------------------------------------
// 1. It does NOT add the books card to non-English items. That card names
//    California and Oxford for ป.1-6 — a claim that is only true for the
//    English courses, and the only cover artwork that exists is English,
//    Thai, Maths and Science (no Japanese, no per-course document samples).
//    Items without a books card keep "เรียนอะไรบ้าง" as a normal full-width
//    block rather than becoming a lone card in an empty 2-up grid.
//
// 2. It does NOT invent copy beyond what seed-course-sections-mockup.mjs
//    already put on these items. The accordion rows and outcome cards it
//    creates carry "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]" and generic prompts, NOT
//    subject-specific claims. Splitting one mockup block into three does not
//    make it more true — it makes it three times as much to replace. See the
//    debt summary this script prints when it finishes.
//
// Photos for the accordion rows are picked from gallery_images by TAG MATCH
// against each item's own tags, excluding photos pinned to a different item
// (the CRITICAL #2 rule from migration 5). An item with fewer than 1 matching
// photo is skipped for the accordion — an accordion with an empty picture
// column looks broken — and its จุดเด่น section is left as a plain block.
//
// Safe to re-run: every step checks current state before writing, and
// native-speaker itself is skipped entirely (it is already the reference).
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node rollout-story-template.mjs
//   node rollout-story-template.mjs --dry-run     (report only, writes nothing)

import { writeFile } from "node:fs/promises";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;
const DRY = process.argv.includes("--dry-run");

const MOCK = "[MOCKUP — ต้องแก้เป็นข้อมูลจริง]";

const H_LEARN = "เรียนอะไรบ้าง";
const H_SCHEDULE = "รูปแบบการเรียน";
const H_PROBLEM = "ปัญหาที่คอร์สนี้ช่วยแก้";
const H_HIGHLIGHT = "จุดเด่นของ English Mania";
const H_OUTCOME = "ผลลัพธ์หลังเรียนจบ";

// Subject tag -> books-card artwork. Only English has a real composed tile
// (cover + document samples); Maths/Science have cover-only tiles sitting in
// "D:\Web EnglishMania\Book + doc\web-tiles" that have NOT been copied into
// web/public yet, so they are intentionally absent here. Add them once the
// same flat-lay treatment has been made for those subjects.
const BOOKS_CARD_BY_SUBJECT = {
  "ภาษาอังกฤษ": {
    heading: "หนังสือและเอกสารประกอบการเรียน",
    body:
      "<p>เรียนจากเอกสารที่สถาบันเรียบเรียงเอง ควบคู่กับหนังสือ California " +
      "และ Oxford สำหรับภาษาอังกฤษระดับ ป.1-6</p>",
    image: "/images/courses/books-english-mania.png",
  },
};

// Generic across every subject. Each row's title is a QUESTION about the
// school, not about the specific course, so nothing here asserts anything
// course-specific that hasn't been verified.
const ACCORDION_ROWS = [
  {
    heading: "ใครเป็นผู้สอน",
    body: `<p>${MOCK} ระบุว่าคอร์สนี้ใครสอน ประสบการณ์เท่าไร จบจากไหน (ใส่เฉพาะที่ยืนยันได้จริง)</p>`,
  },
  {
    heading: "เรียนกลุ่มเล็ก ดูแลทั่วถึง",
    body: `<p>${MOCK} ระบุจำนวนนักเรียนต่อห้องจริงของคอร์สนี้ และบอกว่าขนาดกลุ่มเท่านี้ทำให้ครูทำอะไรให้ได้บ้าง (ถ้าไม่คงที่ ให้เขียนเป็นช่วง)</p>`,
  },
  {
    heading: "เอกสารและแบบฝึกของสถาบัน",
    body: `<p>${MOCK} อธิบายว่าเอกสารที่ใช้ในคอร์สนี้มีอะไรบ้าง และนักเรียนได้กลับไปทำที่บ้านไหม</p>`,
  },
];

const OUTCOME_CARDS = [
  {
    heading: "ทักษะที่ทำได้จริง",
    body: `<p>${MOCK} หลังเรียนจบคอร์สนี้ นักเรียนทำอะไรได้ที่ก่อนเรียนทำไม่ได้ — เขียนเป็นสิ่งที่ทำได้ ไม่ใช่ "เก่งขึ้น"</p>`,
  },
  {
    heading: "เนื้อหาที่ครอบคลุม",
    body: `<p>${MOCK} ระบุขอบเขตที่วัดได้ เช่น ครอบคลุมบทไหน/หัวข้ออะไร หรือทำแบบฝึกระดับไหนได้</p>`,
  },
  {
    heading: "ผลที่โรงเรียน",
    body: `<p>${MOCK} ถ้ามีตัวเลขจริงให้ใส่ — ถ้าไม่มีสถิติที่ยืนยันได้ ให้ลบการ์ดใบนี้ทิ้ง อย่าเขียนลอยๆ</p>`,
  },
];

const ITEMS = [
  ["courses", "exclusive-english-mentoring", "course"],
  ["courses", "japanese", "course"],
  ["courses", "private-one-on-one", "course"],
  ["courses", "entrance-exam-m1", "course"],
  ["courses", "tgat-a-level", "course"],
  ["courses", "grade-booster-weekend", "course"],
  ["courses", "grade-booster-weekday", "course"],
  ["courses", "physics-sunday", "course"],
  ["courses", "genious-summer-intensive", "course"],
  ["courses", "english-foundation", "course"],
  ["promotions", "online-1on1-990", "promotion"],
  ["workshops", "insect-pinning-workshop", "workshop"],
  ["workshops", "stem-fun-lab", "workshop"],
  // native-speaker is intentionally absent — it IS the reference.
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

async function patch(token, id, record) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/course_sections/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`patch ${id} failed: ${res.status} ${await res.text()}`);
}

async function create(token, record) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/course_sections/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status} ${await res.text()}`);
}

// Writes to courses/promotions/workshops themselves, not course_sections.
async function patchItem(token, collection, id, record) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`patch ${collection}/${id} failed: ${res.status} ${await res.text()}`);
}

async function remove(token, id) {
  if (DRY) return;
  const res = await fetch(`${PB_URL}/api/collections/course_sections/records/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  // course_sections has deleteRule: null (migration 5) — superuser only, which
  // is what this script authenticates as.
  if (!res.ok) throw new Error(`delete ${id} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  if (DRY) console.log("DRY RUN — nothing will be written.\n");
  const token = await authAdmin();

  const [courses, promotions, workshops, allSections, gallery] = await Promise.all([
    listAll(token, "courses"),
    listAll(token, "promotions"),
    listAll(token, "workshops"),
    listAll(token, "course_sections"),
    listAll(token, "gallery_images"),
  ]);
  const byCollection = { courses, promotions, workshops };

  if (allSections[0] && !("layout" in allSections[0])) {
    console.error(
      "course_sections has no `layout` field — migrations 6/7/8/9 haven't been applied. " +
        "Restart PocketBase and re-run."
    );
    process.exit(1);
  }

  // Tag-matched pool: photos NOT pinned to any specific item (migration 5's
  // CRITICAL #2 — a pinned photo must never leak onto another item).
  const pool = gallery.filter((g) => !g.course && !g.promotion && !g.workshop);

  let converted = 0;
  const noPhotos = [];
  const noBooks = [];
  const deletedScheduleSections = [];
  const needsTrimming = [];
  let mockupBlocks = 0;

  for (const [collection, slug, relation] of ITEMS) {
    const rec = byCollection[collection].find((r) => r.slug === slug);
    if (!rec) {
      console.warn(`  ! ${collection}/"${slug}" not found — skipping.`);
      continue;
    }
    const sections = allSections.filter((s) => s[relation] === rec.id);
    const find = (h) => sections.find((s) => s.heading === h);
    const tags = rec.tags || [];
    console.log(`\n${collection}/${slug}`);

    // --- รูปแบบการเรียน: delete, it is now the summary block at the top ------
    // Same reasoning as remove-native-speaker-schedule-section.mjs, which did
    // this for the reference course. Missing it here would leave every other
    // page printing its day/time/price twice — once in the stat row, once as a
    // story section. Matches the heading EXACTLY so no other section is at risk.
    const schedule = find(H_SCHEDULE);
    if (schedule) {
      deletedScheduleSections.push({ collection, slug, ...schedule });
      const plain = String(schedule.body || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      await remove(token, schedule.id);
      console.log(`  - deleted "${H_SCHEDULE}" (now shown in the summary stat row)`);

      // The stat row only carries day / time / price / grade / subject. Some of
      // these bodies say MORE — the 990 promotion's "หยุด/ลาไม่ตัดชั่วโมง
      // ลงชดเชยได้ภายในเดือน", the insect workshop's "อบรมโดยวิทยากรจาก Wanghin
      // Lab". That copy is real and would be lost, so it moves into the new
      // `summary_note` footnote field (migration 9) instead of being deleted
      // with the section.
      //
      // The FULL old body is parked there verbatim rather than an auto-trimmed
      // version: stripping "the schedule part" with a regex would silently
      // mangle real sentences, and the note now duplicates the stat row until
      // a human edits it down. It is flagged below so that edit actually
      // happens — a wrong-but-plausible auto-edit is worse than an obvious
      // redundant one.
      if (plain.length > 0 && !rec.summary_note) {
        await patchItem(token, collection, rec.id, { summary_note: plain });
        needsTrimming.push(`${slug}: ${plain.slice(0, 80)}…`);
        console.log(`  ~ old body parked in summary_note (needs trimming by hand)`);
      }
    }

    // --- ปัญหา: clear the image so it renders as a centred text block -------
    const problem = find(H_PROBLEM);
    if (problem?.image) {
      await patch(token, problem.id, { image: "" });
      console.log(`  - cleared image on "${H_PROBLEM}"`);
    }

    // --- เรียนอะไรบ้าง: 2-up card row, only where a books card is truthful --
    const learn = find(H_LEARN);
    const subject = Object.keys(BOOKS_CARD_BY_SUBJECT).find((s) => tags.includes(s));
    const booksCard = subject ? BOOKS_CARD_BY_SUBJECT[subject] : null;
    if (!learn) {
      console.log(`  ! no "${H_LEARN}" section`);
    } else if (!booksCard) {
      noBooks.push(slug);
      console.log(`  · "${H_LEARN}" left as a plain block (no books artwork for this subject)`);
    } else if (learn.layout === "card") {
      console.log(`  (card row already built)`);
    } else {
      await patch(token, learn.id, { layout: "card", group_heading: H_LEARN });
      if (!find(booksCard.heading)) {
        await create(token, {
          [relation]: rec.id,
          heading: booksCard.heading,
          body: booksCard.body,
          image: booksCard.image,
          sort_order: (learn.sort_order ?? 0) + 0.5,
          layout: "card",
          group_heading: "",
        });
      }
      console.log(`  + "${H_LEARN}" -> 2-up card row`);
      converted++;
    }

    // --- จุดเด่น: 3-row accordion, needs one photo per row ------------------
    const highlight = find(H_HIGHLIGHT);
    const photos = pool
      .filter((g) => (g.tags || []).some((t) => tags.includes(t)))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((g) => g.image) // gallery_images stores the path in `image`
      .filter(Boolean);

    if (!highlight) {
      console.log(`  ! no "${H_HIGHLIGHT}" section`);
    } else if (photos.length === 0) {
      noPhotos.push(slug);
      console.log(`  · "${H_HIGHLIGHT}" left as a plain block (no tag-matched photos)`);
    } else if (highlight.layout === "accordion") {
      console.log(`  (accordion already built)`);
    } else {
      await patch(token, highlight.id, {
        layout: "accordion",
        group_heading: H_HIGHLIGHT,
        heading: ACCORDION_ROWS[0].heading,
        body: ACCORDION_ROWS[0].body,
        image: photos[0],
      });
      for (let i = 1; i < ACCORDION_ROWS.length; i++) {
        if (find(ACCORDION_ROWS[i].heading)) continue;
        await create(token, {
          [relation]: rec.id,
          heading: ACCORDION_ROWS[i].heading,
          body: ACCORDION_ROWS[i].body,
          image: photos[i % photos.length], // cycle if fewer than 3 photos match
          sort_order: (highlight.sort_order ?? 0) + i * 0.1,
          layout: "accordion",
          group_heading: "",
        });
      }
      console.log(`  + "${H_HIGHLIGHT}" -> 3-row accordion (${photos.length} photos matched)`);
      converted++;
      mockupBlocks += 3;
    }

    // --- ผลลัพธ์: 3-up text card row ---------------------------------------
    const outcome = find(H_OUTCOME);
    if (!outcome) {
      console.log(`  ! no "${H_OUTCOME}" section`);
    } else if (outcome.layout === "text-card") {
      console.log(`  (text card row already built)`);
    } else {
      await patch(token, outcome.id, {
        layout: "text-card",
        group_heading: H_OUTCOME,
        heading: OUTCOME_CARDS[0].heading,
        body: OUTCOME_CARDS[0].body,
        image: "",
      });
      for (let i = 1; i < OUTCOME_CARDS.length; i++) {
        if (find(OUTCOME_CARDS[i].heading)) continue;
        await create(token, {
          [relation]: rec.id,
          heading: OUTCOME_CARDS[i].heading,
          body: OUTCOME_CARDS[i].body,
          image: "",
          sort_order: (outcome.sort_order ?? 0) + i * 0.1,
          layout: "text-card",
          group_heading: "",
        });
      }
      console.log(`  + "${H_OUTCOME}" -> 3-up text card row`);
      converted++;
      mockupBlocks += 3;
    }
  }

  // Deletes are the only irreversible thing this script does — keep the raw
  // records so a body can be pasted back if it turns out to have been needed.
  if (deletedScheduleSections.length > 0 && !DRY) {
    await writeFile(
      "deleted-schedule-sections.json",
      JSON.stringify(deletedScheduleSections, null, 2),
      "utf8"
    );
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`${converted} sections converted across ${ITEMS.length} items.`);
  if (deletedScheduleSections.length > 0) {
    console.log(
      `\n${deletedScheduleSections.length} "${H_SCHEDULE}" sections deleted` +
        (DRY ? " (dry run)" : " — backed up to deleted-schedule-sections.json")
    );
  }
  if (needsTrimming.length > 0) {
    console.log(`\n!! ${needsTrimming.length} items had their old "${H_SCHEDULE}" body parked in`);
    console.log(`   summary_note VERBATIM. It currently repeats the stat row above it. Edit each one`);
    console.log(`   down in the Admin UI to just the part the stats CAN'T say (conditions, who runs`);
    console.log(`   it, make-up-class policy), or clear the field if there is nothing left:`);
    for (const line of needsTrimming) console.log(`   - ${line}`);
  }
  if (noBooks.length) {
    console.log(`\nNo books card (subject has no artwork / claim wouldn't be true):`);
    console.log(`  ${noBooks.join(", ")}`);
  }
  if (noPhotos.length) {
    console.log(`\nNo accordion (no tag-matched gallery photos — tag some in the Admin UI, then re-run):`);
    console.log(`  ${noPhotos.join(", ")}`);
  }
  console.log(`\nCONTENT DEBT: this run created roughly ${mockupBlocks} more mockup blocks.`);
  console.log(`Find every one of them in the Admin UI: course_sections, body contains "MOCKUP".`);
  console.log(`None of these pages should be used as a paid-ad landing page until they are replaced.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
