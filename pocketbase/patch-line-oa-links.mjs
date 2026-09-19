// One-off, IDEMPOTENT patch — replaces the placeholder LINE OA link
// ("https://lin.ee/REPLACE_WITH_SANDBOX_OA") with English Mania's real LINE
// Official Account link, everywhere it was seeded:
//   - site_settings.line_oa_url (drives every global "จองผ่าน LINE" button:
//     header, footer, homepage, /services, /course listing, /faq, /contact)
//   - the per-record `line_link` field on every courses / workshops /
//     promotions record (drives each detail page's own "จองผ่าน LINE" button —
//     these were seeded with the same placeholder by migrate-courses.mjs /
//     patch-course-updates.mjs / patch-format-tags-and-exam-courses.mjs)
//
// LINE OA link confirmed by Siraphob 2026-09-19: https://lin.ee/pnahe9i
// (LINE ID: @english_mania.th — he initially gave the ID, then corrected it
// to this actual short link on 2026-09-19, "ฉันส่งให้ผิด").
//
// Safe to re-run: only touches records that still equal the old placeholder
// value, so a second run is a no-op.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-line-oa-links.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const OLD_LINK = "https://lin.ee/REPLACE_WITH_SANDBOX_OA";
const NEW_LINK = "https://lin.ee/pnahe9i"; // LINE ID: @english_mania.th

async function authAdmin() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`admin auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

async function listAll(token, collection, filter) {
  const qs = filter ? `&filter=${encodeURIComponent(filter)}` : "";
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=200${qs}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).items;
}

async function patchRecord(token, collection, id, data) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`patch ${collection}/${id} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  console.log("Patching site_settings.line_oa_url...");
  const [settings] = await listAll(token, "site_settings");
  if (!settings) {
    console.error("  ! no site_settings record found - nothing to patch there.");
  } else if (settings.line_oa_url !== OLD_LINK) {
    console.log(`  (already "${settings.line_oa_url}", leaving as-is)`);
  } else {
    await patchRecord(token, "site_settings", settings.id, { line_oa_url: NEW_LINK });
    console.log(`  - updated to "${NEW_LINK}"`);
  }

  for (const collection of ["courses", "workshops", "promotions"]) {
    console.log(`Patching ${collection}.line_link...`);
    const records = await listAll(token, collection, `line_link="${OLD_LINK}"`);
    if (records.length === 0) {
      console.log("  (none still on the placeholder)");
      continue;
    }
    for (const r of records) {
      await patchRecord(token, collection, r.id, { line_link: NEW_LINK });
      console.log(`  - ${r.title || r.id}: updated`);
    }
  }

  console.log("\nDone. Reload the site and click a few \"จองผ่าน LINE\" buttons (header, homepage, " +
    "/services, a course/workshop/promotion detail page) to confirm they open the real LINE OA.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
