// Public lookup actions:
//
//   lookupMemberByName — case- and whitespace-insensitive match on fullName,
//                        used by /find-id. Password-gated: the check runs
//                        HERE, server-side, so no ID is ever sent to a
//                        browser that didn't supply the password.
//   lookupMemberById   — strict 4-char ID match, used by /files to gate the
//                        in-house file-server link. Returns the URL itself on
//                        success; see the note on that function for why.

"use server";

import { z } from "zod";
import { prisma } from "@/app/_lib/prisma";
import { normalizeName } from "@/app/_lib/meals";
import { env } from "@/app/_lib/env";

// New members don't get the file-server link for now. Flip this to true to
// give it back to them — it's the only change needed, the rest of the page
// works the same for everyone.
//
// Deliberately NOT exported: this is a "use server" file, and Next only
// allows async function exports from those. Exporting a constant here breaks
// the build (and `tsc --noEmit` won't catch it — only `next build` will).
const FILES_OPEN_TO_NEW_MEMBERS = false;

const NameSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  password: z.string().min(1, "Password is required"),
});

const IdSchema = z.object({
  id: z.string().trim().length(4, "ID must be 4 characters"),
});

export type LookupNameResult =
  | { ok: true; id: string; fullName: string }
  | { ok: false; error: string };

export async function lookupMemberByName(
  _prev: LookupNameResult | null,
  formData: FormData,
): Promise<LookupNameResult> {
  const parsed = NameSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Checked before we touch the database, so a wrong password reveals
  // nothing at all — not even whether that name is on the roster.
  if (parsed.data.password !== env.FIND_ID_PASSWORD) {
    return { ok: false, error: "Wrong password." };
  }

  const target = normalizeName(parsed.data.name);

  // We index fullName but it isn't normalized at rest, so scan and compare normalized.
  // Members table is small (~fraternity-size), so this is fine.
  const members = await prisma.member.findMany({
    select: { id: true, fullName: true },
  });
  const match = members.find((m) => normalizeName(m.fullName) === target);
  if (!match) return { ok: false, error: "User not found" };
  return { ok: true, id: match.id, fullName: match.fullName };
}

export type LookupIdResult =
  | { ok: true; id: string; fullName: string; filesUrl: string }
  | { ok: false; error: string };

// Gates the in-house file-server link.
//
// The URL is returned FROM HERE rather than rendered into the page, because
// a URL handed to the browser up front sits in the public page source where
// anyone can read it without entering an ID at all — which would make this
// check decorative. Sending it only after the ID clears is what makes the
// gate real.
export async function lookupMemberById(id: string): Promise<LookupIdResult> {
  const parsed = IdSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ID" };
  }
  const m = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, fullName: true, houseStatus: true },
  });
  if (!m) return { ok: false, error: "User not found" };

  if (!FILES_OPEN_TO_NEW_MEMBERS && m.houseStatus === "NewMember") {
    return { ok: false, error: "Files access opens up after initiation." };
  }

  return { ok: true, id: m.id, fullName: m.fullName, filesUrl: env.FILES_LAN_URL };
}
