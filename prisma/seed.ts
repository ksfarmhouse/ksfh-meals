// Idempotent seed: creates the singleton Menu row if it does not exist.
// Never overwrites existing data. Safe to re-run.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.menu.findUnique({ where: { id: 1 } });
  if (existing) {
    console.log("[seed] Menu row already exists, leaving it alone.");
    return;
  }
  await prisma.menu.create({
    data: {
      id: 1,
      lunch: Array(7).fill("TBD"),
      dinner: Array(5).fill("TBD"),
    },
  });
  console.log("[seed] Created placeholder Menu row.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
