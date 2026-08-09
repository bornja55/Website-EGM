# English Mania — Website Rebuild (EGM)

Rebuild of https://englishmania.co.th (currently on MakeWebEasy, expiring 2026-11-08).

Astro frontend + PocketBase headless CMS, mirroring the architecture pattern used in
`empire-website`. Chosen to be "as lite as possible" — no separate DB server, single
Go binary for the backend, content edited directly via code/API (no non-dev CMS users).

For full architecture, content model, and deployment details, see [`CLAUDE.md`](./CLAUDE.md).

## Prerequisites

- Node.js >= 22.12 — check with `node --version`
- Docker + Docker Compose (for local parity with prod)

## Local dev

Two processes: PocketBase (API + CMS, port 8090) and the Astro dev server (port 4321).

### 1. PocketBase

```bash
cd pocketbase
# download the matching PocketBase binary (see https://pocketbase.io/docs) — gitignored
curl -sL -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.39.5/pocketbase_0.39.5_linux_amd64.zip
unzip -o pb.zip pocketbase && rm pb.zip && chmod +x ./pocketbase

cp .env.example .credentials
# edit .credentials with your own local passwords

./pocketbase serve --http=127.0.0.1:8090
```

First run only, in a second terminal:

```bash
cd pocketbase
source .credentials
./pocketbase superuser upsert "$SUPERUSER_EMAIL" "$SUPERUSER_PASS"
node seed.mjs
```

PocketBase admin UI: http://127.0.0.1:8090/_/

### 2. Astro web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:4321.

## Deployment

GitHub Actions builds on push to `main` and deploys to a GCP `e2-micro` VM
(Always Free tier) over SSH via `docker compose`. See `.github/workflows/deploy.yml`
and the "Deployment" section of `CLAUDE.md` for architecture details.

TLS: Cloudflare Proxy mode (Full) — Cloudflare terminates HTTPS, VM only serves
plain HTTP behind it. Spam protection on the contact form: Cloudflare Turnstile
(free, unlimited).

### GitHub Actions secrets checklist

Fill these in at `github.com/bornja55/Website-EGM` → Settings → Secrets and
variables → Actions → "New repository secret". Claude cannot fill these in —
see the "Instruction source boundary" / credential-handling rules if you're
wondering why.

| Secret | Where it comes from | Required? |
|---|---|---|
| `GCP_SSH_HOST` | External IP of the `e2-micro` VM (from the GCP setup wizard) | Yes |
| `GCP_SSH_USER` | The deploy user you created on the VM (wizard sets this up) | Yes |
| `GCP_SSH_KEY` | Private half of a dedicated deploy SSH keypair (don't reuse a personal key) | Yes |
| `SUPERUSER_EMAIL` | Pick one, e.g. `admin@englishmania.local` — used for PocketBase's first-boot superuser | Yes |
| `SUPERUSER_PASS` | A strong password you generate for that superuser | Yes |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare dashboard → Turnstile → create a widget for `englishmania.co.th` → "Site Key" | Yes |
| `TURNSTILE_SECRET_KEY` | Same Turnstile widget → "Secret Key" | Yes (spam protection is silently OFF without it) |
| `PUBLIC_POCKETBASE_URL` | `https://englishmania.co.th/pb` (or wherever you expose the PocketBase API publicly) | Yes |
| `GOOGLE_SHEETS_ID` | ID from the Google Sheet URL you want contact-form backups logged to | No — leave blank until Sheets sync is wired up |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | A GCP service account JSON key with Sheets + Gmail API access | No — same as above |
| `GMAIL_SENDER` | The Gmail address that sends contact-form notifications | No — same as above |

Even the "No" rows need the secret to *exist* (can be an empty string) — the
deploy workflow's `.env`-writing step will error on a totally missing secret
reference.

## Status

Scaffolded by Claude + Siraphob, 2026-08-08. Turnstile anti-spam + Cloudflare
TLS decisions added 2026-08-08 (second planning round). See `CLAUDE.md` for
what's done vs. still TODO.
