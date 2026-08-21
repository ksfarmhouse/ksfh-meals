// Centralized environment-variable validation.
//
// Every required env var is parsed once at module load and exposed through
// the `env` object below. Code elsewhere should import from here instead of
// reaching into `process.env` directly — that way a missing or malformed
// value blows up at startup with a clear message, rather than surfacing as
// a confusing runtime error (Prisma "DATABASE_URL not found", session
// "SESSION_SECRET must be at least 32 chars", etc.).
//
// Optional vars (FILES_LAN_URL, FIND_ID_PASSWORD) get a sensible default, so
// adding one doesn't take the site down until it's set in Vercel.

import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  FILES_LAN_URL: z
    .string()
    .url()
    .optional()
    .default("http://192.168.1.153:8080/"),
  // Shared house password for /find-id. Defaulted so the page works without
  // any Vercel change; set FIND_ID_PASSWORD there to rotate it without a
  // code edit + redeploy.
  FIND_ID_PASSWORD: z.string().min(1).optional().default("ksfh1921"),
});

const parsed = EnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  FILES_LAN_URL: process.env.FILES_LAN_URL,
  FIND_ID_PASSWORD: process.env.FIND_ID_PASSWORD,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // Throwing here halts module load; in Next.js the error bubbles up to
  // the error.tsx boundary so the cause is visible.
  throw new Error(
    `Environment variable validation failed:\n${issues}\n\n` +
      `Check your .env (locally) or Vercel project's Environment Variables.`,
  );
}

export const env = parsed.data;
