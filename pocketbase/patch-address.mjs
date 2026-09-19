// One-off, IDEMPOTENT patch — corrects site_settings.address to the real
// street address, Google Maps Place ID 0x30e28f28749cb20f:0x15d61fc70cfafcc6
// ("English Mania by KruYam"). Fixed the house number/soi 2026-09-19 vs. what
// was seeded 2026-08-11 (scraped from the old site, never cross-checked):
// 61/578 ซอย 8, not 62/35 ซอย 9.
//
// ตำบล note (2026-09-19, same day): briefly "corrected" to บางรักพัฒนา based
// on the locality Google auto-filled on Siraphob's own Business Profile
// listing, then reverted — Siraphob confirmed directly that Google's own
// locality/boundary data is wrong for this address ("เหมือนใน google มันจะผิด")
// and the real, registered ตำบล is เสาธงหิน. Trust his direct statement over
// any Google-auto-filled field here.
//
// Embed URL: Google Maps' own official "Share > Embed a map" iframe src for
// this exact Place ID (Siraphob pasted it directly from Google Maps) — an
// earlier version of this script built the embed from `?q=<lat>,<lng>`
// instead, which Siraphob said rendered wrong; this `/maps/embed?pb=...`
// form is what Google itself generates for this listing, so use it verbatim.
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
const NEW_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4175.883763437158!2d100.4055284!3d13.8819899!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e28f28749cb20f%3A0x15d61fc70cfafcc6!2sEnglish%20Mania%20by%20KruYam!5e1!3m2!1sen!2sth!4v1789803994730!5m2!1sen!2sth";

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
