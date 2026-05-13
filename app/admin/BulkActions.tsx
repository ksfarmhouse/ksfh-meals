"use client";

import { useState, useTransition } from "react";
import {
  rolloverMeals,
  resetMeals,
  promoteNewMembers,
  type BulkResult,
} from "@/app/_actions/bulk";

type Action = "rollover" | "reset" | "promote";

const ACTIONS: Array<{
  key: Action;
  label: string;
  description: string;
  confirm: string;
}> = [
  {
    key: "rollover",
    label: "Rollover Meals",
    description:
      "Bills out-of-house members for any meals they didn't mark Out this week, then copies each member's default plan back into the current week.",
    confirm:
      "This bills owed meals and overwrites every member's current week with their default plan. Continue?",
  },
  {
    key: "reset",
    label: "Reset Meals",
    description:
      "Rebuilds both plans for everyone (all In for active members, all Out for everyone else) and zeros out lunches/dinners owed.",
    confirm:
      "This rebuilds plans for every member and clears all owed counts. Continue?",
  },
  {
    key: "promote",
    label: "Promote New Members",
    description: "Changes every New Member to In House.",
    confirm: "Promote every NewMember to InHouse?",
  },
];

export function BulkActions() {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<Action | null>(null);
  const [results, setResults] = useState<Partial<Record<Action, BulkResult>>>({});

  function run(action: Action) {
    const cfg = ACTIONS.find((a) => a.key === action)!;
    if (!confirm(cfg.confirm)) return;
    setRunning(action);
    startTransition(async () => {
      let res: BulkResult;
      if (action === "rollover") res = await rolloverMeals();
      else if (action === "reset") res = await resetMeals();
      else res = await promoteNewMembers();
      setResults((r) => ({ ...r, [action]: res }));
      setRunning(null);
    });
  }

  return (
    <div className="space-y-4">
      {ACTIONS.map((a) => {
        const r = results[a.key];
        return (
          <div key={a.key} className="p-4 bg-fh-white border-2 border-fh-green rounded">
            <button
              type="button"
              className="fh-btn"
              onClick={() => run(a.key)}
              disabled={pending}
            >
              {pending && running === a.key ? "Working..." : a.label}
            </button>
            <p className="mt-2 text-sm">{a.description}</p>
            {r && r.ok && (
              <p className="mt-2 font-semibold text-fh-green">{r.message}</p>
            )}
            {r && !r.ok && (
              <p className="mt-2 font-semibold text-red-700">{r.error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
