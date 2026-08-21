// Roster management actions called from /admin/roster:
//
//   addMember              — create a new row. Returns the new member's data
//                            so the client can append to the table without a
//                            page refresh.
//   updateMemberStatuses   — apply pending status-dropdown changes in one go.
//                            Has special handling for active↔inactive moves.
//   removeMember           — delete a single member.
//
// All admin-gated by middleware.ts (the file lives under /admin/*).

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import {
  defaultPlanForStatus,
  isActiveStatus,
  healthyAvailableFor,
  MEAL_VALUES,
  emptyPlan,
} from "@/app/_lib/meals";

const HouseStatus = z.enum(["NewMember", "InHouse", "OutOfHouse", "Alumni"]);
type HouseStatusT = z.infer<typeof HouseStatus>;

const NewMemberSchema = z.object({
  id: z.string().trim().length(4, "ID must be 4 characters"),
  firstName: z.string().trim().min(1, "First name required").max(60),
  lastName: z.string().trim().min(1, "Last name required").max(60),
  houseStatus: HouseStatus,
});

export type AddedMember = {
  id: string;
  firstName: string;
  lastName: string;
  houseStatus: HouseStatusT;
};

export type AddState =
  | { ok: true; message: string; member: AddedMember }
  | { ok: false; error: string }
  | null;

export async function addMember(_prev: AddState, formData: FormData): Promise<AddState> {
  const parsed = NewMemberSchema.safeParse({
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    houseStatus: formData.get("houseStatus"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, firstName, lastName, houseStatus } = parsed.data;
  const existing = await prisma.member.findUnique({ where: { id } });
  if (existing) return { ok: false, error: `ID ${id} is already in use` };

  const plan = defaultPlanForStatus(houseStatus);
  await prisma.member.create({
    data: {
      id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      houseStatus,
      weeklyPlan: plan,
      defaultPlan: plan,
    },
  });
  revalidatePath("/admin/roster");
  revalidatePath("/plates");
  revalidatePath("/treasurer");
  return {
    ok: true,
    message: `Added ${firstName} ${lastName} (${id}).`,
    member: { id, firstName, lastName, houseStatus },
  };
}

const UpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().trim().length(4),
      houseStatus: HouseStatus,
    }),
  ),
});

export type UpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function updateMemberStatuses(
  updates: Array<{ id: string; houseStatus: HouseStatusT }>,
): Promise<UpdateState> {
  const parsed = UpdateSchema.safeParse({ updates });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const members = await prisma.member.findMany({
    where: { id: { in: parsed.data.updates.map((u) => u.id) } },
    select: { id: true, houseStatus: true },
  });
  const currentById = new Map(members.map((m) => [m.id, m.houseStatus]));
  const allIn = emptyPlan(MEAL_VALUES.In);
  const allOut = emptyPlan(MEAL_VALUES.Out);

  // If a member's status crosses the "active" boundary
  //   active   = InHouse, NewMember   (eats at the house by default)
  //   inactive = OutOfHouse, Alumni   (skips meals by default)
  // we also reset both of their plan arrays. Going from active → inactive
  // shouldn't leave them signed up to eat every meal; going the other way
  // shouldn't leave them marked Out for every meal.
  let touched = 0;
  await prisma.$transaction(
    parsed.data.updates
      .filter((u) => currentById.has(u.id))
      .map((u) => {
        const prev = currentById.get(u.id)!;
        const crossed = isActiveStatus(prev) !== isActiveStatus(u.houseStatus);
        touched += 1;
        if (crossed) {
          const plan = isActiveStatus(u.houseStatus) ? allIn : allOut;
          return prisma.member.update({
            where: { id: u.id },
            data: {
              houseStatus: u.houseStatus,
              weeklyPlan: plan,
              defaultPlan: plan,
              // Their healthy (chicken) allowance goes with the plan reset —
              // a stale quota shouldn't survive a move in or out of the house.
              healthyQuota: 0,
              defaultHealthyQuota: 0,
              healthySlots: [],
            },
          });
        }
        // InHouse → NewMember isn't an active/inactive crossing, but new
        // members don't get the healthy option, so clear it either way.
        return prisma.member.update({
          where: { id: u.id },
          data: healthyAvailableFor(u.houseStatus)
            ? { houseStatus: u.houseStatus }
            : {
                houseStatus: u.houseStatus,
                healthyQuota: 0,
                defaultHealthyQuota: 0,
                healthySlots: [],
              },
        });
      }),
  );

  revalidatePath("/admin/roster");
  revalidatePath("/plates");
  revalidatePath("/treasurer");
  return { ok: true, message: `Updated ${touched} member(s).` };
}

const RemoveSchema = z.object({
  id: z.string().trim().length(4),
});

export type RemoveState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function removeMember(id: string): Promise<RemoveState> {
  const parsed = RemoveSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ID" };
  }
  try {
    await prisma.member.delete({ where: { id: parsed.data.id } });
  } catch {
    return { ok: false, error: "Member not found" };
  }
  revalidatePath("/admin/roster");
  revalidatePath("/plates");
  revalidatePath("/treasurer");
  return { ok: true, message: `Removed ${id}.` };
}
