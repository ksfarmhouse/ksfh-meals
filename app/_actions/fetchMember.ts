// Fetches a member's current and default plans by ID. Used by /this-week
// and /default-plan — the user types their ID, this loads their plans into
// the dropdowns.

"use server";

import { z } from "zod";
import { prisma } from "@/app/_lib/prisma";
import {
  currentHealthy,
  healthyAvailableFor,
  isQuotaEditable,
} from "@/app/_lib/meals";

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
      // Already zeroed if what's stored belongs to a week that has rolled.
      healthyQuota: number;
      healthySlots: number[];
      // False while the chicken option is limited to HEALTHY_PREVIEW_IDS.
      healthyAvailable: boolean;
      // Free-text allergies, edited on /default-plan.
      allergens: string;
      // The allowance is set on Sunday and read-only Mon–Sat. Decided on the
      // server so the browser can't just claim it's Sunday.
      quotaEditable: boolean;
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
      healthySlots: true,
      healthyWeekOf: true,
      allergens: true,
    },
  });
  if (!m) return { ok: false, error: "Member not found" };

  // Anything tagged with an older chicken-week reads as 0 — the weekly reset.
  const healthy = currentHealthy(m);
  return {
    ok: true,
    id: m.id,
    fullName: m.fullName,
    weeklyPlan: m.weeklyPlan,
    defaultPlan: m.defaultPlan,
    healthyQuota: healthy.quota,
    healthySlots: healthy.slots,
    healthyAvailable: healthyAvailableFor(m.id),
    allergens: m.allergens ?? "",
    quotaEditable: isQuotaEditable(),
  };
}
