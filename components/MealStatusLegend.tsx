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
          <strong>chicken</strong> — swaps the main dish for chicken at
          dinner. You&rsquo;re still at the meal, so it works with Early and
          Late too. <strong>Mon, Tue and Thu dinners only</strong> (up to 3):
          Wednesday and Friday are out, and so are lunches. Two deadlines —
          you change <em>how many</em> on{" "}
          <strong>Saturday or Sunday</strong> only, and each dinner&rsquo;s tick
          box closes at <strong>4:30pm that day</strong>, when the cook needs
          the count.
        </li>
        )}
      </ul>
    </div>
  );
}
