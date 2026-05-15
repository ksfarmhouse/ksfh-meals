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
      "Resets every member's weekly plan to their default plan. Also adds to Lunches Owed / Dinners Owed counts for out-of-house members who didn't mark Out — the treasurer uses those counts for billing.",
    confirm:
      "This resets every member's current week to their default plan, and adds to lunches/dinners owed for out-of-house members. Continue?",
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
