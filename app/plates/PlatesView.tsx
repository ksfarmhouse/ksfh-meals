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

export function PlatesView({ members }: Props) {
  const [day, setDay] = useState<number | null>(null);

  const view = useMemo(() => {
    if (day === null) return null;
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

      {view === null ? (
        <p className="p-4 bg-fh-white border-2 border-fh-green rounded">
          Pick a day above to see plate counts.
        </p>
      ) : (
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
      )}
    </div>
  );
}
