// One-off cleanup script — removes the 3 placeholder/mockup blog_posts
// created by the OLD seed-blog-posts.mjs (predates the 12 real evergreen
// articles added by seed-blog-posts-free-materials.mjs on 2026-09-20).
//
// Why: a /debug-mantra pass found these 3 mockup posts still live on
// /blog alongside the 12 real articles, causing genuine duplicate cover
// images (classroom.jpg, entrance-exam-m1.jpg each used twice) AND
// topically overlapping content (a mockup "grammar summary p4-6" article
// sitting next to the real basic-6-tenses-summary-primary +
// vocab-p4-6-onet-m1-entrance; a mockup "m1 EP entrance checklist" next to
// the real vocab-p4-6-onet-m1-entrance + m1-gifted-science-entrance-math-tips).
// Siraphob confirmed 2026-09-20: "มันเป็น mockup ที่มี 3 บทความแรก" — these
// were scaffolding/placeholder content (see the comments in
// web/src/pages/blog/_indexpreviewtemp.astro and _preview.astro: "can be
// screenshotted before real blog_posts data exists in PocketBase") and are
// safe to delete now that real content covers the same ground.
//
// Confirmed no other file references these 3 slugs by name (only the
// generic blog/[slug].astro + blog/index.astro dynamic lookups, which read
// whatever's live in PocketBase) — safe to delete outright.
//
// Following this repo's standing rule (see cleanup-services.mjs): back up
// the full record to a JSON file BEFORE deleting, so nothing sellable/
// reusable is lost without a paper trail.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node cleanup-mockup-blog-posts.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

const SLUGS_TO_DELETE = [
  "grammar-summary-p4-6-before-m1-exam",
  "insect-pinning-workshop-what-to-expect",
  "prepare-for-m1-entrance-exam-checklist",
];

async function authAdmin() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`admin auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

async function findOne(token, collection, filter) {
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`,
    { headers: { Authorization: token } }
  );
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.items[0] || null;
}

async function removeRecord(token, collection, id) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`delete ${collection}/${id} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const backup = [];
  for (const slug of SLUGS_TO_DELETE) {
    const post = await findOne(token, "blog_posts", `slug="${slug}"`);
    if (!post) {
      console.log(`  (skip) "${slug}" — not found, already gone`);
      continue;
    }
    backup.push(post);
  }

  if (backup.length === 0) {
    console.log("Nothing to delete — all 3 slugs are already gone.");
    return;
  }

  const fs = await import("node:fs");
  const backupPath = `deleted-mockup-blog-posts-${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backed up ${backup.length} record(s) to ${backupPath}`);

  for (const post of backup) {
    await removeRecord(token, "blog_posts", post.id);
    console.log(`  - deleted "${post.title}" (slug "${post.slug}")`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
