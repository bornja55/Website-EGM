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
and the "Deployment" section of `CLAUDE.md` for the secrets you need to configure
in the repo settings (Settings → Secrets and variables → Actions).

## Status

Scaffolded by Claude + Siraphob, 2026-08-08. See `CLAUDE.md` for what's done vs.
still TODO.
