// Login + logout server actions.
//
// login(): compares the submitted password to process.env.ADMIN_PASSWORD,
// and on match sets the signed session cookie (see _lib/session.ts) and
// redirects to /admin.
// logout(): just deletes the cookie.

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, signSession } from "@/app/_lib/session";
import { env } from "@/app/_lib/env";

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type LoginState = { ok: false; error: string } | null;

// Rate-limit knobs. Every failed login sleeps for FAIL_DELAY_MS before
// returning, which alone reduces brute-force throughput from "thousands per
// second" to "one per second per Lambda".
//
// Additionally, an in-memory counter tracks failed attempts per Lambda
// instance: once a single instance sees LOCKOUT_THRESHOLD failures within
// LOCKOUT_WINDOW_MS, it stops accepting login attempts for LOCKOUT_MS and
// just returns "Too many attempts". Best-effort — Vercel may route the next
// attempt to a different Lambda instance with its own counter, so this
// isn't a hard ceiling, just extra friction.
const FAIL_DELAY_MS = 1000;
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;

const failures: number[] = [];
let lockedUntil = 0;

function recordFailure(): void {
  const now = Date.now();
  // Drop attempts older than the rolling window.
  while (failures.length > 0 && now - failures[0] > LOCKOUT_WINDOW_MS) {
    failures.shift();
  }
  failures.push(now);
  if (failures.length >= LOCKOUT_THRESHOLD) {
    lockedUntil = now + LOCKOUT_MS;
    failures.length = 0;
  }
}

function lockedRemainingMs(): number {
  return Math.max(0, lockedUntil - Date.now());
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Refuse immediately if this Lambda is in cooldown.
  const remaining = lockedRemainingMs();
  if (remaining > 0) {
    const mins = Math.ceil(remaining / 60000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in about ${mins} minute(s).`,
    };
  }

  const parsed = LoginSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.password !== env.ADMIN_PASSWORD) {
    recordFailure();
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return { ok: false, error: "Incorrect password" };
  }

  const session = await signSession();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
