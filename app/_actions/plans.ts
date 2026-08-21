// Server actions for saving a member's meal plan.
//
//   saveWeeklyPlan  — updates just `weeklyPlan` (current-week edits).
//   saveDefaultPlan — updates `defaultPlan` AND copies it into `weeklyPlan`,
//                     so changing your default also resets the current week.
//
// Both also persist the healthy (chicken) option. The rules for it live in
// app/_lib/meals.ts and are re-applied here rather than trusted from the
// browser — the meal-plan editor disables ineligible checkboxes, but that's
// convenience, not enforcement.

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import {
  SLOT_COUNT,
  MAX_HEALTHY,
  normalizeHealthySlots,
  isQuotaEditable,
} from "@/app/_lib/meals";

export type HealthyInput = { quota: number; slots: number[] };

const PlanSchema = z.object({
  id: z.string().trim().length(4, "ID must be 4 characters"),
  plan: z.array(z.number().int().min(0).max(3)).length(SLOT_COUNT),
  healthy: z.object({
    quota: z
      .number()
      .int()
      .min(0)
      .max(MAX_HEALTHY, `You can pick at most ${MAX_HEALTHY} healthy meals`),
    slots: z.array(z.number().int().min(0).max(SLOT_COUNT - 1)),
  }),
});

type Result = { ok: true } | { ok: false; error: string };

// Runs the shared healthy-option rules over what the browser sent. If the
// caller asked for more swaps than their quota allows, normalizing would
// silently drop some — so we reject instead, in plain language.
function checkHealthy(
  healthy: HealthyInput,
  plan: number[],
): { ok: true; slots: number[] } | { ok: false; error: string } {
  const slots = normalizeHealthySlots(healthy.slots, plan, healthy.quota);
  const eligible = normalizeHealthySlots(healthy.slots, plan, MAX_HEALTHY);
  if (eligible.length > slots.length) {
    return {
      ok: false,
      error: `You picked ${eligible.length} healthy meals but only allowed yourself ${healthy.quota}.`,
    };
  }
  return { ok: true, slots };
}

export async function saveWeeklyPlan(
  id: string,
  plan: number[],
  healthy: HealthyInput,
): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan, healthy });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const member = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, healthyQuota: true },
  });
  if (!member) return { ok: false, error: "Member not found" };

  // The allowance is recorded on Sunday. Mon–Sat you can still spend it on
  // individual meals, but the number itself is fixed for the week.
  if (!isQuotaEditable() && parsed.data.healthy.quota !== member.healthyQuota) {
    return {
      ok: false,
      error:
        "Your healthy-meal number is locked in for this week. You can change it again on Sunday.",
    };
  }

  const checked = checkHealthy(parsed.data.healthy, parsed.data.plan);
  if (!checked.ok) return checked;

  await prisma.member.update({
    where: { id: parsed.data.id },
    data: {
      weeklyPlan: parsed.data.plan,
      healthyQuota: parsed.data.healthy.quota,
      healthySlots: checked.slots,
    },
  });
  revalidatePath("/plates");
  revalidatePath("/this-week");
  return { ok: true };
}

export async function saveDefaultPlan(
  id: string,
  plan: number[],
  healthy: HealthyInput,
): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan, healthy });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const exists = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Member not found" };

  // Saving the default also resets the current week to match. For the healthy
  // option that means the standing number becomes this week's allowance and
  // any slots already spent are wiped — /default-plan only carries the number,
  // since which meals get swapped is decided day-of.
  await prisma.member.update({
    where: { id: parsed.data.id },
    data: {
      defaultPlan: parsed.data.plan,
      weeklyPlan: parsed.data.plan,
      defaultHealthyQuota: parsed.data.healthy.quota,
      healthyQuota: parsed.data.healthy.quota,
      healthySlots: [],
    },
  });
  revalidatePath("/plates");
  revalidatePath("/this-week");
  revalidatePath("/default-plan");
  return { ok: true };
}
