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
      // Healthy (chicken) option: this week's allowance and which slots it's
      // been spent on, plus the standing number restored at each rollover.
      healthyQuota: number;
      defaultHealthyQuota: number;
      healthySlots: number[];
    }
  | { ok: false; error: string };

export async function fetchMemberPlan(id: string): Promise<MemberPlanResult> {
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ID" };
  }
  const m = await prisma.member.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      fullName: true,
      weeklyPlan: true,
      defaultPlan: true,
      healthyQuota: true,
      defaultHealthyQuota: true,
      healthySlots: true,
    },
  });
  if (!m) return { ok: false, error: "Member not found" };
  return {
    ok: true,
    id: m.id,
    fullName: m.fullName,
    weeklyPlan: m.weeklyPlan,
    defaultPlan: m.defaultPlan,
    healthyQuota: m.healthyQuota,
    defaultHealthyQuota: m.defaultHealthyQuota,
    healthySlots: m.healthySlots,
  };
}
