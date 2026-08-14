/// <reference path="../pb_data/types.d.ts" />

// Adds the apple.com "Significant others." accordion to course_sections.
//
// Reference: one large grey panel, a column of collapsible rows on the left
// (row title + chevron, one open at a time, its answer revealed underneath),
// and a picture on the right that swaps to match whichever row is open.
//
// Same mechanism as migration 6's "card": a per-record FLAG, and
// ProductTabs.astro groups CONSECUTIVE records sharing the flag into one
// widget. So an accordion is just N course_sections in a row — each record's
// `heading` is a row title, `body` is its answer, `image` is the picture shown
// while that row is open, and `group_heading` on the FIRST record names the
// whole block. No new collection, no parent/child relation, and the row count
// is whatever the editor creates.
//
// Only widens the `layout` select's allowed values — existing records keep
// whatever they already had ("" or "card"), so nothing changes visually.

migrate(
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");
    const layout = sections.fields.getByName("layout");
    if (!layout) throw new Error("course_sections.layout missing — apply migration 6 first.");
    layout.values = ["card", "accordion"];
    app.save(sections);
  },
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");
    const layout = sections.fields.getByName("layout");
    if (!layout) return;
    layout.values = ["card"];
    app.save(sections);
  }
);
