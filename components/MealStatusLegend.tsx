// Reference card explaining what In / Out / Early / Late mean.
// Shown under the meal-plan editor on /this-week and /default-plan.

export function MealStatusLegend() {
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
      </ul>
    </div>
  );
}
