/// <reference path="../pb_data/types.d.ts" />

// New collection: real tutor roster, sourced from profile graphics found in
// OneDrive/English Mania Ball/Web/ติวเตอร์/ (9 real tutors incl. the founder).
// Not part of the original 8-page plan — added 2026-08-11 after the user
// pointed at that folder and confirmed building a team page from it.

migrate((app) => {
  const editorsAuthRule =
    "@request.auth.id != '' && @request.auth.collectionName = 'editors'";
  const timestampFields = [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];

  const tutors = new Collection({
    type: "base",
    name: "tutors",
    listRule: "",
    viewRule: "",
    createRule: editorsAuthRule,
    updateRule: editorsAuthRule,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "photo", type: "text" }, // path under web/public/images/tutors/
      { name: "education", type: "text" },
      { name: "credentials", type: "editor" }, // bullet list, real quals/experience
      { name: "subjects", type: "text" },
      { name: "sort_order", type: "number" },
      ...timestampFields,
    ],
  });
  app.save(tutors);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("tutors")); } catch (e) {}
});
