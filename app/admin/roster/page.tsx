// /admin/roster — Server component that loads the member list and hands
// it to the client-side RosterManager. The client component owns all the
// add/edit/remove state and instant-update behavior.

import Link from "next/link";
import { prisma } from "@/app/_lib/prisma";
import { RosterManager } from "./RosterManager";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, houseStatus: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="fh-page-title !mb-0">Roster</h1>
        <Link href="/admin" className="fh-pill">
          Back to Admin
        </Link>
      </div>
      <RosterManager initial={members} />
    </div>
  );
}
