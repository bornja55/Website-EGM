/// <reference path="../pb_data/types.d.ts" />

// Source of truth for the schema. Edit this file, not the live DB, then re-migrate.
// Mirrors the pattern used in empire-website: content collections are readable by
// anyone (`listRule`/`viewRule` = ""), writable only by an authenticated `editors`
// record (or superuser). `contact_submissions` is public-create / superuser-read.

migrate((app) => {
  const editorsAuthRule =
    "@request.auth.id != '' && @request.auth.collectionName = 'editors'";

  // PocketBase v0.23+ does NOT add `created`/`updated` fields implicitly —
  // every collection below declares them explicitly. Found by static review
  // (couldn't boot PocketBase in this sandbox to test live — GitHub release
  // downloads are blocked by the sandbox's network allowlist) after noticing
  // `getActivePromotions()` in web/src/lib/pocketbase.ts sorts by
  // `-created`, which would 400 against a collection that never declared
  // that field. empire-website's own CLAUDE.md documents hitting exactly
  // this gap for a different collection — same fix applied everywhere here
  // up front instead of waiting to hit it in each collection one at a time.
  const timestampFields = [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];

  // --- editors (auth collection) ---------------------------------------
  const editors = new Collection({
    type: "auth",
    name: "editors",
    listRule: null,
    viewRule: "@request.auth.id = id",
    createRule: null, // superuser-only
    updateRule: "@request.auth.id = id",
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true },
      ...timestampFields,
    ],
  });
  app.save(editors);

  // --- site_settings (singleton) ----------------------------------------
  const siteSettings = new Collection({
    type: "base",
    name: "site_settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "phone", type: "text" },
      { name: "line_oa_url", type: "url" },
      { name: "address", type: "text" },
      { name: "hours", type: "text" },
      { name: "company_name_th", type: "text" },
      { name: "company_registration_no", type: "text" },
      { name: "facebook_url", type: "url" },
      { name: "google_maps_embed_url", type: "url" },
      ...timestampFields,
    ],
  });
  app.save(siteSettings);

  // --- services -----------------------------------------------------------
  const services = new Collection({
    type: "base",
    name: "services",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "description", type: "editor" },
      { name: "icon", type: "text" },
      { name: "sort_order", type: "number" },
      ...timestampFields,
    ],
  });
  app.save(services);

  // --- workshops (limited-seat events, link out to LINE to book) ---------
  const workshops = new Collection({
    type: "base",
    name: "workshops",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "description", type: "editor" },
      { name: "event_date", type: "date" },
      { name: "price", type: "number" },
      { name: "seats_total", type: "number" },
      { name: "cover_image", type: "text" }, // path under web/public/images/
      { name: "line_link", type: "url" },
      { name: "is_active", type: "bool" },
      ...timestampFields,
    ],
    indexes: ["CREATE UNIQUE INDEX idx_workshops_slug ON workshops (slug)"],
  });
  app.save(workshops);

  // --- promotions ----------------------------------------------------------
  const promotions = new Collection({
    type: "base",
    name: "promotions",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "description", type: "editor" },
      { name: "price", type: "number" },
      { name: "valid_until", type: "date" },
      { name: "line_link", type: "url" },
      { name: "is_active", type: "bool" },
      ...timestampFields, // required — getActivePromotions() sorts by -created
    ],
  });
  app.save(promotions);

  // --- testimonials (manually curated) ------------------------------------
  const testimonials = new Collection({
    type: "base",
    name: "testimonials",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "author_name", type: "text", required: true },
      { name: "quote", type: "text", required: true },
      { name: "source", type: "select", values: ["facebook", "google", "other"] },
      { name: "rating", type: "number" },
      ...timestampFields,
    ],
  });
  app.save(testimonials);

  // --- blog_posts -----------------------------------------------------------
  const blogPosts = new Collection({
    type: "base",
    name: "blog_posts",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "excerpt", type: "text" },
      { name: "content", type: "editor" },
      { name: "cover_image", type: "text" },
      { name: "published_at", type: "date" },
      ...timestampFields,
    ],
    indexes: ["CREATE UNIQUE INDEX idx_blog_posts_slug ON blog_posts (slug)"],
  });
  app.save(blogPosts);

  // --- gallery_albums / gallery_images -------------------------------------
  const galleryAlbums = new Collection({
    type: "base",
    name: "gallery_albums",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true },
      { name: "cover_image", type: "text" },
      ...timestampFields,
    ],
  });
  app.save(galleryAlbums);

  const galleryImages = new Collection({
    type: "base",
    name: "gallery_images",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null, // superuser-only, consistent with every other collection here
    fields: [
      { name: "album", type: "relation", collectionId: galleryAlbums.id, maxSelect: 1 },
      { name: "image", type: "text", required: true },
      { name: "caption", type: "text" },
      ...timestampFields,
    ],
  });
  app.save(galleryImages);

  // --- faq -------------------------------------------------------------------
  const faq = new Collection({
    type: "base",
    name: "faq",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "question", type: "text", required: true },
      { name: "answer", type: "editor", required: true },
      { name: "sort_order", type: "number" },
      ...timestampFields,
    ],
  });
  app.save(faq);

  // --- contact_submissions (public create, superuser-read only) ------------
  const contactSubmissions = new Collection({
    type: "base",
    name: "contact_submissions",
    listRule: null, // superuser only
    viewRule: null,
    createRule: "", // public
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "phone", type: "text" },
      { name: "email", type: "email" },
      { name: "message", type: "text", required: true },
      { name: "source_page", type: "text" },
      // PDPA — proof the visitor ticked the consent checkbox at submit time.
      // Enforced server-side too in api/contact.ts, this field is the audit
      // trail, not the enforcement.
      { name: "consent_given", type: "bool", required: true },
      ...timestampFields, // so the superuser can sort the inbox by newest
    ],
  });
  app.save(contactSubmissions);
}, (app) => {
  // rollback: delete in reverse dependency order
  const names = [
    "contact_submissions", "faq", "gallery_images", "gallery_albums",
    "blog_posts", "testimonials", "promotions", "workshops", "services",
    "site_settings", "editors",
  ];
  for (const name of names) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (e) {}
  }
});
