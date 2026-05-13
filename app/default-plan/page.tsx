// /default-plan — member edits their permanent default plan.
// Saving here also resets the current week to match (see saveDefaultPlan).

import { PlanEditor } from "@/components/PlanEditor";

export default function DefaultPlanPage() {
  return (
    <div>
      <h1 className="fh-page-title">Default Plan</h1>
      <p className="mb-4 text-sm">
        Edit your permanent default meal plan. Saving also resets the current
        week to match this default.
      </p>
      <PlanEditor mode="default" />
    </div>
  );
}
