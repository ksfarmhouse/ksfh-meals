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

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type LoginState = { ok: false; error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, error: "Server is missing ADMIN_PASSWORD" };
  }
  if (parsed.data.password !== expected) {
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
