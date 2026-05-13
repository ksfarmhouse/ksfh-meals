// Server actions for saving a member's meal plan.
//
//   saveWeeklyPlan  — updates just `weeklyPlan` (current-week edits).
//   saveDefaultPlan — updates `defaultPlan` AND copies it into `weeklyPlan`,
//                     so changing your default also resets the current week.

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import { SLOT_COUNT } from "@/app/_lib/meals";

const PlanSchema = z.object({
  id: z.string().trim().length(4, "ID must be 4 characters"),
  plan: z.array(z.number().int().min(0).max(3)).length(SLOT_COUNT),
});

type Result = { ok: true } | { ok: false; error: string };

export async function saveWeeklyPlan(id: string, plan: number[]): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const exists = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Member not found" };

  await prisma.member.update({
    where: { id: parsed.data.id },
    data: { weeklyPlan: parsed.data.plan },
  });
  revalidatePath("/plates");
  revalidatePath("/this-week");
  return { ok: true };
}

export async function saveDefaultPlan(id: string, plan: number[]): Promise<Result> {
  const parsed = PlanSchema.safeParse({ id, plan });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const exists = await prisma.member.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Member not found" };

  // Saving the default also resets the current week to match.
  await prisma.member.update({
    where: { id: parsed.data.id },
    data: { defaultPlan: parsed.data.plan, weeklyPlan: parsed.data.plan },
  });
  revalidatePath("/plates");
  revalidatePath("/this-week");
  revalidatePath("/default-plan");
  return { ok: true };
}
