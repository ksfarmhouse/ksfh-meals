// Shared constants and helpers for the 12-slot meal plan model.
//
// The fraternity serves 12 meals a week: lunch + dinner Mon–Fri, and lunch
// only on Sat/Sun. We store each member's plan as a single Int[] of length
// 12 in this fixed order:
//
//     index  meal             index  meal
//     ─────  ────────────     ─────  ────────────
//       0    Mon Lunch          6    Thu Lunch
//       1    Mon Dinner         7    Thu Dinner
//       2    Tue Lunch          8    Fri Lunch
//       3    Tue Dinner         9    Fri Dinner
//       4    Wed Lunch         10    Sat Lunch
//       5    Wed Dinner        11    Sun Lunch
//
// Each slot value is one of: 0=In, 1=Out, 2=Early, 3=Late.
//
// LUNCH_SLOTS / DINNER_SLOTS below let other code (rollover billing, plate
// counts) iterate just the relevant slots without recomputing the layout.
//
// Separately from that value, a member can flag a meal for the HEALTHY
// (chicken) option — chicken replaces the main dish at a meal they're still
// attending. It's a swap, not a skip, so it's independent of In/Out/Early/Late
// (you can be Late *and* chicken) and doesn't change out-of-house billing.
// Each member gets a weekly allowance (healthyQuota) and spends it on
// individual slots day-of; see HEALTHY_SLOTS below for which meals qualify.
// The allowance itself is set on Sunday and read-only the rest of the week
// (isQuotaEditable).

export const SLOT_COUNT = 12;

export const MEAL_VALUES = {
  In: 0,
  Out: 1,
  Early: 2,
  Late: 3,
} as const;

export const MEAL_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "In" },
  { value: 1, label: "Out" },
  { value: 2, label: "Early" },
  { value: 3, label: "Late" },
];

// Day labels for table headers and the plates day picker.
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const DAY_PICKER = ["M", "T", "W", "TH", "F", "SA", "SU"] as const;

// Slot indexes
export const LUNCH_SLOTS = [0, 2, 4, 6, 8, 10, 11] as const; // Mon..Sun
export const DINNER_SLOTS = [1, 3, 5, 7, 9] as const;        // Mon..Fri

// Day-index (0=Mon..6=Sun) → slot indexes
export function lunchSlotForDay(dayIdx: number): number {
  return LUNCH_SLOTS[dayIdx];
}
export function dinnerSlotForDay(dayIdx: number): number | null {
  return dayIdx < 5 ? DINNER_SLOTS[dayIdx] : null;
}

// Meals eligible for the healthy (chicken) swap: every weekday meal EXCEPT
// Friday dinner (slot 9), which is leftovers night. Sat/Sun lunch (10, 11)
// aren't weekday meals. That leaves exactly 9 slots — hence the weekly max.
export const HEALTHY_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export const MAX_HEALTHY = HEALTHY_SLOTS.length; // 9

export function isHealthyEligible(slot: number): boolean {
  return (HEALTHY_SLOTS as readonly number[]).includes(slot);
}

// Cleans up a set of healthy-flagged slots so the client editor and the server
// action can't disagree about what's allowed. Drops ineligible slots,
// duplicates, and any slot marked Out (you can't swap a meal you aren't
// eating), sorts them, then trims to the quota (keeping the earliest meals).
export function normalizeHealthySlots(
  slots: number[],
  plan: number[],
  quota: number,
): number[] {
  const cleaned = Array.from(new Set(slots))
    .filter((s) => isHealthyEligible(s) && plan[s] !== MEAL_VALUES.Out)
    .sort((a, b) => a - b);
  const cap = Math.max(0, Math.min(quota, MAX_HEALTHY));
  return cleaned.slice(0, cap);
}

// How many swaps the member has left to spend this week.
export function healthyRemaining(quota: number, slots: number[]): number {
  return Math.max(0, Math.min(quota, MAX_HEALTHY) - slots.length);
}

// The house is in Kansas; Vercel runs in UTC. Resolving the weekday in the
// house's own zone means the Sunday window opens and closes at local
// midnight rather than six hours off.
export const HOUSE_TIME_ZONE = "America/Chicago";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function houseDayOfWeek(now: Date = new Date()): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: HOUSE_TIME_ZONE,
    weekday: "short",
  }).format(now);
  return (WEEKDAY_NAMES as readonly string[]).indexOf(label);
}

// The chicken number is recorded on Sunday: whatever it says at the end of
// Sunday is the allowance for the coming week, which is what the kitchen
// shops against. Mon–Sat it's read-only — members can still SPEND it on
// individual meals, they just can't change how many they get.
export function isQuotaEditable(now: Date = new Date()): boolean {
  return houseDayOfWeek(now) === 0; // Sunday
}

export function emptyPlan(fillValue: number): number[] {
  return Array.from({ length: SLOT_COUNT }, () => fillValue);
}

export function defaultPlanForStatus(status: string): number[] {
  // InHouse / NewMember default to all In (0); everyone else all Out (1).
  return status === "InHouse" || status === "NewMember"
    ? emptyPlan(MEAL_VALUES.In)
    : emptyPlan(MEAL_VALUES.Out);
}

export function isActiveStatus(status: string): boolean {
  return status === "InHouse" || status === "NewMember";
}

export function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
