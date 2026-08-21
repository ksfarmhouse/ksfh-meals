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
          <strong>chicken</strong> — swaps the main dish for chicken. You&rsquo;re
          still at the meal, so it works with Early and Late too. Pick how many
          you want each week (up to 9), then tick the meals you want on the day.
          Friday dinner is leftovers, so it and the weekends aren&rsquo;t
          eligible. Your number is recorded <strong>Sunday</strong> and is
          fixed for the rest of the week — you can still choose which meals to
          spend it on any day.
        </li>
        )}
      </ul>
    </div>
  );
}
