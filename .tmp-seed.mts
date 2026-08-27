import { writeFileSync } from "node:fs";
const { PrismaClient } = await import("@prisma/client");
const M = await import("./app/_lib/meals.ts");
const p = new PrismaClient();
const cols = { id: true, healthyQuota: true, defaultHealthyQuota: true, healthySlots: true, healthyWeekOf: true, weeklyPlan: true, defaultPlan: true, allergens: true, houseStatus: true, lunchesOwed: true, dinnersOwed: true } as const;
writeFileSync("/tmp/seed-before.txt", (await p.member.findMany({ select: cols, orderBy: { id: "asc" } })).map(r => JSON.stringify(r)).join("\n"));

const week = M.chickenWeekOf();
// Thu dinner = slot 7. One member Late+chicken, one Early+chicken, one plain Late.
const mk = (id: string, first: string, val: number, chicken: boolean) => {
  const plan = new Array(12).fill(0); plan[7] = val;
  return p.member.create({ data: { id, firstName: first, lastName: "Platetest", fullName: `${first} Platetest`,
    houseStatus: "InHouse", weeklyPlan: plan, defaultPlan: new Array(12).fill(0),
    healthyQuota: chicken ? 1 : 0, healthySlots: chicken ? [7] : [], healthyWeekOf: chicken ? week : null } });
};
await mk("9997", "ZZLateChicken", M.MEAL_VALUES.Late, true);
await mk("9998", "ZZEarlyChicken", M.MEAL_VALUES.Early, true);
await mk("9999", "ZZLatePlain", M.MEAL_VALUES.Late, false);
console.log("seeded 3 test members on Thu dinner (slot 7), week", week);
await p.$disconnect(); process.exit(0);
