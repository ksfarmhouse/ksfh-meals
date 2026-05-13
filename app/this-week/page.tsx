// /this-week — member edits their current-week meal plan.
// Uses the shared PlanEditor with mode="weekly".

import { PlanEditor } from "@/components/PlanEditor";

export default function ThisWeekPage() {
  return (
    <div>
      <h1 className="fh-page-title">This Week</h1>
      <p className="mb-4 text-sm">
        Enter your ID to edit your meal plan for the current week.
      </p>
      <PlanEditor mode="weekly" />
    </div>
  );
}
