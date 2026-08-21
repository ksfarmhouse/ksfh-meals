// Reusable 12-slot meal-plan editor.
//
// Used by /this-week and /default-plan. The `saveAction` prop is the server
// action to call when the user hits Save — that's how we share this UI
// between the two pages while letting each one persist to a different field.
//
// It also edits the healthy (chicken) option: a weekly allowance (how many
// meals you want swapped to chicken) plus, on /this-week only, a checkbox per
// eligible meal to spend it. /default-plan carries just the number, since
// which meals get swapped is decided day-of.

"use client";

import { useState, useTransition } from "react";
import {
  MEAL_OPTIONS,
  MEAL_VALUES,
  SLOT_COUNT,
  WEEKDAYS,
  MAX_HEALTHY,
  isHealthyEligible,
  normalizeHealthySlots,
  healthyRemaining,
} from "@/app/_lib/meals";

export type SavePlanFn = (
  id: string,
  plan: number[],
  healthy: { quota: number; slots: number[] },
) => Promise<{ ok: true } | { ok: false; error: string }>;

interface Props {
  memberId: string;
  memberName: string;
  initialPlan: number[];
  initialHealthyQuota: number;
  initialHealthySlots: number[];
  // /this-week shows the per-meal checkboxes; /default-plan shows only the number.
  allowHealthySlots: boolean;
  saveAction: SavePlanFn;
  planLabel: string;
}

export function MealPlanTable({
  memberId,
  memberName,
  initialPlan,
  initialHealthyQuota,
  initialHealthySlots,
  allowHealthySlots,
  saveAction,
  planLabel,
}: Props) {
  const [plan, setPlan] = useState<number[]>(
    initialPlan.length === SLOT_COUNT ? initialPlan : new Array(SLOT_COUNT).fill(0),
  );
  const [quota, setQuota] = useState<number>(initialHealthyQuota);
  const [healthy, setHealthy] = useState<number[]>(
    normalizeHealthySlots(initialHealthySlots, initialPlan, initialHealthyQuota),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const left = healthyRemaining(quota, healthy);

  function clearFeedback() {
    setMsg(null);
    setErr(null);
  }

  function setSlot(i: number, v: number) {
    const next = plan.slice();
    next[i] = v;
    setPlan(next);
    // Marking a meal Out gives back any chicken swap spent on it.
    setHealthy((h) => normalizeHealthySlots(h, next, quota));
    clearFeedback();
  }

  function toggleHealthy(i: number) {
    setHealthy((h) =>
      h.includes(i)
        ? h.filter((s) => s !== i)
        : normalizeHealthySlots([...h, i], plan, quota),
    );
    clearFeedback();
  }

  function setQuotaValue(raw: number) {
    const q = Math.max(0, Math.min(MAX_HEALTHY, Number.isFinite(raw) ? raw : 0));
    setQuota(q);
    // Lowering the number below what's already spent trims the extra meals.
    setHealthy((h) => normalizeHealthySlots(h, plan, q));
    clearFeedback();
  }

  function onSave() {
    clearFeedback();
    startTransition(async () => {
      const res = await saveAction(memberId, plan, { quota, slots: healthy });
      if (res.ok) setMsg("Saved successfully!");
      else setErr(res.error);
    });
  }

  // One meal cell: the In/Out/Early/Late dropdown, plus a chicken checkbox on
  // eligible slots. The checkbox is disabled when the member isn't eating that
  // meal, or when they're out of swaps and this one isn't already checked.
  function slotCell(slot: number) {
    const eligible = allowHealthySlots && isHealthyEligible(slot);
    const checked = healthy.includes(slot);
    const isOut = plan[slot] === MEAL_VALUES.Out;
    return (
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
        {eligible && (
          <label className="mt-1 flex items-center justify-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={checked}
              disabled={isOut || (!checked && left === 0)}
              onChange={() => toggleHealthy(slot)}
            />
            <span className={isOut || (!checked && left === 0) ? "opacity-50" : ""}>
              chicken
            </span>
          </label>
        )}
      </td>
    );
  }

  return (
    <div className="space-y-6">
      <p>
        Editing {planLabel} for{" "}
        <span className="font-semibold">{memberName}</span> (ID {memberId})
      </p>

      <div className="p-4 bg-fh-white border-2 border-fh-green rounded max-w-xl">
        <label className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            Healthy (chicken) meals {allowHealthySlots ? "this week" : "each week"}:
          </span>
          <input
            type="number"
            min={0}
            max={MAX_HEALTHY}
            className="fh-input w-20"
            value={quota}
            onChange={(e) => setQuotaValue(Number(e.target.value))}
          />
          <span className="text-sm">of {MAX_HEALTHY} max</span>
        </label>
        <p className="mt-2 text-sm">
          {allowHealthySlots ? (
            <>
              <span className="font-semibold">{left} left</span>{" "}
              to use — tick &ldquo;chicken&rdquo; on a meal below to swap its
              main dish.
            </>
          ) : (
            <>
              You&rsquo;ll pick which meals on the day over on{" "}
              <span className="font-semibold">This Week</span>. This number
              refills every week.
            </>
          )}
        </p>
      </div>

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
            <tr>{[0, 2, 4, 6, 8].map(slotCell)}</tr>
            <tr>{[1, 3, 5, 7, 9].map(slotCell)}</tr>
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
            <tr>{[10, 11].map(slotCell)}</tr>
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
