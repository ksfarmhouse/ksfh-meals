// Public lookup actions:
//
//   lookupMemberByName — case- and whitespace-insensitive match on fullName,
//                        used by the public /find-id page.
//   lookupMemberById   — strict 4-char ID match, used by /files to gate the
//                        in-house file-server link.

"use server";

import { z } from "zod";
import { prisma } from "@/app/_lib/prisma";
import { normalizeName } from "@/app/_lib/meals";

const NameSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
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
  const parsed = NameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  | { ok: true; id: string; fullName: string }
  | { ok: false; error: string };

export async function lookupMemberById(id: string): Promise<LookupIdResult> {
  const parsed = IdSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ID" };
  }
  const m = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, fullName: true },
  });
  if (!m) return { ok: false, error: "User not found" };
  return { ok: true, id: m.id, fullName: m.fullName };
}
