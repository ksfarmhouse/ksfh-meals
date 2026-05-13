// Bulk operations triggered from the /admin page:
//
//   rolloverMeals       — end-of-week chore. Bills out-of-house members for
//                         meals they didn't mark Out, then resets everyone's
//                         current week to their default plan.
//   resetMeals          — nuclear option. Rebuilds plans for everyone based
//                         on house status and zeroes out owed counts. Used
//                         at the start of a semester / after a break.
//   promoteNewMembers   — flips every NewMember to InHouse (after initiation).
//
// All three are admin-gated by middleware.ts since they live under /admin.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import {
  LUNCH_SLOTS,
  DINNER_SLOTS,
  MEAL_VALUES,
  isActiveStatus,
  SLOT_COUNT,
  emptyPlan,
} from "@/app/_lib/meals";

export type BulkResult = { ok: true; message: string } | { ok: false; error: string };

// Rollover: bill out-of-house members for any meal slot they DIDN'T mark
// "Out" this week (because that means they ate at the house and need to
// pay for it), then copy each member's permanent defaultPlan back into
// their current weeklyPlan to prepare for the next week.
//
// We bucket the increments by meal type (lunch vs dinner) using the
// LUNCH_SLOTS / DINNER_SLOTS lookup sets from app/_lib/meals.ts so the
// treasurer report can show them separately.
//
// Everything happens inside one transaction — if any update fails, none
// of them apply, so partial bills can't get stranded.
export async function rolloverMeals(): Promise<BulkResult> {
  const members = await prisma.member.findMany();
  let updated = 0;
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
      updated += 1;
      return prisma.member.update({
        where: { id: m.id },
        data: {
          weeklyPlan: m.defaultPlan,
          lunchesOwed: { increment: lunchInc },
          dinnersOwed: { increment: dinnerInc },
        },
      });
    }),
  );

  revalidatePath("/plates");
  revalidatePath("/treasurer");
  revalidatePath("/this-week");
  return { ok: true, message: `Rolled over ${updated} member(s).` };
}

// Reset: rebuild both plan arrays for everyone and zero out owed counts.
// InHouse + NewMember get all-In (they default to eating); everyone else
// (OutOfHouse, Alumni) gets all-Out. Typically run at the start of a
// semester or after the site comes back from a break.
export async function resetMeals(): Promise<BulkResult> {
  const members = await prisma.member.findMany({
    select: { id: true, houseStatus: true },
  });
  const allIn = emptyPlan(MEAL_VALUES.In);
  const allOut = emptyPlan(MEAL_VALUES.Out);

  await prisma.$transaction(
    members.map((m) => {
      const plan = isActiveStatus(m.houseStatus) ? allIn : allOut;
      return prisma.member.update({
        where: { id: m.id },
        data: {
          weeklyPlan: plan,
          defaultPlan: plan,
          lunchesOwed: 0,
          dinnersOwed: 0,
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
