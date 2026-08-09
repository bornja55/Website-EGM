// Handles the contact form: (1) writes to PocketBase `contact_submissions`,
// (2) best-effort mirrors to a Google Sheet as a human-readable backup log,
// (3) best-effort sends a notification email via Gmail API.
// Sheets/Gmail are optional — contact form must still work if those env vars
// aren't configured yet (fail open, log a warning, don't block the PB write).

import type { APIRoute } from "astro";

const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090"; // see note in lib/pocketbase.ts
// Server-only secret — process.env (not import.meta.env), same reasoning as
// POCKETBASE_URL above: this must be read at request time, not baked in
// at Docker build time.
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token: string | undefined, ip: string | undefined) {
  if (!TURNSTILE_SECRET_KEY) {
    // Not configured yet (e.g. local dev before you've created a Turnstile
    // widget) — fail open so the form isn't dead in the water, but this
    // means spam protection is OFF until the secret is set. Don't ship to
    // prod without it.
    console.warn("TURNSTILE_SECRET_KEY not set — skipping Turnstile verification");
    return true;
  }
  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json();

  const turnstileToken = body["cf-turnstile-response"];
  const humanVerified = await verifyTurnstile(turnstileToken, clientAddress).catch((e) => {
    console.error("turnstile verify request failed", e);
    return false;
  });
  if (!humanVerified) {
    return new Response(JSON.stringify({ error: "spam_check_failed" }), { status: 400 });
  }
  delete body["cf-turnstile-response"]; // don't store the token itself in PocketBase

  // PDPA — the checkbox being `required` in the HTML is a UX nicety, not
  // enforcement; a direct POST to this endpoint could skip it entirely.
  // Reject here too so consent_given=true is actually guaranteed, not just
  // requested. (PocketBase's own `required` bool validation would also
  // reject consent_given: false, but failing fast here gives a clearer
  // error and avoids a round-trip for something we can check locally.)
  if (body.consent_given !== true) {
    return new Response(JSON.stringify({ error: "consent_required" }), { status: 400 });
  }

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
