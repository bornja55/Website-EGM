#!/usr/bin/env bash
#
# provision-gcp-vm.sh — one-shot wizard to stand up the GCP e2-micro VM this
# project deploys to (see CLAUDE.md "Deployment" + README's Roadmap/Secrets
# sections). Generated so gcloud commands don't get mistyped by hand.
#
# Run this on YOUR OWN machine (needs `gcloud`, logged in, with access to the
# GCP project you want to use) — it can't be run from the sandbox, which has
# no gcloud credentials.
#
# What it does, in order:
#   1. Checks `gcloud` is installed and you're logged in.
#   2. Confirms/sets the GCP project and enables the Compute Engine API.
#   3. Generates a DEDICATED ssh keypair for GitHub Actions to deploy with
#      (never reuses your personal key — see CLAUDE.md's explicit decision
#      on this).
#   4. Creates the e2-micro VM in an Always-Free-eligible region, with a
#      startup-script that installs Docker + the Compose plugin and creates
#      the bind-mount directories docker-compose.yml/backup-to-drive.sh
#      expect (/data/englishmania/pb_data, /opt/englishmania).
#   5. Opens firewall port 80 only (never 443 — Cloudflare terminates TLS,
#      per CLAUDE.md's TLS decision) to a tag scoped to just this VM.
#   6. Prints the exact values for the 3 GitHub Actions secrets that come
#      from this step (GCP_SSH_HOST / GCP_SSH_USER / GCP_SSH_KEY) — see
#      README.md's secrets table for the rest, which this script does NOT
#      touch (Turnstile, PocketBase superuser, Google service account —
#      none of that is GCP-VM-related).
#
# Safe to re-run: every gcloud step checks whether its resource already
# exists first and skips creation if so, so this can also be used later just
# to reprint the connection info.
#
# Usage:
#   ./scripts/provision-gcp-vm.sh                 # interactive prompts
#   ./scripts/provision-gcp-vm.sh --dry-run        # print gcloud commands, run nothing
#   PROJECT_ID=my-proj ZONE=us-central1-a ./scripts/provision-gcp-vm.sh --yes
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Config (env var > flag > prompt > default)
# ---------------------------------------------------------------------------
VM_NAME="${VM_NAME:-englishmania-web}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DISK_SIZE_GB="${DISK_SIZE_GB:-30}"        # Always Free cap: 30GB-months pd-standard
DISK_TYPE="pd-standard"                    # Always Free only covers standard (HDD), not SSD/balanced
MACHINE_TYPE="e2-micro"                    # the only machine type Always Free covers
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"
FIREWALL_TAG="englishmania-web"
KEY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/secrets"
KEY_PATH="${KEY_DIR}/gcp-deploy-key"
DRY_RUN=0
ASSUME_YES=0

# Always Free e2-micro is ONLY free in these three regions. Any other region
# bills from the first minute — see
# https://cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits
FREE_REGIONS=("us-west1" "us-east1" "us-central1")

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --yes|-y) ASSUME_YES=1 ;;
    --help|-h)
      grep '^#' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

run() {
  # Every gcloud/ssh-keygen mutation goes through here so --dry-run has a
  # single choke point instead of an if/else on every call site.
  echo "+ $*"
  if [ "$DRY_RUN" -eq 0 ]; then
    "$@"
  fi
}

to_native_path() {
  # Convert a POSIX-style temp-file path (as `mktemp` produces under Git
  # Bash/MSYS2 on Windows, e.g. /tmp/tmp.XXXX) to a real Windows path
  # before handing it to gcloud.
  #
  # Why this exists: on Windows, gcloud is a native (non-MSYS) program, so
  # Git Bash's runtime auto-converts /-style arguments to Windows paths
  # when calling it. That conversion is a heuristic and it is NOT reliable
  # for two paths packed into one argument the way --metadata-from-file
  # requires (`key1=/tmp/a,key2=/tmp/b`) — in practice it converted the
  # first path and silently left the second one as-is, so gcloud (which
  # has no concept of /tmp) failed with "No such file or directory" on the
  # second file. Converting both paths ourselves via `cygpath -w` sidesteps
  # that heuristic entirely instead of hoping it improves.
  #
  # On Linux/macOS there's no cygpath and none of this applies — the path
  # is returned unchanged.
  local p="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$p"
  else
    printf '%s' "$p"
  fi
}

echo "== English Mania — GCP e2-micro provisioning wizard =="
echo

# ---------------------------------------------------------------------------
# 1. gcloud present + logged in
# ---------------------------------------------------------------------------
if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found." >&2
  echo "Install it first: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)"
if [ -z "$ACTIVE_ACCOUNT" ]; then
  echo "No active gcloud login found — opening browser login..."
  run gcloud auth login
else
  echo "gcloud logged in as: $ACTIVE_ACCOUNT"
fi
echo

# ---------------------------------------------------------------------------
# 2. Project
# ---------------------------------------------------------------------------
PROJECT_ID="${PROJECT_ID:-}"
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  read -rp "GCP project ID to use: " PROJECT_ID
fi
echo "Using project: $PROJECT_ID"
run gcloud config set project "$PROJECT_ID"

# A project with no billing account linked will fail VM creation — this is
# the single most common reason this script errors out on a fresh project.
# We can't safely auto-link a billing account (which one? scoped to what?),
# so just check and tell the user exactly where to go.
BILLING_ENABLED="$(gcloud beta billing projects describe "$PROJECT_ID" \
  --format='value(billingEnabled)' 2>/dev/null || echo "unknown")"
if [ "$BILLING_ENABLED" = "False" ]; then
  echo
  echo "WARNING: project '$PROJECT_ID' has no billing account linked yet."
  echo "  e2-micro is free under Always Free, but GCP still requires SOME"
  echo "  billing account attached to the project before it will create a VM."
  echo "  Link one first: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
  echo
  if [ "$ASSUME_YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ]; then
    read -rp "Continue anyway and let VM creation fail if it's still unlinked? [y/N] " ans
    [ "${ans,,}" = "y" ] || exit 1
  fi
fi

run gcloud services enable compute.googleapis.com --project="$PROJECT_ID"
echo

# ---------------------------------------------------------------------------
# 3. Zone (must be in a free-tier region)
# ---------------------------------------------------------------------------
ZONE="${ZONE:-us-central1-a}"
ZONE_REGION="${ZONE%-*}"
IS_FREE_REGION=0
for r in "${FREE_REGIONS[@]}"; do
  [ "$r" = "$ZONE_REGION" ] && IS_FREE_REGION=1
done
if [ "$IS_FREE_REGION" -eq 0 ]; then
  echo "WARNING: zone '$ZONE' is not in a free-tier region (${FREE_REGIONS[*]})."
  echo "  e2-micro will still work there, it just won't be Always-Free — you'll be billed."
  if [ "$ASSUME_YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ]; then
    read -rp "Continue with '$ZONE' anyway? [y/N] " ans
    [ "${ans,,}" = "y" ] || exit 1
  fi
fi
echo "Using zone: $ZONE"
echo

# ---------------------------------------------------------------------------
# 4. Dedicated deploy SSH keypair
# ---------------------------------------------------------------------------
mkdir -p "$KEY_DIR"
if [ ! -f "${KEY_PATH}.gitignore-check" ]; then
  # secrets/ must never get committed — write/verify the .gitignore entry
  # rather than assuming the user remembers to add it.
  GITROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  if [ -f "$GITROOT/.gitignore" ] && ! grep -qxF 'secrets/' "$GITROOT/.gitignore"; then
    echo "secrets/" >> "$GITROOT/.gitignore"
    echo "Added 'secrets/' to .gitignore."
  fi
  touch "${KEY_PATH}.gitignore-check"
fi

if [ -f "$KEY_PATH" ]; then
  echo "Deploy SSH keypair already exists at $KEY_PATH — reusing it."
else
  echo "Generating a new dedicated deploy keypair (NOT your personal SSH key)..."
  run ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "github-actions-deploy@englishmania"
fi
echo

# ---------------------------------------------------------------------------
# 5. Firewall rule — port 80 only, scoped to this VM's tag
# ---------------------------------------------------------------------------
if gcloud compute firewall-rules describe allow-http-englishmania \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Firewall rule 'allow-http-englishmania' already exists — skipping."
else
  run gcloud compute firewall-rules create allow-http-englishmania \
    --project="$PROJECT_ID" \
    --network=default \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:80 \
    --target-tags="$FIREWALL_TAG" \
    --description="English Mania web (Cloudflare Proxy origin, HTTP only — TLS terminates at Cloudflare, port 443 is never opened here)"
fi
echo

# ---------------------------------------------------------------------------
# 6. The VM itself
# ---------------------------------------------------------------------------
if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "VM '$VM_NAME' already exists in $ZONE — skipping creation, just reading its IP."
else
  STARTUP_SCRIPT="$(mktemp)"
  cat > "$STARTUP_SCRIPT" <<'STARTUP'
#!/bin/bash
set -e
# Runs once on first boot. Installs Docker + Compose plugin (official repo,
# not the distro's older docker.io package) and creates the directories
# docker-compose.yml's bind mounts + scripts/backup-to-drive.sh expect.
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

mkdir -p /data/englishmania/pb_data /opt/englishmania

# The deploy user is created by GCE's guest agent from the ssh-keys metadata
# below, but timing between that and this script isn't guaranteed — wait for
# it rather than failing the boot if we win the race.
for i in $(seq 1 30); do
  id deploy >/dev/null 2>&1 && break
  sleep 2
done
usermod -aG docker deploy || true
chown -R deploy:deploy /data/englishmania /opt/englishmania
STARTUP

  if [ -f "${KEY_PATH}.pub" ]; then
    PUBKEY_CONTENT="$(cat "${KEY_PATH}.pub")"
  else
    # --dry-run with no prior real run: ssh-keygen above was only echoed, not
    # executed, so there's no real key yet. A placeholder keeps the preview
    # command printable instead of crashing the whole dry run.
    PUBKEY_CONTENT="<dry-run-placeholder-pubkey>"
  fi
  SSH_KEYS_FILE="$(mktemp)"
  echo "${DEPLOY_USER}:${PUBKEY_CONTENT}" > "$SSH_KEYS_FILE"

  # Convert both temp-file paths to native form before building the gcloud
  # argument — see to_native_path()'s comment for why. On Linux/macOS these
  # are no-ops (same paths back).
  STARTUP_SCRIPT_ARG="$(to_native_path "$STARTUP_SCRIPT")"
  SSH_KEYS_FILE_ARG="$(to_native_path "$SSH_KEYS_FILE")"

  # NOTE: deliberately NOT setting MSYS2_ARG_CONV_EXCL here (an earlier
  # version of this script did, to stop Git Bash from touching the
  # already-converted paths above). That broke things worse: it disables
  # path conversion for the WHOLE command line, including how Git Bash
  # invokes `gcloud.cmd` itself — gcloud.cmd's own bootstrap resolves its
  # install directory from how it was invoked, and with conversion off it
  # got called with a raw POSIX path (`/c/Program Files (x86)/...`), which
  # cmd.exe then misread as relative to the current drive, producing a
  # bogus path like `D:\c\Program Files (x86)\...\gcloud.py` and a
  # "can't open file" crash. It's not needed anyway: `to_native_path()`
  # above already hands gcloud real backslash/drive-letter Windows paths,
  # and Git Bash's auto-conversion only ever matches forward-slash-style
  # POSIX paths, so it has nothing to "helpfully" re-mangle here.
  run gcloud compute instances create "$VM_NAME" \
    --project="$PROJECT_ID" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --boot-disk-size="${DISK_SIZE_GB}GB" \
    --boot-disk-type="$DISK_TYPE" \
    --tags="$FIREWALL_TAG" \
    --metadata-from-file startup-script="$STARTUP_SCRIPT_ARG",ssh-keys="$SSH_KEYS_FILE_ARG"

  rm -f "$STARTUP_SCRIPT" "$SSH_KEYS_FILE"

  echo "VM created. Waiting ~60s for the startup-script (Docker install) to finish..."
  [ "$DRY_RUN" -eq 0 ] && sleep 60
fi
echo

# ---------------------------------------------------------------------------
# 7. Summary
# ---------------------------------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  echo "== Dry run — no changes made. Re-run without --dry-run to actually provision. =="
  exit 0
fi

EXTERNAL_IP="$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"

echo "======================================================================"
echo " Done. Paste these into GitHub → Settings → Secrets and variables →"
echo " Actions (see README.md's secrets table for the rest — Turnstile,"
echo " PocketBase superuser, etc. — this script doesn't touch those):"
echo "======================================================================"
echo
echo "GCP_SSH_HOST = $EXTERNAL_IP"
echo "GCP_SSH_USER = $DEPLOY_USER"
echo "GCP_SSH_KEY  = (contents of $KEY_PATH — printed below, keep it secret)"
echo
echo "--- $KEY_PATH ---"
cat "$KEY_PATH"
echo "--- end ---"
echo
echo "Next steps:"
echo "  1. Add the 3 secrets above (plus the rest of README's table) to GitHub."
echo "  2. Push to main — GitHub Actions will SSH in and 'docker compose up -d --build'."
echo "  3. Once it's serving, point Cloudflare DNS at $EXTERNAL_IP and set SSL/TLS"
echo "     mode to match what the VM actually serves: this VM only ever serves"
echo "     plain HTTP on port 80 (no TLS, port 443 is never opened) — that's"
echo "     Cloudflare's 'Flexible' SSL mode, not 'Full'/'Full (strict)' (those"
echo "     require the origin itself to answer HTTPS, which this VM does not)."
echo "  4. Delete '$KEY_PATH' from your machine once it's safely in GitHub"
echo "     Secrets, or at minimum keep the secrets/ directory out of git"
echo "     (already added to .gitignore by this script)."
echo "======================================================================"
