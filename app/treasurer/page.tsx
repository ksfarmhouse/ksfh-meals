// /treasurer — public read-only billing report.
// Lists every OutOfHouse member who currently owes for at least one meal.

import { prisma } from "@/app/_lib/prisma";

export const dynamic = "force-dynamic";

export default async function TreasurerPage() {
  const members = await prisma.member.findMany({
    where: {
      houseStatus: "OutOfHouse",
      OR: [{ lunchesOwed: { gt: 0 } }, { dinnersOwed: { gt: 0 } }],
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div>
      <h1 className="fh-page-title">Treasurer Report</h1>
      <p className="mb-4 text-sm">
        Out-of-house members who currently owe for one or more meals.
      </p>

      {members.length === 0 ? (
        <p className="p-4 bg-fh-white border-2 border-fh-green rounded">
          No outstanding meals.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="fh-table">
            <thead>
              <tr>
                <th>Last</th>
                <th>First</th>
                <th>Lunches Owed</th>
                <th>Dinners Owed</th>
                <th>House Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.lastName}</td>
                  <td>{m.firstName}</td>
                  <td>{m.lunchesOwed}</td>
                  <td>{m.dinnersOwed}</td>
                  <td>Out of House</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
