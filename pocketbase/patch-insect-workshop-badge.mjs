// One-off, IDEMPOTENT patch — sets `badge` on "Insect Pinning Workshop" so
// it renders as the wide 2:1 tile (with the "+" quick-view button) on
// /workshops, per Siraphob's request.
//
// Needs migration 10 (pb_migrations/10_add_badge_field.js) applied first —
// that's what adds the `badge` field to the workshops collection. Run that
// migration before this script if it hasn't run yet (PocketBase restarts
// and applies pb_migrations automatically, or run it manually per your
// usual workflow).
//
// Safe to re-run: does nothing once the badge is already set to this text.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node patch-insect-workshop-badge.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const SLUG = "insect-pinning-workshop";
const BADGE_TEXT = "แนะนำ"; // change this line to whatever label you want on the tile

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

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const [workshop] = await listAll(token, "workshops", `slug="${SLUG}"`);
  if (!workshop) {
    console.error(`workshops/"${SLUG}" not found.`);
    process.exit(1);
  }
  if (workshop.badge === BADGE_TEXT) {
    console.log(`  (workshop "${workshop.title}" already has badge="${BADGE_TEXT}", nothing to do)`);
    return;
  }

  const res = await fetch(`${PB_URL}/api/collections/workshops/records/${workshop.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ badge: BADGE_TEXT }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 400 && body.includes("badge")) {
      console.error(
        "PocketBase rejected the `badge` field — migration 10_add_badge_field.js probably hasn't run yet. " +
          "Apply that migration first, then re-run this script."
      );
    }
    throw new Error(`patch failed: ${res.status} ${body}`);
  }

  console.log(`  - set badge="${BADGE_TEXT}" on "${workshop.title}"`);
  console.log("\nDone. Reload /workshops — it should now render as the wide 2:1 tile with a \"+\" button.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
