/// <reference path="../pb_data/types.d.ts" />

// Course/promotion/workshop product pages project — see COURSE_PAGES_PRD.md (Phase 1).
// Schema only. No data is touched here — the 9 real courses currently live as
// `promotions` records get moved into the new `courses` collection by a
// separate one-off script (pocketbase/migrate-courses.mjs), run manually
// AFTER this migration applies. Do not skip that script after running this —
// the 9 courses will still be sitting in `promotions` until it runs.

migrate((app) => {
  const editorsAuthRule =
    "@request.auth.id != '' && @request.auth.collectionName = 'editors'";
  const timestampFields = [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];

  // Full tag vocabulary up front (see COURSE_PAGES_PRD.md "Tag vocabulary") —
  // grouping into mega-menu columns (รายวิชา/ชั้นปี/ติวสอบ/รูปแบบ) happens in
  // web/src/lib/courseTags.ts (Phase 2), not here; this is just the flat list
  // PocketBase's `select` field needs.
  const courseTagValues = [
    // รายวิชา
    "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาญี่ปุ่น",
    // ชั้นปี
    "อ.3", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
    "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
    // ติวสอบ
    "ติวสอบเข้า ม.1", "TGAT & A-Level",
    // รูปแบบ
    "ตัวต่อตัว",
  ];

  // --- courses (new collection) -------------------------------------------
  const courses = new Collection({
    type: "base",
    name: "courses",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "tagline", type: "text" },
      { name: "price", type: "number" },
      { name: "duration", type: "text" },
      { name: "schedule", type: "text" },
      { name: "description", type: "editor" },
      { name: "image", type: "text" }, // path under web/public/images/courses/
      { name: "tags", type: "select", values: courseTagValues, maxSelect: courseTagValues.length },
      { name: "sort_order", type: "number" },
      { name: "is_active", type: "bool" },
      { name: "line_link", type: "url" },
      ...timestampFields,
    ],
    indexes: ["CREATE UNIQUE INDEX idx_courses_slug ON courses (slug)"],
  });
  app.save(courses);

  // --- promotions: add slug + shared shape fields ---------------------------
  // `slug` is required for the new /promotions/[slug] route. Not marked
  // `required: true` at the schema level even though the app treats it as
  // such, same as workshops.slug — avoids PocketBase demanding a backfill
  // migration for the one existing 990฿ record before this can even apply.
  const promotions = app.findCollectionByNameOrId("promotions");
  promotions.fields.add(new Field({ name: "slug", type: "text" }));
  promotions.fields.add(new Field({ name: "tagline", type: "text" }));
  promotions.fields.add(new Field({ name: "duration", type: "text" }));
  promotions.fields.add(new Field({ name: "schedule", type: "text" }));
  // image was missing from the first draft of this migration — promotions
  // needs it for the same product-hero template courses/workshops use.
  promotions.fields.add(new Field({ name: "image", type: "text" }));
  app.save(promotions);

  // --- workshops: add tagline to match the shared shape ---------------------
  const workshops = app.findCollectionByNameOrId("workshops");
  workshops.fields.add(new Field({ name: "tagline", type: "text" }));
  app.save(workshops);
}, (app) => {
  const workshops = app.findCollectionByNameOrId("workshops");
  workshops.fields.removeByName("tagline");
  app.save(workshops);

  const promotions = app.findCollectionByNameOrId("promotions");
  promotions.fields.removeByName("slug");
  promotions.fields.removeByName("tagline");
  promotions.fields.removeByName("duration");
  promotions.fields.removeByName("schedule");
  promotions.fields.removeByName("image");
  app.save(promotions);

  try { app.delete(app.findCollectionByNameOrId("courses")); } catch (e) {}
});
