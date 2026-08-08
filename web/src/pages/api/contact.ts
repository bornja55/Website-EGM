// Handles the contact form: (1) writes to PocketBase `contact_submissions`,
// (2) best-effort mirrors to a Google Sheet as a human-readable backup log,
// (3) best-effort sends a notification email via Gmail API.
// Sheets/Gmail are optional — contact form must still work if those env vars
// aren't configured yet (fail open, log a warning, don't block the PB write).

import type { APIRoute } from "astro";

const PB_URL = import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const pbRes = await fetch(`${PB_URL}/api/collections/contact_submissions/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!pbRes.ok) {
    return new Response(JSON.stringify({ error: "pb_write_failed" }), { status: 502 });
  }

  // Fire-and-forget: Sheets + Gmail. TODO once GOOGLE_SERVICE_ACCOUNT_JSON is set up.
  // appendToGoogleSheet(body).catch((e) => console.error("sheets sync failed", e));
  // sendNotificationEmail(body).catch((e) => console.error("gmail send failed", e));

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
