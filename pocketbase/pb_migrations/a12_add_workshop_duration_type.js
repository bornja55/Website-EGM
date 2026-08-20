/// <reference path="../pb_data/types.d.ts" />

// Adds `duration_type` to workshops — Siraphob, 2026-08-16 round 4: /services
// section 3 splits into two rows, "Workshop 1 วัน" and "Workshop 1 หลักสูตร",
// and there was no existing field to tell those apart (event_date is a
// single date either way; tags is the gallery tag-matching pool, not a
// mega-menu-style category — see migration 5's own comment on that field).
//
// Select, not text — a fixed pair of values keeps /services.astro's grouping
// exhaustive (every workshop is either-or, no free-text drift like "1day"
// vs "1 วัน" vs "หนึ่งวัน" slowly diverging across records).
//
// Optional and empty on every existing workshop. Until Siraphob sets this
// per record (PocketBase Admin UI — just 2 real workshops right now, not
// worth a script), /services.astro falls back to showing every workshop in
// one unsplit row rather than silently hiding uncategorised ones.

migrate(
  (app) => {
    const workshops = app.findCollectionByNameOrId("workshops");
    workshops.fields.add(
      new Field({
        name: "duration_type",
        type: "select",
        maxSelect: 1,
        values: ["1 วัน", "1 หลักสูตร"],
      })
    );
    app.save(workshops);
  },
  (app) => {
    const workshops = app.findCollectionByNameOrId("workshops");
    workshops.fields.removeByName("duration_type");
    app.save(workshops);
  }
);
