#!/bin/sh
set -e

echo "[start] resolving previous migration as rolled-back (idempotent)..."
npx prisma migrate resolve --schema prisma/schema.prisma --rolled-back 20260511_init || true

echo "[start] running prisma migrate deploy..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "[start] seeding database..."
npx tsx prisma/seed.ts || echo "[start] seed failed or already seeded; continuing"

echo "[start] launching server..."
exec node dist/index.js
