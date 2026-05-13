// Public home page: this week's menu (read-only).
// Server component — fetches the singleton Menu row on every request.

import { prisma } from "@/app/_lib/prisma";
import { WEEKDAYS } from "@/app/_lib/meals";

// force-dynamic disables Next's default static caching so the menu is
// always live — admins change it through /admin and visitors expect to
// see the new text immediately.
export const dynamic = "force-dynamic";

async function getMenu() {
  const menu = await prisma.menu.findUnique({ where: { id: 1 } });
  return (
    menu ?? {
      lunch: Array(7).fill("TBD"),
      dinner: Array(5).fill("TBD"),
    }
  );
}

export default async function MenuPage() {
  const menu = await getMenu();

  return (
    <div className="text-center">
      <h1 className="fh-page-title-full">Weekly Menu</h1>

      <div className="overflow-x-auto mb-8">
        <table className="fh-table mx-auto">
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {menu.lunch.slice(0, 5).map((m, i) => (
                <td key={i}>{m || "TBD"}</td>
              ))}
            </tr>
            <tr>
              {menu.dinner.slice(0, 5).map((m, i) => (
                <td key={i}>{m || "TBD"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="fh-table mx-auto max-w-md">
          <thead>
            <tr>
              <th>Sat</th>
              <th>Sun</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{menu.lunch[5] || "TBD"}</td>
              <td>{menu.lunch[6] || "TBD"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
