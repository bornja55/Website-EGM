// One-off, IDEMPOTENT seed script — populates the previously-empty
// gallery_images collection so the "รูป" tab on course/promotion/workshop
// detail pages stops showing "ยังไม่มีรูปภาพสำหรับหัวข้อนี้".
//
// All 18 photos are REAL, sourced from FB raw/Export_1786443238_452bc550
// (visually vetted one-by-one this session — one Facebook ad-graphic,
// image_612.jpg, was found in the same batch and deliberately excluded).
// Copied into web/public/images/gallery/ with descriptive filenames. No
// fabricated content — same standard as every other seed script here.
//
// Two usage modes (see COURSE_PAGES_PRD.md "Phase 1.5" + pocketbase.ts):
//   - PINNED: course/promotion/workshop relation set, appears ONLY on that
//     item's own page, explicit sort_order. Used here for
//     insect-pinning-workshop (4 photos, all on-topic — specimen box, craft,
//     whole-class shot) and stem-fun-lab (3 photos — race car, hot-plate
//     experiment, volcano) since real event-specific photos exist for both.
//   - TAG-MATCHED: no relation set, tags only. Fills the gallery on any
//     course/promotion/workshop whose own `tags` overlaps. Used for the
//     remaining 11 general classroom/science/English photos so they spread
//     across the whole catalog instead of sitting unused.
//
// Also patches `tags` onto the 3 items that had none (stem-fun-lab,
// insect-pinning-workshop, online-1on1-990) — discovered via Grep this
// session that tag-based matching would otherwise silently return nothing
// for them. Tag values must come from the fixed vocabulary in
// pb_migrations/5_add_story_content.js — do not invent new ones here.
//
// Safe to re-run: skips any (image path) that's already a gallery_images
// record, and skips a tags patch if the target already has tags set.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node seed-gallery-images.mjs

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

async function patch(token, collection, id, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`patch ${collection}/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

// --- pinned photos ----------------------------------------------------------
// { targetSlug, relationField, image, caption, sort_order }
const PINNED = [
  {
    collection: "workshops",
    slug: "insect-pinning-workshop",
    relationField: "workshop",
    items: [
      { image: "/images/gallery/insect-class-01.jpg", caption: "ครูอธิบายขั้นตอนการปักแมลงให้ทั้งห้องดู", sort_order: 1 },
      { image: "/images/gallery/insect-craft-01.jpg", caption: "ผลงานผีเสื้อของนักเรียน หน้ากล่องแมลงตัวอย่าง", sort_order: 2 },
      { image: "/images/gallery/insect-craft-02.jpg", caption: "นักเรียนโชว์ผลงานงานฝีมือแมลง", sort_order: 3 },
      { image: "/images/gallery/insect-specimen-01.jpg", caption: "กล่องตัวอย่างแมลงที่ใช้ประกอบการเรียน", sort_order: 4 },
    ],
  },
  {
    collection: "workshops",
    slug: "stem-fun-lab",
    relationField: "workshop",
    items: [
      { image: "/images/gallery/stem-car-01.jpg", caption: "นักเรียนกับรถแข่งพลังยางที่ประดิษฐ์เอง", sort_order: 1 },
      { image: "/images/gallery/stem-experiment-01.jpg", caption: "ทดลองหลอมสบู่บนเครื่องให้ความร้อน", sort_order: 2 },
      { image: "/images/gallery/stem-volcano-01.jpg", caption: "การทดลองภูเขาไฟจำลอง", sort_order: 3 },
    ],
  },
];

// --- tag-matched pool --------------------------------------------------------
// No relation set. Tags must be from the fixed vocabulary in
// pb_migrations/5_add_story_content.js.
const TAG_MATCHED = [
  { image: "/images/gallery/science-static-01.jpg", caption: "การทดลองไฟฟ้าสถิตในห้องเรียน", tags: ["วิทยาศาสตร์"], sort_order: 1 },
  { image: "/images/gallery/science-beaker-01.jpg", caption: "นักเรียนทำการทดลองวิทยาศาสตร์กับหลอดทดลอง", tags: ["วิทยาศาสตร์"], sort_order: 2 },
  { image: "/images/gallery/science-testtube-01.jpg", caption: "อุปกรณ์การทดลองวิทยาศาสตร์", tags: ["วิทยาศาสตร์"], sort_order: 3 },
  { image: "/images/gallery/science-specimen-01.jpg", caption: "กล่องตัวอย่างสำหรับการเรียนวิทยาศาสตร์", tags: ["วิทยาศาสตร์"], sort_order: 4 },
  { image: "/images/gallery/science-skittles-01.jpg", caption: "การทดลองสีผสมกับลูกอม", tags: ["วิทยาศาสตร์"], sort_order: 5 },
  { image: "/images/gallery/craft-keychain-01.jpg", caption: "กิจกรรมงานฝีมือของนักเรียน", tags: ["วิทยาศาสตร์"], sort_order: 6 },
  { image: "/images/gallery/english-lowtable-01.jpg", caption: "บรรยากาศการเรียนของนักเรียนกลุ่มเล็ก", tags: ["ภาษาอังกฤษ", "ป.1", "ป.2", "ป.3"], sort_order: 7 },
  { image: "/images/gallery/english-teens-01.jpg", caption: "นักเรียนมัธยมปลายตั้งใจเรียนในห้อง", tags: ["ภาษาอังกฤษ", "ม.4", "ม.5", "ม.6", "TGAT & A-Level"], sort_order: 8 },
  { image: "/images/gallery/english-coloring-01.jpg", caption: "นักเรียนทำใบงานในห้องเรียน", tags: ["ภาษาอังกฤษ", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"], sort_order: 9 },
  { image: "/images/gallery/english-writing-01.jpg", caption: "นักเรียนตั้งใจเขียนงานในห้องเรียน", tags: ["ภาษาอังกฤษ"], sort_order: 10 },
  { image: "/images/gallery/english-bodyparts-01.jpg", caption: "นักเรียนทำใบงานคำศัพท์ภาษาอังกฤษ", tags: ["ภาษาอังกฤษ", "ป.1", "ป.2", "ป.3"], sort_order: 11 },
];

// --- tags patch for items that currently have none --------------------------
const TAG_PATCH = [
  { collection: "workshops", slug: "stem-fun-lab", tags: ["วิทยาศาสตร์"] },
  { collection: "workshops", slug: "insect-pinning-workshop", tags: ["วิทยาศาสตร์"] },
  { collection: "promotions", slug: "online-1on1-990", tags: ["ภาษาอังกฤษ", "ตัวต่อตัว"] },
];

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const [courses, promotions, workshops, existingGalleryImages] = await Promise.all([
    listAll(token, "courses"),
    listAll(token, "promotions"),
    listAll(token, "workshops"),
    listAll(token, "gallery_images"),
  ]);
  const byCollection = { courses, promotions, workshops };
  const existingImagePaths = new Set(existingGalleryImages.map((g) => g.image));

  let created = 0;
  let skipped = 0;

  // Pinned
  for (const group of PINNED) {
    const rec = byCollection[group.collection].find((r) => r.slug === group.slug);
    if (!rec) {
      console.warn(`  ! ${group.collection}/"${group.slug}" not found — skipping pinned group.`);
      continue;
    }
    for (const item of group.items) {
      if (existingImagePaths.has(item.image)) {
        skipped++;
        continue;
      }
      await create(token, "gallery_images", {
        [group.relationField]: rec.id,
        image: item.image,
        caption: item.caption,
        sort_order: item.sort_order,
      });
      console.log(`  + pinned ${item.image} -> ${group.collection}/"${group.slug}"`);
      created++;
    }
  }

  // Tag-matched
  for (const item of TAG_MATCHED) {
    if (existingImagePaths.has(item.image)) {
      skipped++;
      continue;
    }
    await create(token, "gallery_images", {
      course: "",
      promotion: "",
      workshop: "",
      image: item.image,
      caption: item.caption,
      tags: item.tags,
      sort_order: item.sort_order,
    });
    console.log(`  + tag-matched ${item.image} [${item.tags.join(", ")}]`);
    created++;
  }

  // Tags patch for previously-untagged items
  let patched = 0;
  for (const t of TAG_PATCH) {
    const rec = byCollection[t.collection].find((r) => r.slug === t.slug);
    if (!rec) {
      console.warn(`  ! ${t.collection}/"${t.slug}" not found — skipping tags patch.`);
      continue;
    }
    if (rec.tags && rec.tags.length > 0) {
      console.log(`  (${t.collection}/"${t.slug}" already has tags, skipping patch)`);
      continue;
    }
    await patch(token, t.collection, rec.id, { tags: t.tags });
    console.log(`  + patched tags [${t.tags.join(", ")}] onto ${t.collection}/"${t.slug}"`);
    patched++;
  }

  console.log(`\nDone. ${created} gallery_images created, ${skipped} already existed, ${patched} items got tags patched.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
