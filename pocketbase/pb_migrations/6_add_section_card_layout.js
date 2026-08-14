/// <reference path="../pb_data/types.d.ts" />

// Adds the apple.com "iPhone essentials." two-card layout to course_sections.
//
// Reference: apple.com's product pages regularly break a section out of the
// full-width story rhythm into a row of 2 equal cards on a light-grey tile —
// big section heading above, each card carrying its own short title, body,
// and a photo flush to the card's bottom edge.
//
// Modelled as a per-record FLAG, not a new collection: a "card" is still just
// a course_section (heading/body/image/sort_order all mean the same thing),
// it only renders differently. ProductTabs.astro groups CONSECUTIVE records
// with layout="card" into one grid, so a 2-card row is two records sitting
// next to each other in sort_order — no parent/child relation needed, and
// 3-card or 1-card rows come for free if ever wanted.
//
// Both fields are optional and empty on every existing record, so this
// migration changes nothing visually until a record opts in. Applies to
// courses, promotions AND workshops (course_sections is shared by all three).
//
// Schema only — no data is touched here. See
// pocketbase/patch-native-speaker-learn-cards.mjs for the native-speaker
// mockup data.

migrate(
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");

    // Single-value select rather than bool: leaves room for future layouts
    // (e.g. "wide", "quote") without another migration, and an empty value
    // reads as "the default full-width layout" in the Admin UI.
    sections.fields.add(
      new Field({ name: "layout", type: "select", values: ["card"], maxSelect: 1 })
    );

    // Big heading rendered ABOVE the card row (apple.com's "iPhone
    // essentials."). Set it on the FIRST card of a run; ignored on the rest.
    // Separate from `heading` because in this layout `heading` is the card's
    // own small title, and the group needs a name too.
    sections.fields.add(new Field({ name: "group_heading", type: "text" }));

    app.save(sections);
  },
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");
    sections.fields.removeByName("layout");
    sections.fields.removeByName("group_heading");
    app.save(sections);
  }
);
