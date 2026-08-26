// Server actions for saving a member's meal plan.
//
//   saveWeeklyPlan  — updates just `weeklyPlan` (current-week edits). It
//                     accepts allergens for a matching signature but does NOT
//                     write them; that field is owned by /default-plan.
//
// Both re-apply the chicken deadlines from app/_lib/meals.ts server-side. The
// browser disables the controls too, but that's convenience — this is the gate.
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
  healthyAvailableFor,
  isQuotaEditable,
  isDinnerChoiceLocked,
  healthySlotsForQuota,
  currentHealthy,
  chickenWeekOf,
} from "@/app/_lib/meals";

export type HealthyInput = { quota: number; slots: number[] };

const PlanSchema = z.object({
  id: z.string().trim().length(4, "ID must be 4 characters"),
  plan: z.array(z.number().int().min(0).max(3)).length(SLOT_COUNT),
  // Free text, so just trim and cap the length — no format to enforce.
  allergens: z.string().trim().max(200, "Please keep allergies under 200 characters"),
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
  allergens: string,
): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan, healthy, allergens });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const member = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      healthyQuota: true,
      healthySlots: true,
      healthyWeekOf: true,
    },
  });
  if (!member) return { ok: false, error: "Member not found" };

  // Compare against the EFFECTIVE count: if what's stored belongs to a week
  // that has already rolled over, it reads as 0 and they start fresh.
  const stored = currentHealthy(member);

  // Outside the preview the chicken option doesn't exist for this member, so
  // the meal plan still saves but the healthy fields are pinned to zero,
  // whatever the browser sent.
  let quota = 0;
  let slots: number[] = [];

  if (healthyAvailableFor(parsed.data.id)) {
    // Deadline 1 — how many. Set over the weekend, frozen Mon–Fri.
    if (!isQuotaEditable() && parsed.data.healthy.quota !== stored.quota) {
      return {
        ok: false,
        error:
          "Your chicken number is locked in for this week. You can change it again Saturday.",
      };
    }

    // Deadline 2 — which ones. A dinner past its 4:30pm cutoff keeps whatever
    // is already stored: the cook has that night's count, so the member can
    // neither add a chicken plate nor take one back.
    // A full allowance means every eligible dinner, whatever the browser sent.
    const wanted = healthySlotsForQuota(
      parsed.data.healthy.quota,
      parsed.data.healthy.slots,
      parsed.data.plan,
    );
    const merged = [
      ...stored.slots.filter((slot) => isDinnerChoiceLocked(slot)),
      ...wanted.filter((slot) => !isDinnerChoiceLocked(slot)),
    ];

    const checked = checkHealthy(
      { quota: parsed.data.healthy.quota, slots: merged },
      parsed.data.plan,
    );
    if (!checked.ok) return checked;

    quota = parsed.data.healthy.quota;
    slots = checked.slots;
  }

  await prisma.member.update({
    where: { id: parsed.data.id },
    data: {
      weeklyPlan: parsed.data.plan,
      healthyQuota: quota,
      healthySlots: slots,
      // Tag the week this count belongs to, so it zeroes itself on Saturday.
      healthyWeekOf: chickenWeekOf(),
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
  allergens: string,
): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan, healthy, allergens });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const exists = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Member not found" };

  // Saving the default also resets the current week to match. It does NOT
  // touch the chicken count: that lives only on This Week now, and resets
  // itself every Saturday.
  await prisma.member.update({
    where: { id: parsed.data.id },
    data: {
      defaultPlan: parsed.data.plan,
      weeklyPlan: parsed.data.plan,
      // Blank means "nothing to report" — store null so it doesn't render.
      allergens: parsed.data.allergens === "" ? null : parsed.data.allergens,
    },
  });
  revalidatePath("/plates");
  revalidatePath("/this-week");
  revalidatePath("/default-plan");
  return { ok: true };
}
