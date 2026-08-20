/// <reference path="../pb_data/types.d.ts" />

// Adds `badge` to courses AND workshops — promotions/workshops already carry
// an (auto-set, hardcoded) badge LABEL in the mixed catalog view
// (lib/catalog.ts: "โปรโมชั่น" / "Workshop"), but that's synthesized, not a
// real field, and a plain course has no badge at all. Siraphob wanted
// best-selling/"ต้องการเน้นให้เด่น" items to get a wider 2:1 tile in the
// course AND workshop bento grids (apple.com/us-edu/shop/smart-home/
// accessories reference) — that needs a real per-record field to opt into,
// since there's no existing signal (sales data, popularity) to derive it
// from automatically. Not added to promotions: those are already always
// badged/always-wide by existing design (buildCatalog already puts them
// first for the same "don't bury the time-limited offer" reason).
//
// Reused as BOTH the corner label text (e.g. "ขายดี", "แนะนำ") AND the
// wide-tile trigger in CourseGrid.astro / workshops/index.astro: any item
// with a truthy badge spans 2 columns instead of 1.
//
// Optional and empty on every existing row, so nothing changes until a
// course or workshop is explicitly flagged.

migrate(
  (app) => {
    for (const name of ["courses", "workshops"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.add(new Field({ name: "badge", type: "text" }));
      app.save(collection);
    }
  },
  (app) => {
    for (const name of ["courses", "workshops"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.removeByName("badge");
      app.save(collection);
    }
  }
);
