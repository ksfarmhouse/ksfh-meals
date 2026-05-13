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

export const SLOT_COUNT = 12;
export const LUNCH_COUNT = 7;
export const DINNER_COUNT = 5;

export const MEAL_VALUES = {
  In: 0,
  Out: 1,
  Early: 2,
  Late: 3,
} as const;

export const MEAL_LABEL: Record<number, "In" | "Out" | "Early" | "Late"> = {
  0: "In",
  1: "Out",
  2: "Early",
  3: "Late",
};

export const MEAL_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "In" },
  { value: 1, label: "Out" },
  { value: 2, label: "Early" },
  { value: 3, label: "Late" },
];

// Day labels for the plates page and table headers.
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
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
