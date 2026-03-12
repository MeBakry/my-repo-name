#!/bin/sh
set -e
# Generate Prisma client (in case schema changed); then start dev server
npx prisma generate
exec npm run dev
