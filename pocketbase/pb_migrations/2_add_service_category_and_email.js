/// <reference path="../pb_data/types.d.ts" />

// Adds fields discovered as real/needed after scraping the live old site
// (https://ballevrtgab.makeweb.co/) for real content:
//  - services.category: the real course catalog is grouped by subject
//    (ภาษาอังกฤษ / คณิตศาสตร์ / วิทยาศาสตร์ / อื่นๆ), unlike the original
//    4 generic delivery-mode rows this collection launched with.
//  - site_settings.email: the real contact email (englishmaniabkk@gmail.com)
//    was on the old site's /contact page but the site_settings collection
//    never had a field for it.
// Both optional/non-required so existing rows don't need a backfill.

migrate((app) => {
  const services = app.findCollectionByNameOrId("services");
  services.fields.add(new Field({ name: "category", type: "text" }));
  app.save(services);

  const siteSettings = app.findCollectionByNameOrId("site_settings");
  siteSettings.fields.add(new Field({ name: "email", type: "email" }));
  app.save(siteSettings);
}, (app) => {
  const services = app.findCollectionByNameOrId("services");
  services.fields.removeByName("category");
  app.save(services);

  const siteSettings = app.findCollectionByNameOrId("site_settings");
  siteSettings.fields.removeByName("email");
  app.save(siteSettings);
});
