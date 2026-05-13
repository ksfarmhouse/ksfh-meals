// Reusable 12-slot meal-plan editor.
//
// Used by /this-week and /default-plan. The `saveAction` prop is the server
// action to call when the user hits Save — that's how we share this UI
// between the two pages while letting each one persist to a different field.

"use client";

import { useState, useTransition } from "react";
import { MEAL_OPTIONS, SLOT_COUNT, WEEKDAYS } from "@/app/_lib/meals";

export type SavePlanFn = (
  id: string,
  plan: number[],
) => Promise<{ ok: true } | { ok: false; error: string }>;

interface Props {
  memberId: string;
  memberName: string;
  initialPlan: number[];
  saveAction: SavePlanFn;
  planLabel: string;
}

export function MealPlanTable({
  memberId,
  memberName,
  initialPlan,
  saveAction,
  planLabel,
}: Props) {
  const [plan, setPlan] = useState<number[]>(
    initialPlan.length === SLOT_COUNT ? initialPlan : new Array(SLOT_COUNT).fill(0),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setSlot(i: number, v: number) {
    setPlan((p) => {
      const next = p.slice();
      next[i] = v;
      return next;
    });
    setMsg(null);
    setErr(null);
  }

  function onSave() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await saveAction(memberId, plan);
      if (res.ok) setMsg("Saved successfully!");
      else setErr(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <p>
        Editing {planLabel} for{" "}
        <span className="font-semibold">{memberName}</span> (ID {memberId})
      </p>

      <div className="overflow-x-auto">
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
              {[0, 2, 4, 6, 8].map((slot) => (
                <td key={slot}>
                  <select
                    className="fh-select"
                    value={plan[slot]}
                    onChange={(e) => setSlot(slot, Number(e.target.value))}
                  >
                    {MEAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              {[1, 3, 5, 7, 9].map((slot) => (
                <td key={slot}>
                  <select
                    className="fh-select"
                    value={plan[slot]}
                    onChange={(e) => setSlot(slot, Number(e.target.value))}
                  >
                    {MEAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
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
              {[10, 11].map((slot) => (
                <td key={slot}>
                  <select
                    className="fh-select"
                    value={plan[slot]}
                    onChange={(e) => setSlot(slot, Number(e.target.value))}
                  >
                    {MEAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="fh-btn" onClick={onSave} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </button>
        {msg && <span className="font-semibold text-fh-green">{msg}</span>}
        {err && <span className="font-semibold text-red-700">{err}</span>}
      </div>
    </div>
  );
}
