/// <reference path="../pb_data/types.d.ts" />

// Adds `summary_note` to courses, promotions and workshops — one short line of
// footnote text rendered directly under the summary stat row at the top of the
// เนื้อหา tab (apple.com puts its conditions/asterisk copy in exactly that
// position, under the spec row it qualifies).
//
// Why this field exists: deleting the old "รูปแบบการเรียน" story section moved
// day/time/price into the stat row, but a few items said MORE than the stat row
// can hold — "หยุด/ลาไม่ตัดชั่วโมง ลงชดเชยได้ภายในเดือน" on the 990 promotion,
// for instance. That copy is a real condition of the sale and had nowhere to
// live. A stat cell can't hold a sentence, and a whole story section for one
// line was what we just removed.
//
// Deliberately a plain `text`, not an `editor`: this is one line under a stat
// row. If something needs paragraphs and formatting it is a story section, not
// a footnote — keeping the field type narrow is what stops it becoming a second
// description field.
//
// Optional and empty everywhere on creation, so nothing changes until filled in.

migrate(
  (app) => {
    for (const name of ["courses", "promotions", "workshops"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.add(new Field({ name: "summary_note", type: "text" }));
      app.save(collection);
    }
  },
  (app) => {
    for (const name of ["courses", "promotions", "workshops"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.removeByName("summary_note");
      app.save(collection);
    }
  }
);
