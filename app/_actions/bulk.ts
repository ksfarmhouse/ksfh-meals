// Bulk operations triggered from the /admin page:
//
//   rolloverMeals       — end-of-week chore. Resets every member's
//                         weeklyPlan back to their defaultPlan. As a side
//                         effect, for out-of-house members who didn't mark
//                         Out, increments lunchesOwed / dinnersOwed so the
//                         treasurer can bill them separately.
//   resetMeals          — nuclear option. Rebuilds plans for everyone based
//                         on house status and zeroes out owed counts. Used
//                         at the start of a semester / after a break.
//   promoteNewMembers   — flips every NewMember to InHouse (after initiation).
//
// All three are admin-gated by middleware.ts: they're only called from pages
// under /admin, so the action POST goes to an /admin URL and hits the
// /admin/:path* matcher. The gate follows the CALLING page's URL, not where
// this file happens to live.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import {
  LUNCH_SLOTS,
  DINNER_SLOTS,
  MEAL_VALUES,
  SLOT_COUNT,
  defaultPlanForStatus,
  healthySlotsForQuota,
} from "@/app/_lib/meals";

export type BulkResult = { ok: true; message: string } | { ok: false; error: string };

// Rollover: for each out-of-house member, walks their weeklyPlan and
// increments lunchesOwed / dinnersOwed for any slot they DIDN'T mark "Out"
// (because that means they ate at the house). The treasurer reads those
// counts off /treasurer and bills the member separately — this action
// itself doesn't touch money.
//
// After tallying, copies each member's permanent defaultPlan back into
// their current weeklyPlan to prepare for the next week, and refills their
// healthy (chicken) allowance from defaultHealthyQuota.
//
// Note the billing loop below is deliberately blind to the healthy option: a
// chicken meal is a swap, not a skip, so it's still an attended meal and still
// billable.
//
// We bucket the increments by meal type (lunch vs dinner) using the
// LUNCH_SLOTS / DINNER_SLOTS lookup sets from app/_lib/meals.ts so the
// treasurer report can show them separately.
//
// Everything happens inside one transaction — if any update fails, none
// of them apply, so counts can't get partially stranded.
export async function rolloverMeals(): Promise<BulkResult> {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      houseStatus: true,
      weeklyPlan: true,
      defaultPlan: true,
      defaultHealthyQuota: true,
    },
  });
  const lunchSet = new Set<number>(LUNCH_SLOTS);
  const dinnerSet = new Set<number>(DINNER_SLOTS);

  await prisma.$transaction(
    members.map((m) => {
      let lunchInc = 0;
      let dinnerInc = 0;
      // Only out-of-house members get billed; in-house members already
      // paid for the meal plan as part of room-and-board.
      if (m.houseStatus === "OutOfHouse") {
        for (let i = 0; i < SLOT_COUNT; i++) {
          if (m.weeklyPlan[i] !== MEAL_VALUES.Out) {
            if (lunchSet.has(i)) lunchInc += 1;
            else if (dinnerSet.has(i)) dinnerInc += 1;
          }
        }
      }
      return prisma.member.update({
        where: { id: m.id },
        data: {
          weeklyPlan: m.defaultPlan,
          lunchesOwed: { increment: lunchInc },
          dinnersOwed: { increment: dinnerInc },
          // Healthy (chicken) allowance is weekly: refill it from the
          // member's standing number and clear the slots they spent it on —
          // unless that number is the full allowance, which ticks them all.
          healthyQuota: m.defaultHealthyQuota,
          healthySlots: healthySlotsForQuota(
            m.defaultHealthyQuota,
            [],
            m.defaultPlan,
          ),
        },
      });
    }),
  );

  revalidatePath("/plates");
  revalidatePath("/treasurer");
  revalidatePath("/this-week");
  return { ok: true, message: `Rolled over ${members.length} member(s).` };
}

// Reset: rebuild both plan arrays for everyone and zero out owed counts.
// InHouse + NewMember get all-In (they default to eating); everyone else
// (OutOfHouse, Alumni) gets all-Out. Typically run at the start of a
// semester or after the site comes back from a break.
export async function resetMeals(): Promise<BulkResult> {
  const members = await prisma.member.findMany({
    select: { id: true, houseStatus: true },
  });
  await prisma.$transaction(
    members.map((m) => {
      const plan = defaultPlanForStatus(m.houseStatus);
      return prisma.member.update({
        where: { id: m.id },
        data: {
          weeklyPlan: plan,
          defaultPlan: plan,
          lunchesOwed: 0,
          dinnersOwed: 0,
          healthyQuota: 0,
          defaultHealthyQuota: 0,
          healthySlots: [],
        },
      });
    }),
  );

  revalidatePath("/plates");
  revalidatePath("/treasurer");
  return { ok: true, message: `Reset ${members.length} member(s).` };
}

// Promote: simple bulk update — every "NewMember" becomes "InHouse".
// Run after initiation each semester. Their meal plans are unaffected because
// NewMembers and InHouse members both default to eating all meals.
export async function promoteNewMembers(): Promise<BulkResult> {
  const result = await prisma.member.updateMany({
    where: { houseStatus: "NewMember" },
    data: { houseStatus: "InHouse" },
  });
  revalidatePath("/admin/roster");
  return { ok: true, message: `Promoted ${result.count} new member(s).` };
}
