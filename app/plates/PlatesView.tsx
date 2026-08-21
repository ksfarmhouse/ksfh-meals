// Plate-count dashboard. The user picks a day; we then count, for the lunch
// (and dinner, if not weekend) slot of that day:
//   - how many members signed up "Early" — name list shown on the Early card
//   - how many signed up "Late"          — name list on the Late card
//   - how many signed up "In"            — used as the "set for N members"
//                                          number on the Early card
// An Allergens panel sits above the day picker, listing every member who has
// entered allergies. It is intentionally day-independent — the cook should see
// it on every visit.
//
//   - who flagged the healthy (chicken) option AT DINNER — its own card, plus
//     a count on the Early Dinner card so the cook knows how many chicken
//     plates to make. Lunch is deliberately excluded: the kitchen only needs
//     the chicken count for the cooked dinner service.
//
// All work happens client-side over the array we got from the server
// component, so flipping between days is instant.

"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "@/components/DayPicker";
import { PlateCard } from "@/components/PlateCard";
import {
  MEAL_VALUES,
  lunchSlotForDay,
  dinnerSlotForDay,
} from "@/app/_lib/meals";

export interface MemberForPlates {
  id: string;
  fullName: string;
  weeklyPlan: number[];
  healthySlots: number[];
  allergens: string | null;
}

interface Props {
  members: MemberForPlates[];
}

function namesWith(
  members: MemberForPlates[],
  slot: number,
  value: number,
): string[] {
  return members
    .filter((m) => m.weeklyPlan[slot] === value)
    .map((m) => m.fullName)
    .sort();
}

function countWith(
  members: MemberForPlates[],
  slot: number,
  value: number,
): number {
  return members.reduce(
    (n, m) => (m.weeklyPlan[slot] === value ? n + 1 : n),
    0,
  );
}

// Everyone getting chicken at this meal. Guards on the plan value too: a
// stale flag on a meal the member later marked Out shouldn't produce a plate.
// This cuts across Early/Late/In, so it gets its own card rather than folding
// into one of theirs.
function healthyNames(members: MemberForPlates[], slot: number): string[] {
  return members
    .filter(
      (m) =>
        m.healthySlots.includes(slot) && m.weeklyPlan[slot] !== MEAL_VALUES.Out,
    )
    .map((m) => m.fullName)
    .sort();
}

// Today's day-of-week, mapped to our index (0=Mon … 6=Sun).
// JS Date.getDay() returns 0=Sun..6=Sat; we shift so Mon=0.
function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function PlatesView({ members }: Props) {
  // Defaults to today so the kitchen lands on the right day instantly.
  const [day, setDay] = useState<number>(todayIndex());

  const view = useMemo(() => {
    const lunchSlot = lunchSlotForDay(day);
    const dinnerSlot = dinnerSlotForDay(day);

    const earlyLunch = namesWith(members, lunchSlot, MEAL_VALUES.Early);
    const lateLunch = namesWith(members, lunchSlot, MEAL_VALUES.Late);
    const inAtLunch = countWith(members, lunchSlot, MEAL_VALUES.In);

    let earlyDinner: string[] = [];
    let lateDinner: string[] = [];
    let inAtDinner = 0;
    let chickenDinner: string[] = [];
    if (dinnerSlot !== null) {
      earlyDinner = namesWith(members, dinnerSlot, MEAL_VALUES.Early);
      lateDinner = namesWith(members, dinnerSlot, MEAL_VALUES.Late);
      inAtDinner = countWith(members, dinnerSlot, MEAL_VALUES.In);
      chickenDinner = healthyNames(members, dinnerSlot);
    }

    return {
      earlyLunch,
      lateLunch,
      earlyDinner,
      lateDinner,
      inAtLunch,
      inAtDinner,
      chickenDinner,
      hasDinner: dinnerSlot !== null,
    };
  }, [members, day]);

  // Allergies sit ABOVE the day picker and ignore it entirely: the kitchen
  // needs to see these every time they open the page, not only on the days
  // that member happens to be eating.
  const allergyList = members
    .filter((m) => m.allergens && m.allergens.trim() !== "")
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div>
      {allergyList.length > 0 && (
        <div className="mb-4 p-4 bg-fh-white border-2 border-red-600 rounded">
          <h2 className="font-bold mb-2">Allergens</h2>
          <ul className="text-sm space-y-1">
            {allergyList.map((m) => (
              <li key={m.id}>
                <span className="font-semibold">{m.fullName}</span> —{" "}
                {m.allergens}
              </li>
            ))}
          </ul>
        </div>
      )}

      <DayPicker selected={day} onSelect={setDay} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlateCard
          title="Early Lunch"
          names={view.earlyLunch}
          extra={<div>Set for {view.inAtLunch} Members</div>}
        />
        <PlateCard title="Late Lunch" names={view.lateLunch} />
        {view.hasDinner && (
          <>
            <PlateCard
              title="Early Dinner"
              names={view.earlyDinner}
              extra={
                <>
                  <div>Set for {view.inAtDinner} Members</div>
                  <div>
                    {view.chickenDinner.length} chicken plate
                    {view.chickenDinner.length === 1 ? "" : "s"}
                  </div>
                </>
              }
            />
            <PlateCard title="Late Dinner" names={view.lateDinner} />
            <PlateCard title="Chicken Dinner" names={view.chickenDinner} />
          </>
        )}
      </div>
    </div>
  );
}
