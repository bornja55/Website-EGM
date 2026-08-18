/// <reference path="../pb_data/types.d.ts" />

// Widens courses.tags with 2 groups of new values, decided with Siraphob over
// a long /grill-me session on the /services redesign (2026-08-16):
//
// รูปแบบ (format) gains "เรียนกลุ่ม", "online", "onsite" alongside the existing
// "ตัวต่อตัว". Every course gets exactly one of เรียนกลุ่ม/ตัวต่อตัว (never
// both) — the 5 ตัวต่อตัว-only courses (private-one-on-one, TGAT & A-Level,
// ภาษาญี่ปุ่น, ฟิสิกส์, + the new TOEIC/IELTS/TOEFL courses from this same
// session) get online+onsite too; the other 6 กลุ่ม courses are onsite only.
// Applied by a follow-up data script, not here — this migration is schema
// only, same pattern as every other migration in this project.
//
// ติวสอบ (exam) gains "TOEIC", "IELTS", "TOEFL" (3 new courses, one per exam
// — Siraphob explicitly rejected one combined course: bundling them under one
// 3,500 บาท price previously read as "ทั้งหมดในราคาเดียว" to customers, which
// was never true) and "ตะลุยสอบด่วนพิเศษ" (moved here from the `services`
// collection — it's sold to students on a real timetable, not a facilities/
// B2B service, so it belongs in `courses` like every other sellable class;
// see cleanup-services.mjs for the corresponding services-side removal).
//
// Only widens the `tags` select's allowed values + maxSelect — existing
// records keep whatever tags they already had, nothing changes visually
// until the follow-up data script runs.

migrate(
  (app) => {
    const courses = app.findCollectionByNameOrId("courses");
    const tags = courses.fields.getByName("tags");
    if (!tags) throw new Error("courses.tags missing — apply migration 4 first.");
    tags.values = [
      // รายวิชา
      "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาญี่ปุ่น",
      // ชั้นปี
      "อ.3", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
      "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
      // ติวสอบ
      "ติวสอบเข้า ม.1", "TGAT & A-Level", "TOEIC", "IELTS", "TOEFL", "ตะลุยสอบ ด่วนพิเศษ",
      // รูปแบบ
      "ตัวต่อตัว", "เรียนกลุ่ม", "online", "onsite",
    ];
    tags.maxSelect = tags.values.length;
    app.save(courses);
  },
  (app) => {
    const courses = app.findCollectionByNameOrId("courses");
    const tags = courses.fields.getByName("tags");
    if (!tags) return;
    tags.values = [
      "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาญี่ปุ่น",
      "อ.3", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
      "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
      "ติวสอบเข้า ม.1", "TGAT & A-Level",
      "ตัวต่อตัว",
    ];
    tags.maxSelect = tags.values.length;
    app.save(courses);
  }
);
