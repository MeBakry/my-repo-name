#!/bin/sh
set -e
npx prisma migrate deploy 2>/dev/null || true
node src/scripts/seed-if-empty.js 2>/dev/null || true
exec node src/index.js
