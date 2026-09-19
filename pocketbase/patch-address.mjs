// One-off, IDEMPOTENT patch — corrects site_settings.address to the real
// street address Siraphob gave directly (2026-09-19). The address seeded on
// 2026-08-11 was scraped from the old site's /contact page and had the wrong
// house number/soi (61/578 ซอย 8, not 62/35 ซอย 9) — same general area
// (ตำบลเสาธงหิน, บางใหญ่, นนทบุรี 11140), same Google Maps Place ID
// (0x30e28f28749cb20f:0x15d61fc70cfafcc6 — "English Mania by KruYam"),
// confirmed against his fresher Maps share link
// (https://maps.app.goo.gl/m3oHomg381jPQorRA).
//
// Also regenerates google_maps_embed_url from the corrected address, same
// key-less `?q=<address>&output=embed` pattern seed.mjs already uses.
//
// Safe to re-run: does nothing once address already matches NEW_ADDRESS.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-address.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const NEW_ADDRESS = "61/578 บางใหญ่ซิตี้ซอย 8, ตำบลเสาธงหิน, อำเภอบางใหญ่, นนทบุรี 11140";
const NEW_EMBED_URL = "https://www.google.com/maps?q=" + encodeURIComponent(NEW_ADDRESS) + "&output=embed";

async function authAdmin() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`admin auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const listRes = await fetch(`${PB_URL}/api/collections/site_settings/records?perPage=1`, {
    headers: { Authorization: token },
  });
  if (!listRes.ok) throw new Error(`list site_settings failed: ${listRes.status} ${await listRes.text()}`);
  const [settings] = (await listRes.json()).items;
  if (!settings) {
    console.error("no site_settings record found - nothing to patch.");
    process.exit(1);
  }

  if (settings.address === NEW_ADDRESS) {
    console.log(`(address already "${NEW_ADDRESS}", nothing to do)`);
    return;
  }

  console.log(`Old address: "${settings.address}"`);
  console.log(`New address: "${NEW_ADDRESS}"`);

  const res = await fetch(`${PB_URL}/api/collections/site_settings/records/${settings.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ address: NEW_ADDRESS, google_maps_embed_url: NEW_EMBED_URL }),
  });
  if (!res.ok) throw new Error(`patch failed: ${res.status} ${await res.text()}`);

  console.log("Done. Reload /contact and the homepage map section to confirm the corrected address/pin.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
