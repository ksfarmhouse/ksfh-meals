// /admin — admin landing page. Two sections:
//   1. Weekly menu editor (saves to the singleton Menu row), with the week's
//      chicken total underneath — that's the number handed to the chef.
//   2. Bulk actions: Rollover, Reset, Promote (see _actions/bulk.ts).
// Auth is enforced by middleware.ts.

import Link from "next/link";
import { prisma } from "@/app/_lib/prisma";
import { MenuForm } from "./MenuForm";
import { BulkActions } from "./BulkActions";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const menu = await prisma.menu.findUnique({ where: { id: 1 } });
  const lunch = menu?.lunch ?? new Array(7).fill("");
  const dinner = menu?.dinner ?? new Array(5).fill("");

  // Chicken tally for the week. The SUM of everyone's quota is the number the
  // chef needs — it's what people have claimed for the week, known before any
  // of them pick which dinners to spend it on.
  const chickenTotal =
    (await prisma.member.aggregate({ _sum: { healthyQuota: true } }))._sum
      .healthyQuota ?? 0;
  const chickenMembers = await prisma.member.count({
    where: { healthyQuota: { gt: 0 } },
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="fh-page-title !mb-0">Admin</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/roster" className="fh-pill">
            Roster
          </Link>
          <LogoutButton />
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Weekly Menu</h2>
        <MenuForm initialLunch={lunch} initialDinner={dinner} />
        <p className="mt-3 text-sm">
          Chicken meals this week:{" "}
          <span className="font-bold">{chickenTotal}</span>
          {chickenMembers > 0 && (
            <>
              {" "}
              (from {chickenMembers} member{chickenMembers === 1 ? "" : "s"})
            </>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Bulk Actions</h2>
        <BulkActions />
      </section>
    </div>
  );
}
