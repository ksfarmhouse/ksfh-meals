// Prisma client singleton.
//
// In Next.js dev mode, hot-module reload re-imports this file on every change.
// Without the `global.__prisma` cache below, each reload would spin up a fresh
// PrismaClient and leak a connection — after a dozen edits you'd exhaust
// Supabase's pool. Stashing the instance on `global` keeps one client across
// reloads in development. In production we just construct it once.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
