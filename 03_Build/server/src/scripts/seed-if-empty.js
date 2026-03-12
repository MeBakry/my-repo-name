#!/usr/bin/env node
/**
 * If the database has no users, run the full seed so login works.
 * Used by Docker entrypoint so first-time run gets shereen/elsayad without manual seed.
 */
import { spawnSync } from "child_process";
import prisma from "../lib/prisma.js";

async function main() {
  const count = await prisma.user.count().catch(() => 0);
  await prisma.$disconnect();
  if (count > 0) return;
  console.log("[seed-if-empty] No users in DB, running seed...");
  const r = spawnSync("node", ["src/data/seed/index.js"], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (r.status !== 0) {
    process.exitCode = r.status || 1;
  }
}

main();
