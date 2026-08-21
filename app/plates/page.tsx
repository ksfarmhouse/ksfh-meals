// /plates — public. Pulls everyone's current weeklyPlan, hands it to the
// client component, which lets the kitchen pick a day and see the counts.

import { prisma } from "@/app/_lib/prisma";
import { PlatesView } from "./PlatesView";

export const dynamic = "force-dynamic";

export default async function PlatesPage() {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      fullName: true,
      weeklyPlan: true,
      healthySlots: true,
      allergens: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div>
      <h1 className="fh-page-title">Plates</h1>
      <p className="mb-4 text-sm">
        Pick a day to see early/late plate counts and the kitchen set-for
        number.
      </p>
      <PlatesView members={members} />
    </div>
  );
}
