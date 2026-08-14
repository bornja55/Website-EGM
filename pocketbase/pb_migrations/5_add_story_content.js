/// <reference path="../pb_data/types.d.ts" />

// Course/promotion/workshop "story" content project — see COURSE_PAGES_PRD.md
// "Phase 1.5" section (final spec, 5x /scrutinize + /grill-me rounds).
// Schema only. No data is touched here. Applies uniformly to courses,
// promotions, AND workshops (not courses alone — see PRD's Phase 1.5 intro).
//
// Includes the CRITICAL #1 fix (retrofits contact_submissions.createRule to
// superuser-only, alongside the new reviews collection) and CRITICAL #2 fix
// (gallery_images relation fields, used by app code to exclude pinned photos
// from the tag-matched pool — enforced in query logic, not schema).

migrate((app) => {
  const editorsAuthRule =
    "@request.auth.id != '' && @request.auth.collectionName = 'editors'";
  // Public read of only approved reviews; editors/superuser see everything
  // (needed so the Admin UI list view isn't itself filtered to approved-only).
  const reviewsViewRule =
    "is_approved = true || (@request.auth.id != '' && @request.auth.collectionName = 'editors')";
  const timestampFields = [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];

  // Same flat tag vocabulary as migration 4's courses.tags — duplicated here
  // (each migration file is an isolated scope) because gallery_images.tags
  // and the new promotions/workshops.tags fields need the identical value
  // list. Keep both copies in sync if the vocabulary ever changes; the
  // mega-menu's own grouping table (web/src/lib/courseTags.ts, Phase 2) is
  // the single source of truth for *meaning*, this is just the PocketBase
  // `select` field's allowed values.
  const tagValues = [
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

  const courses = app.findCollectionByNameOrId("courses");
  const promotions = app.findCollectionByNameOrId("promotions");
  const workshops = app.findCollectionByNameOrId("workshops");
  const galleryImages = app.findCollectionByNameOrId("gallery_images");
  const contactSubmissions = app.findCollectionByNameOrId("contact_submissions");

  // --- course_sections (new collection) ------------------------------------
  // Despite the name, carries 3 relations (course/promotion/workshop, exactly
  // one populated per record) rather than one collection per content type —
  // see PRD "New collection course_sections". Admin-UI-only write path, so
  // "exactly one populated" is a human-diligence rule, not server-enforced.
  const courseSections = new Collection({
    type: "base",
    name: "course_sections",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "course", type: "relation", collectionId: courses.id, maxSelect: 1 },
      { name: "promotion", type: "relation", collectionId: promotions.id, maxSelect: 1 },
      { name: "workshop", type: "relation", collectionId: workshops.id, maxSelect: 1 },
      { name: "heading", type: "text", required: true },
      { name: "body", type: "editor" },
      { name: "image", type: "text" }, // path under web/public/images/, same convention as other image fields
      { name: "sort_order", type: "number" },
      ...timestampFields,
    ],
  });
  app.save(courseSections);

  // --- reviews (new collection, public submission form) --------------------
  // CRITICAL #1 fix: createRule is superuser-only, NOT public. The Astro API
  // route (web/src/pages/api/reviews.ts, written separately) authenticates as
  // a service/superuser account before writing — same pattern
  // pocketbase/migrate-courses.mjs already uses — so there is no path that
  // skips the route's Turnstile/consent/relation-exactly-one checks.
  const reviews = new Collection({
    type: "base",
    name: "reviews",
    listRule: reviewsViewRule,
    viewRule: reviewsViewRule,
    createRule: null, // superuser-only — see CRITICAL #1 in COURSE_PAGES_PRD.md
    updateRule: editorsAuthRule, // editors flip is_approved via the Admin UI
    deleteRule: null,
    fields: [
      { name: "course", type: "relation", collectionId: courses.id, maxSelect: 1 },
      { name: "promotion", type: "relation", collectionId: promotions.id, maxSelect: 1 },
      { name: "workshop", type: "relation", collectionId: workshops.id, maxSelect: 1 },
      { name: "author_name", type: "text", required: true },
      { name: "quote", type: "text", required: true },
      { name: "rating", type: "number" },
      { name: "is_approved", type: "bool" }, // defaults false; editor approves via Admin UI
      // Dedicated public-display consent — NOT contact_submissions.consent_given,
      // that field's scope is "may be contacted back," this is "may publish my
      // name and words publicly." Own wording, required to submit (enforced in
      // api/reviews.ts, same pattern as contact.ts's consent_given check).
      { name: "public_display_consent", type: "bool", required: true },
      ...timestampFields,
    ],
  });
  app.save(reviews);

  // --- gallery_images: pin relations + tags ---------------------------------
  // Three optional relations (at most one populated) for item-specific pinned
  // photos, rendered first by sort_order. `tags` powers the tag-matched
  // fill-in pool — CRITICAL #2: app-code queries for that pool must exclude
  // any record with a relation set (course/promotion/workshop != null), or a
  // pinned photo would leak onto every other item sharing an overlapping tag.
  // Not enforced here at the schema level — this is a query-time rule applied
  // in web/src/lib/pocketbase.ts's getTagMatchedGalleryImages().
  galleryImages.fields.add(new Field({ name: "course", type: "relation", collectionId: courses.id, maxSelect: 1 }));
  galleryImages.fields.add(new Field({ name: "promotion", type: "relation", collectionId: promotions.id, maxSelect: 1 }));
  galleryImages.fields.add(new Field({ name: "workshop", type: "relation", collectionId: workshops.id, maxSelect: 1 }));
  galleryImages.fields.add(new Field({ name: "sort_order", type: "number" }));
  galleryImages.fields.add(new Field({ name: "tags", type: "select", values: tagValues, maxSelect: tagValues.length }));
  app.save(galleryImages);

  // --- promotions / workshops: add tags -------------------------------------
  // Phase 1 kept `tags` courses-only (it only powered the mega-menu). The
  // gallery tag-matching feature needs it everywhere per PRD Phase 1.5.
  promotions.fields.add(new Field({ name: "tags", type: "select", values: tagValues, maxSelect: tagValues.length }));
  app.save(promotions);

  workshops.fields.add(new Field({ name: "tags", type: "select", values: tagValues, maxSelect: tagValues.length }));
  app.save(workshops);

  // --- contact_submissions: retrofit createRule to superuser-only ----------
  // Not new scope for this feature, but required to actually close CRITICAL #1
  // (this collection has had the exact same public-createRule gap since it
  // shipped). api/contact.ts (retrofit, written separately) must authenticate
  // as a service/superuser account before writing, same as api/reviews.ts.
  contactSubmissions.createRule = null;
  app.save(contactSubmissions);
}, (app) => {
  const contactSubmissions = app.findCollectionByNameOrId("contact_submissions");
  contactSubmissions.createRule = ""; // restore Phase-1-and-earlier public create
  app.save(contactSubmissions);

  const workshops = app.findCollectionByNameOrId("workshops");
  workshops.fields.removeByName("tags");
  app.save(workshops);

  const promotions = app.findCollectionByNameOrId("promotions");
  promotions.fields.removeByName("tags");
  app.save(promotions);

  const galleryImages = app.findCollectionByNameOrId("gallery_images");
  galleryImages.fields.removeByName("tags");
  galleryImages.fields.removeByName("sort_order");
  galleryImages.fields.removeByName("workshop");
  galleryImages.fields.removeByName("promotion");
  galleryImages.fields.removeByName("course");
  app.save(galleryImages);

  try { app.delete(app.findCollectionByNameOrId("reviews")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("course_sections")); } catch (e) {}
});
