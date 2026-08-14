/// <reference path="../pb_data/types.d.ts" />

// Adds the apple.com "Our values lead the way." text-card row to
// course_sections — a section heading over a row of equal cards that carry
// ONLY a short title and a paragraph, no image.
//
// Distinct from migration 6's "card" (which is built around a photo filling
// the tile's lower half) because the two behave differently when there are
// three of them: photo tiles need a big media slot and work in pairs, text
// cards are compact and read best 3-up. Sharing one flag would have meant
// branching on "does this record happen to have an image", which makes the
// rendering depend on an editor forgetting to attach a photo.
//
// Same grouping mechanism as before: consecutive records flagged
// layout="text-card" become one row, `group_heading` on the FIRST record names
// it, each record's `heading`/`body` are the card's title and copy. `image` is
// ignored for this layout.
//
// Only widens the `layout` select's allowed values — existing records are
// untouched.

migrate(
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");
    const layout = sections.fields.getByName("layout");
    if (!layout) throw new Error("course_sections.layout missing — apply migration 6 first.");
    layout.values = ["card", "accordion", "text-card"];
    app.save(sections);
  },
  (app) => {
    const sections = app.findCollectionByNameOrId("course_sections");
    const layout = sections.fields.getByName("layout");
    if (!layout) return;
    layout.values = ["card", "accordion"];
    app.save(sections);
  }
);
