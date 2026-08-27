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
//
// Two independent deadlines govern it, both in the CHICKEN RULES section below:
//   HOW MANY  (healthyQuota)  — set over the weekend, fixed Mon–Fri.
//   WHICH ONES (healthySlots) — each dinner locks at 4:30pm on its own day.
// The count itself resets to 0 every Saturday 00:00 — see chickenWeekOf().
// Both are off when CHICKEN_LOCKS_ENABLED is false, which is the switch to
// flip for testing.

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

// Meals eligible for the healthy (chicken) swap: DINNERS ONLY, and not every
// one of them. Wednesday is off the list, Friday dinner is leftovers night,
// and lunches are out because the kitchen only plates chicken at the cooked
// dinner service. That leaves exactly 3 slots — hence the weekly max.
export const HEALTHY_SLOTS = [1, 3, 7] as const; // Mon / Tue / Thu dinner
export const MAX_HEALTHY = HEALTHY_SLOTS.length; // 3

export function isHealthyEligible(slot: number): boolean {
  return (HEALTHY_SLOTS as readonly number[]).includes(slot);
}

// Cleans up a set of healthy-flagged slots so the client editor and the server
// action can't disagree about what's allowed. Drops ineligible slots and
// duplicates, sorts them, then trims to the quota (keeping the earliest
// meals).
//
// Marking a dinner Out gives the swap back — you can't be served chicken at a
// meal you're not attending. The exception is a dinner that has already passed
// for the week: the cook plated that chicken hours ago, so the swap is spent
// and dropping to Out afterwards refunds nothing. isDinnerChoiceLocked is
// exactly that "already passed" test, so a locked pick survives either way.
export function normalizeHealthySlots(
  slots: number[],
  plan: number[],
  quota: number,
  now: Date = new Date(),
): number[] {
  const cleaned = Array.from(new Set(slots))
    .filter(
      (s) =>
        isHealthyEligible(s) &&
        (plan[s] !== MEAL_VALUES.Out || isDinnerChoiceLocked(s, now)),
    )
    .sort((a, b) => a - b);
  const cap = Math.max(0, Math.min(quota, MAX_HEALTHY));
  return cleaned.slice(0, cap);
}

// How many swaps the member has left to spend this week.
export function healthyRemaining(quota: number, slots: number[]): number {
  return Math.max(0, Math.min(quota, MAX_HEALTHY) - slots.length);
}

// Taking the FULL allowance leaves nothing to choose, so every eligible dinner
// gets ticked automatically. This lives here rather than in the browser so it
// holds no matter where the number came from — This Week, Default Plan, or the
// weekly rollover. Dinners the member marked Out are still skipped.
export function healthySlotsForQuota(
  quota: number,
  slots: number[],
  plan: number[],
): number[] {
  const wanted = quota >= MAX_HEALTHY ? [...HEALTHY_SLOTS] : slots;
  return normalizeHealthySlots(wanted, plan, quota);
}

// ===== CHICKEN RULES =========================================================
// The two switches below are the only things to change when the house wants
// different behavior. Everything else follows from them.

// TESTING SWITCH. true = deadlines enforced (normal operation, and the
//                 current setting).
//                 false = nothing is ever locked, so the whole flow can be
//                 exercised on any day at any time. Also disables the
//                 no-refund-after-a-dinner-has-passed rule, since with no
//                 deadlines nothing counts as passed.
export const CHICKEN_LOCKS_ENABLED = true;

// Who can see the chicken option. null = the whole house, which is the live
// setting. Put member IDs here to close it back down to a preview.
export const HEALTHY_PREVIEW_IDS: readonly string[] | null = null;

export function healthyAvailableFor(memberId: string): boolean {
  return HEALTHY_PREVIEW_IDS === null || HEALTHY_PREVIEW_IDS.includes(memberId);
}

// The house is in Kansas; Vercel runs in UTC. Resolving the clock in the
// house's own zone means the weekend window and the 4:30pm cutoffs land on
// local time rather than six hours off.
export const HOUSE_TIME_ZONE = "America/Chicago";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// House-local weekday and clock, read in one pass so both can't disagree
// across a midnight boundary. Weekday is JS-style: 0=Sun … 6=Sat.
function houseNow(now: Date): {
  day: number;
  hour: number;
  minute: number;
  year: number;
  month: number;
  date: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: HOUSE_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: (WEEKDAY_NAMES as readonly string[]).indexOf(get("weekday")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    year: Number(get("year")),
    month: Number(get("month")),
    date: Number(get("day")),
  };
}

export function houseDayOfWeek(now: Date = new Date()): number {
  return houseNow(now).day;
}

// --- Deadline 1: HOW MANY -----------------------------------------------
// The number is set over the WEEKEND — the window opens Saturday 00:00 and
// closes at the end of Sunday, house time. Monday the total is final: that's
// the figure handed to the chef, and the house shops that day. Mon–Fri the
// number is frozen, though members can still SPEND it on individual dinners.
const QUOTA_EDIT_DAYS = [6, 0]; // Saturday, Sunday

export function isQuotaEditable(now: Date = new Date()): boolean {
  if (!CHICKEN_LOCKS_ENABLED) return true;
  return QUOTA_EDIT_DAYS.includes(houseNow(now).day);
}

// --- The weekly reset -----------------------------------------------------
// Everyone's count drops back to 0 every Saturday at 00:00 house time, and
// they set it again for the week ahead.
//
// There's no scheduled job on this app, so instead of writing zeros to 79 rows
// at midnight, each stored count is TAGGED with the week it belongs to. A tag
// from an earlier week reads as 0. That's equivalent, needs no cron, and stays
// correct even if nobody opens the site for a month.
//
// The tag is the date of that week's Saturday, e.g. "2026-08-22".
export function chickenWeekOf(now: Date = new Date()): string {
  const { day, year, month, date } = houseNow(now);
  const sinceSaturday = (day + 1) % 7; // Sat->0, Sun->1, … Fri->6
  // Date-only arithmetic in UTC: no clock component, so DST can't shift it.
  const saturday = new Date(Date.UTC(year, month - 1, date));
  saturday.setUTCDate(saturday.getUTCDate() - sinceSaturday);
  return saturday.toISOString().slice(0, 10);
}

// A member's count and picks as they stand right now — zeroed if what's
// stored belongs to a week that has already rolled over.
export function currentHealthy(
  stored: { healthyQuota: number; healthySlots: number[]; healthyWeekOf: string | null },
  now: Date = new Date(),
): { quota: number; slots: number[] } {
  return stored.healthyWeekOf === chickenWeekOf(now)
    ? { quota: stored.healthyQuota, slots: stored.healthySlots }
    : { quota: 0, slots: [] };
}

// --- Deadline 2: WHICH ONES ---------------------------------------------
// Each eligible dinner locks at 4:30pm on its own day, when the cook needs
// the count for that night's service. Monday's choice locks Monday at 4:30;
// Tuesday's and Thursday's lock on their own days. Later dinners stay open.
export const DINNER_CUTOFF_HOUR = 16;
export const DINNER_CUTOFF_MINUTE = 30;

// Slot index -> meal-week day (0=Mon … 6=Sun), the layout at the top of this
// file. Note this differs from houseNow().day, which is JS-style (0=Sun).
function mealDayForSlot(slot: number): number {
  const lunch = (LUNCH_SLOTS as readonly number[]).indexOf(slot);
  if (lunch !== -1) return lunch;
  return (DINNER_SLOTS as readonly number[]).indexOf(slot);
}

export function isDinnerChoiceLocked(slot: number, now: Date = new Date()): boolean {
  if (!CHICKEN_LOCKS_ENABLED) return false;

  const { day, hour, minute } = houseNow(now);
  // Sat/Sun is the planning window for the week AHEAD, so nothing is locked
  // then — otherwise every weekday dinner would look shut on the very days
  // members are meant to be choosing them.
  if (QUOTA_EDIT_DAYS.includes(day)) return false;

  const today = (day + 6) % 7; // JS weekday -> meal-week day (Mon = 0)
  const mealDay = mealDayForSlot(slot);
  if (mealDay < today) return true; // that dinner already happened
  if (mealDay > today) return false; // still ahead of us
  return (
    hour > DINNER_CUTOFF_HOUR ||
    (hour === DINNER_CUTOFF_HOUR && minute >= DINNER_CUTOFF_MINUTE)
  );
}

// Every eligible dinner still open for changes right now.
export function openHealthySlots(now: Date = new Date()): number[] {
  return HEALTHY_SLOTS.filter((slot) => !isDinnerChoiceLocked(slot, now));
}

export function emptyPlan(fillValue: number): number[] {
  return Array.from({ length: SLOT_COUNT }, () => fillValue);
}

export function defaultPlanForStatus(status: string): number[] {
  // InHouse / NewMember default to all In (0); everyone else all Out (1).
  return isActiveStatus(status)
    ? emptyPlan(MEAL_VALUES.In)
    : emptyPlan(MEAL_VALUES.Out);
}

export function isActiveStatus(status: string): boolean {
  return status === "InHouse" || status === "NewMember";
}

export function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
