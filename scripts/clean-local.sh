#!/usr/bin/env bash
# Clean local environment from previous/old app configuration.
# Use this to reset before using Docker-only or a fresh local install.
#
# Usage:
#   ./scripts/clean-local.sh         # Containers + volumes + node_modules
#   ./scripts/clean-local.sh --env   # Also remove .env files (reconfigure from .env.example)

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "Stopping Docker containers and removing volumes..."
docker compose down -v 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true

echo "Removing local node_modules (so install happens in container or fresh npm install)..."
rm -rf "$ROOT/03_Build/server/node_modules"
rm -rf "$ROOT/03_Build/poc-pharma-risk/node_modules"

# Optional: remove any root-level node_modules from old monorepo layout
rm -rf "$ROOT/node_modules" 2>/dev/null || true

if [[ "${1:-}" == "--env" ]]; then
  echo "Removing .env files (copy from .env.example to reconfigure)..."
  rm -f "$ROOT/03_Build/server/.env"
  rm -f "$ROOT/03_Build/poc-pharma-risk/.env"
fi

echo "Done. Next: use Docker (docker compose up -d --build) or run npm run install:all for local dev."
