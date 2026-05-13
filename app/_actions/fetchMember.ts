// Fetches a member's current and default plans by ID. Used by /this-week
// and /default-plan — the user types their ID, this loads their plans into
// the dropdowns.

"use server";

import { z } from "zod";
import { prisma } from "@/app/_lib/prisma";

const IdSchema = z.string().trim().length(4, "ID must be 4 characters");

export type MemberPlanResult =
  | {
      ok: true;
      id: string;
      fullName: string;
      weeklyPlan: number[];
      defaultPlan: number[];
    }
  | { ok: false; error: string };

export async function fetchMemberPlan(id: string): Promise<MemberPlanResult> {
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ID" };
  }
  const m = await prisma.member.findUnique({
    where: { id: parsed.data },
    select: { id: true, fullName: true, weeklyPlan: true, defaultPlan: true },
  });
  if (!m) return { ok: false, error: "Member not found" };
  return {
    ok: true,
    id: m.id,
    fullName: m.fullName,
    weeklyPlan: m.weeklyPlan,
    defaultPlan: m.defaultPlan,
  };
}
