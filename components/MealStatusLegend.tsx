// Reference card explaining what In / Out / Early / Late mean, plus the rules
// for the healthy (chicken) option.
// Shown under the meal-plan editor on /this-week and /default-plan.

interface Props {
  // Hidden while the chicken option is limited to HEALTHY_PREVIEW_IDS, so the
  // legend doesn't describe something the reader has no controls for.
  showHealthy: boolean;
}

export function MealStatusLegend({ showHealthy }: Props) {
  return (
    <div className="mt-6 p-4 bg-fh-white border-2 border-fh-green rounded">
      <ul className="text-sm space-y-1">
        <li>
          <strong>In</strong> — at the meal
        </li>
        <li>
          <strong>Out</strong> — not attending
        </li>
        <li>
          <strong>Early</strong> — early plate
        </li>
        <li>
          <strong>Late</strong> — late plate
        </li>
        {showHealthy && (
        <li>
          <strong>chicken</strong> — swaps the main dish for chicken at{" "}
          <strong>dinner</strong>. You&rsquo;re still at the meal, so it works
          with Early and Late too. Pick how many you want each week (up to 4),
          then tick the dinners you want on the day. Mon&ndash;Thu dinner only:
          Friday is leftovers, and lunches aren&rsquo;t eligible. You set your
          number <strong>Saturday and Sunday</strong>; it&rsquo;s fixed
          Mon&ndash;Fri, though you can still choose which dinners to spend it
          on any day.
        </li>
        )}
      </ul>
    </div>
  );
}
