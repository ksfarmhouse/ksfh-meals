// /admin — admin landing page. Two sections:
//   1. Weekly menu editor (saves to the singleton Menu row).
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
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Bulk Actions</h2>
        <BulkActions />
      </section>
    </div>
  );
}
