// Recovery script for a fresh / restored Supabase project.
//
// What it does:
//   1. Tries to count rows in the Member table.
//   2. If the table is missing OR has zero rows, runs `prisma db push` to
//      create the schema, then `prisma db seed` to insert the placeholder
//      Menu row.
//   3. If the table already has members, REFUSES to run unless --force is
//      passed. This prevents an accidental overwrite of a live database.
//
// Usage:
//   npm run db:recover                # safe: aborts if Member rows exist
//   npm run db:recover -- --force     # destructive override; use with care

import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const FORCE = process.argv.includes("--force");

async function readMemberCount(): Promise<number | null> {
  const prisma = new PrismaClient();
  try {
    return await prisma.member.count();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // P2021 = table does not exist; treat as a fresh database.
    if (/P2021|does not exist|relation .* does not exist/i.test(msg)) {
      return null;
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("[recover] checking database state...");
  const count = await readMemberCount();

  if (count !== null && count > 0 && !FORCE) {
    console.error(
      `\n[recover] ABORT: database already contains ${count} member(s).\n` +
        `db:recover is destructive (it runs 'prisma db push --accept-data-loss').\n` +
        `If you really intend to overwrite this database, re-run with --force:\n` +
        `  npm run db:recover -- --force\n`,
    );
    process.exit(1);
  }

  if (count === null) {
    console.log("[recover] no Member table found — treating as fresh project.");
  } else if (count === 0) {
    console.log("[recover] Member table is empty — safe to proceed.");
  } else {
    console.log(`[recover] --force passed; overwriting ${count} member(s).`);
  }

  console.log("[recover] running 'prisma db push'...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

  console.log("[recover] running 'prisma db seed'...");
  execSync("npx prisma db seed", { stdio: "inherit" });

  console.log("\n[recover] done. Schema is in place and Menu placeholder is seeded.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
