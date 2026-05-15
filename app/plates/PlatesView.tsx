// Plate-count dashboard. The user picks a day; we then count, for the lunch
// (and dinner, if not weekend) slot of that day:
//   - how many members signed up "Early" — name list shown on the Early card
//   - how many signed up "Late"          — name list on the Late card
//   - how many signed up "In"            — used as the "set for N members"
//                                          number on the Early card
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
    if (dinnerSlot !== null) {
      earlyDinner = namesWith(members, dinnerSlot, MEAL_VALUES.Early);
      lateDinner = namesWith(members, dinnerSlot, MEAL_VALUES.Late);
      inAtDinner = countWith(members, dinnerSlot, MEAL_VALUES.In);
    }

    return {
      earlyLunch,
      lateLunch,
      earlyDinner,
      lateDinner,
      inAtLunch,
      inAtDinner,
      hasDinner: dinnerSlot !== null,
    };
  }, [members, day]);

  return (
    <div>
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
              extra={<div>Set for {view.inAtDinner} Members</div>}
            />
            <PlateCard title="Late Dinner" names={view.lateDinner} />
          </>
        )}
      </div>
    </div>
  );
}
