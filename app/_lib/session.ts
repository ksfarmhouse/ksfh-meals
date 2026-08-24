// Admin session implementation.
//
// We sign a tiny JSON payload ({ admin: true, iat: <unix> }) with HMAC-SHA256
// and stuff the result into an HTTP-only cookie. Verifying just re-computes
// the HMAC and compares.
//
// Why HMAC + Web Crypto specifically:
//   - The cookie is verified in TWO places: app/_actions/auth.ts (Node) and
//     middleware.ts (Edge). Node's `crypto` module isn't available on Edge,
//     so we use the Web Crypto API (`crypto.subtle`) which IS available in
//     both runtimes.
//   - HMAC means we don't need a database lookup to validate a session —
//     the cookie itself is self-contained and tamper-evident.
//
// Why not iron-session or NextAuth: this app has exactly one auth state
// ("is admin"). A library would be overkill.

// Pulled through the validated env module so a misconfigured server fails
// at startup with a clear message, not on first cookie verification.
import { env } from "./env";

export const SESSION_COOKIE = "ksfh_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  admin: true;
  iat: number; // unix seconds
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}


async function hmac(data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(): Promise<{
  value: string;
  maxAge: number;
}> {
  const payload: SessionPayload = {
    admin: true,
    iat: Math.floor(Date.now() / 1000),
  };
  const enc = new TextEncoder();
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(body));
  return { value: `${body}.${sig}`, maxAge: MAX_AGE_SECONDS };
}

export async function verifySession(
  cookie: string | undefined,
): Promise<SessionPayload | null> {
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  let expected: Uint8Array;
  try {
    expected = await hmac(body);
  } catch {
    return null;
  }
  let provided: Uint8Array;
  try {
    provided = b64urlDecode(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expected, provided)) return null;
  let payload: SessionPayload;
  try {
    const dec = new TextDecoder();
    payload = JSON.parse(dec.decode(b64urlDecode(body))) as SessionPayload;
  } catch {
    return null;
  }
  if (!payload || payload.admin !== true || typeof payload.iat !== "number") {
    return null;
  }
  if (Math.floor(Date.now() / 1000) - payload.iat > MAX_AGE_SECONDS) return null;
  return payload;
}
