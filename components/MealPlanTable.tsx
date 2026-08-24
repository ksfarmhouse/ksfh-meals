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
  HEALTHY_SLOTS,
  isHealthyEligible,
  isDinnerChoiceLocked,
  normalizeHealthySlots,
  healthyRemaining,
} from "@/app/_lib/meals";
import { MealStatusLegend } from "./MealStatusLegend";

// "" (a cleared box) and anything out of range both resolve to a usable number.
function parseQuota(text: string): number {
  if (text === "") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? Math.max(0, Math.min(MAX_HEALTHY, n)) : 0;
}

export type SavePlanFn = (
  id: string,
  plan: number[],
  healthy: { quota: number; slots: number[] },
  allergens: string,
) => Promise<{ ok: true } | { ok: false; error: string }>;

interface Props {
  memberId: string;
  memberName: string;
  initialPlan: number[];
  initialHealthyQuota: number;
  initialHealthySlots: number[];
  // /this-week shows the per-meal checkboxes; /default-plan shows only the number.
  allowHealthySlots: boolean;
  initialAllergens: string;
  // False while the chicken option is limited to HEALTHY_PREVIEW_IDS — the
  // box and the per-meal checkboxes disappear entirely.
  healthyAvailable: boolean;
  // Allergies are owned by /default-plan, so the box only renders there.
  showAllergens: boolean;
  // The member's standing number. On This Week, a 0 here means whatever they
  // set is a one-week number that rollover will wipe.
  standingQuota: number;
  // False Mon–Fri: the number is recorded on Sunday and fixed for the week.
  quotaEditable: boolean;
  saveAction: SavePlanFn;
  planLabel: string;
}

export function MealPlanTable({
  memberId,
  memberName,
  initialPlan,
  initialHealthyQuota,
  initialHealthySlots,
  healthyAvailable,
  initialAllergens,
  showAllergens,
  allowHealthySlots,
  standingQuota,
  quotaEditable,
  saveAction,
  planLabel,
}: Props) {
  const [plan, setPlan] = useState<number[]>(
    initialPlan.length === SLOT_COUNT ? initialPlan : new Array(SLOT_COUNT).fill(0),
  );
  // Held as text, not a number, so the member can clear the box and type a
  // fresh value. An empty box counts as 0 everywhere the rules are applied,
  // and snaps back to "0" once they click away.
  const [quotaText, setQuotaText] = useState<string>(String(initialHealthyQuota));
  const quota = parseQuota(quotaText);
  const [healthy, setHealthy] = useState<number[]>(
    normalizeHealthySlots(initialHealthySlots, initialPlan, initialHealthyQuota),
  );
  const [allergens, setAllergens] = useState<string>(initialAllergens);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const left = healthyRemaining(quota, healthy);
  // Only this week's number is frozen Mon–Fri. The standing number on
  // /default-plan is for next week, so it stays editable any day.
  const locked = allowHealthySlots && !quotaEditable;

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

  function setQuotaValue(raw: string) {
    // Digits only, but keep "" so the box can sit empty mid-edit.
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    const next =
      raw === "" ? "" : String(Math.min(MAX_HEALTHY, Number(raw)));
    setQuotaText(next);
    const q = parseQuota(next);
    setHealthy((h) =>
      q === MAX_HEALTHY
        ? // Taking the full allowance leaves nothing to choose, so tick every
          // dinner rather than making them do it by hand.
          normalizeHealthySlots([...HEALTHY_SLOTS], plan, q)
        : // Lowering the number below what's already spent trims the extras.
          normalizeHealthySlots(h, plan, q),
    );
    clearFeedback();
  }

  // Left the box empty — fall back to 0 the same as if they'd typed it.
  function fillBlankQuota() {
    if (quotaText === "") setQuotaText("0");
  }

  function onSave() {
    clearFeedback();
    startTransition(async () => {
      const res = await saveAction(
        memberId,
        plan,
        { quota, slots: healthy },
        allergens,
      );
      if (res.ok) setMsg("Saved successfully!");
      else setErr(res.error);
    });
  }

  // One meal cell: the In/Out/Early/Late dropdown, plus a chicken checkbox on
  // eligible slots. The checkbox is disabled when the member isn't eating that
  // meal, or when they're out of swaps and this one isn't already checked.
  function slotCell(slot: number) {
    const eligible =
      healthyAvailable && allowHealthySlots && isHealthyEligible(slot);
    const checked = healthy.includes(slot);
    const isOut = plan[slot] === MEAL_VALUES.Out;
    // Past 4:30pm on its own day the cook already has that night's count.
    const pastCutoff = eligible && isDinnerChoiceLocked(slot);
    const disabled = isOut || pastCutoff || (!checked && left === 0);
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
              disabled={disabled}
              onChange={() => toggleHealthy(slot)}
            />
            <span className={disabled ? "opacity-50" : ""}>
              {pastCutoff ? "chicken (closed)" : "chicken"}
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

      {/* Save sits ABOVE the tables on purpose: people were filling the form
          in and leaving without pressing it, so it needs to be visible before
          they start rather than parked below the fold. */}
      <div className="flex items-center gap-3">
        <button type="button" className="fh-btn" onClick={onSave} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </button>
        {msg && <span className="font-semibold text-fh-green">{msg}</span>}
        {err && <span className="font-semibold text-red-700">{err}</span>}
      </div>

      <p className="text-sm">
        Changes aren&rsquo;t saved until you press{" "}
        <span className="font-semibold">Save</span>.
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

      {healthyAvailable && (
        <div className="p-3 bg-fh-white border-2 border-fh-green rounded max-w-xl text-sm">
          <label className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              Chicken dinners {allowHealthySlots ? "this week" : "each week"}:
            </span>
            {/* Mon–Fri the number is settled for the week, so it's shown as
                plain text rather than an editable field. */}
            {locked ? (
              <span className="font-semibold">{quota}</span>
            ) : (
              <input
                type="number"
                min={0}
                max={MAX_HEALTHY}
                // .fh-input is width:100%, so the utility needs to win here.
                className="fh-input !w-20"
                value={quotaText}
                onChange={(e) => setQuotaValue(e.target.value)}
                onBlur={fillBlankQuota}
              />
            )}
            <span>of {MAX_HEALTHY} max</span>
            {allowHealthySlots && (
              <span className="font-semibold">
                {locked && "🔒 "}
                {left} left
              </span>
            )}
          </label>
          <p className="mt-1">
            {allowHealthySlots ? (
              <>
                Mon, Tue and Thu dinners — tick them in the grid above. Each
                one closes at 4:30pm that day. The number itself can only be
                changed Saturday and Sunday.
              </>
            ) : (
              <>
                Mon, Tue and Thu dinners. This refills every week; you pick
                which ones on <span className="font-semibold">This Week</span>.
                {quota >= MAX_HEALTHY && (
                  <> Taking all {MAX_HEALTHY} ticks every dinner for you.</>
                )}
              </>
            )}
          </p>
          {allowHealthySlots && standingQuota === 0 && quota > 0 && (
            <p className="mt-1">
              One-week number — set it on{" "}
              <span className="font-semibold">Default Plan</span> to get it
              automatically every week.
            </p>
          )}
        </div>
      )}

      <MealStatusLegend showHealthy={healthyAvailable} />

      {showAllergens && (
        <div className="p-3 bg-fh-white border-2 border-fh-green rounded max-w-xl text-sm">
          <label className="block">
            <span className="font-semibold">Allergies / dietary restrictions</span>
            <input
              type="text"
              maxLength={200}
              className="fh-input mt-1"
              placeholder="e.g. celiac — no gluten"
              value={allergens}
              onChange={(e) => {
                setAllergens(e.target.value);
                clearFeedback();
              }}
            />
          </label>
          <p className="mt-1">
            Blank if none. Shows at the top of the public{" "}
            <span className="font-semibold">Plates</span> page next to your name.
          </p>
        </div>
      )}
    </div>
  );
}
