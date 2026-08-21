// Two-stage form used by /this-week and /default-plan:
//   1. Member enters their 4-digit ID and clicks Load Plan.
//   2. We fetch their member record, then render the MealPlanTable populated
//      with the right plan array. They can save or switch to a different ID.
//
// The healthy (chicken) allowance follows the same split: weekly mode edits
// this week's number and which meals it's spent on, default mode edits only
// the standing number that refills it at rollover.
//
// The `mode` prop selects which field to read and which save action to use.

"use client";

import { useState } from "react";
import { fetchMemberPlan } from "@/app/_actions/fetchMember";
import { saveWeeklyPlan, saveDefaultPlan } from "@/app/_actions/plans";
import { MealPlanTable } from "./MealPlanTable";
import { MealStatusLegend } from "./MealStatusLegend";

type Mode = "weekly" | "default";

interface Props {
  mode: Mode;
}

export function PlanEditor({ mode }: Props) {
  const [id, setId] = useState("");
  const [member, setMember] = useState<{
    id: string;
    name: string;
    plan: number[];
    healthyQuota: number;
    healthySlots: number[];
    standingQuota: number;
    allergens: string;
    healthyAvailable: boolean;
    quotaEditable: boolean;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLoad(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetchMemberPlan(id);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      setMember(null);
      return;
    }
    setMember({
      id: res.id,
      name: res.fullName,
      plan: mode === "weekly" ? res.weeklyPlan : res.defaultPlan,
      // Weekly mode edits this week's allowance; default mode edits the
      // standing number that refills it at each rollover.
      healthyQuota:
        mode === "weekly" ? res.healthyQuota : res.defaultHealthyQuota,
      healthySlots: mode === "weekly" ? res.healthySlots : [],
      // Used on This Week to warn when a number was set for this week only
      // and will reset to 0 at the next rollover.
      standingQuota: res.defaultHealthyQuota,
      allergens: res.allergens,
      healthyAvailable: res.healthyAvailable,
      quotaEditable: res.quotaEditable,
    });
  }

  function reset() {
    setMember(null);
    setId("");
    setErr(null);
  }

  if (!member) {
    return (
      <form onSubmit={onLoad} className="max-w-md space-y-3">
        <label className="block">
          <span className="block mb-1 font-semibold">Member ID</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            className="fh-input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="fh-btn" disabled={loading}>
          {loading ? "Loading..." : "Load Plan"}
        </button>
        {err && (
          <p className="mt-2 p-3 bg-fh-white border-2 border-red-600 text-red-700 rounded">
            {err}
          </p>
        )}
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <button type="button" className="fh-btn" onClick={reset}>
          Switch member
        </button>
      </div>
      <MealPlanTable
        memberId={member.id}
        memberName={member.name}
        initialPlan={member.plan}
        initialHealthyQuota={member.healthyQuota}
        initialHealthySlots={member.healthySlots}
        allowHealthySlots={mode === "weekly"}
        healthyAvailable={member.healthyAvailable}
        initialAllergens={member.allergens}
        showAllergens={mode === "default"}
        standingQuota={member.standingQuota}
        quotaEditable={member.quotaEditable}
        saveAction={mode === "weekly" ? saveWeeklyPlan : saveDefaultPlan}
        planLabel={mode === "weekly" ? "this week's plan" : "default plan"}
      />
      <MealStatusLegend showHealthy={member.healthyAvailable} />
    </div>
  );
}
