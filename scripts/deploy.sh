#!/usr/bin/env bash
set -euo pipefail

# WardCheck deployment script
# Usage: ./scripts/deploy.sh [--seed-admin]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
error() { echo -e "${RED}[deploy]${NC} $*" >&2; exit 1; }

# ─── Preflight checks ──────────────────────────────────────
for cmd in node npm npx; do
  command -v "$cmd" >/dev/null 2>&1 || error "Required command '$cmd' not found."
done

if [ ! -f "$BACKEND_DIR/.env" ]; then
  warn ".env not found — copying from .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  warn "Edit $BACKEND_DIR/.env before continuing."
  exit 1
fi

# ─── Backend setup ─────────────────────────────────────────
log "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci

log "Generating Prisma client..."
npx prisma generate

log "Running database migrations..."
npx prisma migrate deploy

if [ "${1:-}" = "--seed-admin" ]; then
  log "Seeding initial admin..."
  node scripts/seed-admin.mjs
fi

log "Building backend..."
npm run build

# ─── Frontend build ────────────────────────────────────────
log "Installing frontend dependencies..."
cd "$ROOT_DIR"
npm install

log "Building frontend..."
npm run build

log "Deployment complete!"
echo ""
echo "  Start backend:   cd backend && npm start"
echo "  Start dev stack: docker compose up --build"
echo "  Seed admin:      cd backend && npm run seed:admin"
