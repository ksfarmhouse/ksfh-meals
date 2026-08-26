# KSFH Meals

Internal meal sign-up site for the K-State FarmHouse fraternity. Built with
Next.js 16 (App Router), Prisma, and a Supabase Postgres database. Deploys to
Vercel; domain via GoDaddy.

All application state (members, meal sign-ups, weekly menu, attendance counts)
lives in Supabase Postgres. The Next.js app holds no persistent state — every
read and every mutation goes through the database, so deploys, redeploys, and
server restarts never alter user data.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript
- Tailwind CSS with brand CSS variables
- Prisma ORM → Supabase Postgres (pooled `DATABASE_URL` at runtime, direct
  `DIRECT_URL` for migrations)
- Zod for input validation
- HMAC-signed cookie session (Web Crypto) for admin auth

## Local development

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, ADMIN_PASSWORD, SESSION_SECRET (see below).

# 3. Push schema + seed (idempotent — safe to re-run)
npm run db:recover              # creates tables + placeholder Menu row

# 4. Run
npm run dev
```

The seed script never wipes existing rows — it inserts the singleton `Menu`
row only when one is not already present.

## Supabase setup

1. Create a project at https://supabase.com.
2. In the dashboard go to **Project Settings → Database → Connection string**.
3. Grab two strings:
   - **Transaction pooler** (port `6543`) → paste into `DATABASE_URL`. The
     runtime uses this; Supabase's pooler is required for serverless functions
     on Vercel.
   - **Direct connection** (port `5432`) → paste into `DIRECT_URL`. Prisma
     uses this for `prisma migrate` only.
4. Replace `<password>` in both strings with your DB password.
5. Run `npm run db:recover` against your dev `.env` once — that pushes the
   schema (creating the `Member` and `Menu` tables) and seeds the placeholder
   Menu row.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the GitHub repo.
3. Open the project's **Settings → Environment Variables** and add:
   - `DATABASE_URL` (Supabase pooled, port 6543)
   - `DIRECT_URL` (Supabase direct, port 5432)
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (≥ 32 chars; generate with `openssl rand -hex 32`)
4. Deploy.

`DATABASE_URL` and `DIRECT_URL` in production must point at a Supabase project
(it can be the same one used for development, or a separate prod project).
Either way, **all data lives in Supabase Postgres**, never in the Vercel
filesystem, so every redeploy preserves member and menu data.

The `build` script runs `prisma generate` first so the Prisma client is always
up to date on Vercel. Schema changes are applied with `npm run db:recover`
(which uses `prisma db push`); the guardrail inside the recover script keeps
that command from clobbering a populated database.

## DNS (GoDaddy → Vercel)

In Vercel, add the custom domain under **Settings → Domains** (e.g.
`ksfhmeals.com`), then in GoDaddy DNS:

| Type  | Name | Value                  |
| ----- | ---- | ---------------------- |
| A     | `@`  | `76.76.21.21`          |
| CNAME | `www`| `cname.vercel-dns.com` |

Delete any conflicting `@` records (e.g. GoDaddy's default parked-page A
record). Allow up to an hour for propagation.

## Project layout

```
app/
  _actions/          server actions (saveMenu, saveWeeklyPlan, ...)
  _lib/              prisma client, session helpers, meal constants
  admin/             admin pages (gated by middleware)
    login/
    roster/
  default-plan/
  files/
  find-id/
  plates/
  privacy/
  this-week/
  treasurer/
  layout.tsx
  page.tsx           public weekly-menu view
components/          Navbar, Footer, MealPlanTable, DayPicker, PlateCard, ...
prisma/
  schema.prisma
  seed.ts
  recover.ts         guarded re-init script for restored/recreated projects
middleware.ts        protects /admin/*
app/error.tsx        friendly error page for DB-unreachable / paused projects
```

## Supabase free-tier recovery

On the free Supabase plan the project **pauses** after ~7 days of inactivity and
is **deleted** after ~90 days. If the meal site sits unused over winter or
summer break, you'll see the friendly error page (defined in
`app/error.tsx`) the next time someone visits.

**If the project is just paused:**
1. Open the Supabase dashboard.
2. Click **Restore project**. Takes a minute.
3. Data (members, menu, sign-ups) is fully preserved. Done.

**If the project was deleted:**
1. Create a new Supabase project.
2. Copy the new `DATABASE_URL` and `DIRECT_URL` (see "Supabase setup" above).
3. Paste them into both your local `.env` *and* Vercel's environment variables.
4. From your laptop, run:
   ```bash
   npm run db:recover
   ```
   This pushes the schema and seeds the placeholder Menu row. It refuses to
   run if the database already has any `Member` rows — that's a guardrail
   against accidentally wiping a live database. To override (rare; only when
   you intentionally want to wipe), pass `--force`:
   ```bash
   npm run db:recover -- --force
   ```
5. Redeploy on Vercel (or just hit the site — it picks up new env vars on the
   next request).

The members and menu start blank after a recovery, which is expected: the
fraternity will rebuild the roster and menu when the semester starts.

## Admin

Visit `/admin/login`, enter the password from `ADMIN_PASSWORD`. On success a
signed `ksfh_admin` cookie (HMAC-SHA256, 7-day expiry) is set; `middleware.ts`
verifies it on every `/admin/*` request and redirects to the login page if it's
missing or invalid.

## Brand

Brand colors are defined as CSS variables in `app/globals.css` and exposed as
Tailwind colors `fh-green`, `fh-gold`, `fh-white`, `fh-light-green`. Page
titles use `.fh-page-title` (3px gold underline). Buttons use `.fh-btn` (green
→ gold on hover). Navbar uses `.fh-pill` / `.fh-pill-active`. Tables use
`.fh-table` (centered cells by default; add `fh-table-left` for the roster).

## Healthy (chicken) option

Members can have the main dish swapped for chicken at some of their meals. It's
a **swap, not a skip** — they're still at the meal, so it's independent of
In/Out/Early/Late (you can be Late *and* chicken) and it does **not** change
out-of-house billing at rollover.

Three `Member` fields drive it:

| Field | Meaning |
| --- | --- |
| `healthyQuota` | How many swaps this member gets **this week** (0–3). |
| `defaultHealthyQuota` | Their standing number. `rolloverMeals()` copies it into `healthyQuota` each week. |
| `healthySlots` | Which slots they've spent it on this week, as slot **indexes** (e.g. `[3, 7]`). |

**Currently in preview.** `HEALTHY_PREVIEW_IDS` in `app/_lib/meals.ts` limits the
whole feature to a list of member IDs while it's still being built out.
Everyone else sees no chicken controls, no legend entry, and the server pins
their quota and slots to 0 no matter what the browser posts. `/plates` shows
the chicken card only when someone actually has a swap flagged, so the house
sees no trace of it until it's in real use.

**To launch it to the whole house, set `HEALTHY_PREVIEW_IDS = null`.** That one
change re-enables everything; nothing else needs touching.

Eligible meals are **Mon, Tue and Thu dinner** (slots 1, 3, 7) —
`HEALTHY_SLOTS` in `app/_lib/meals.ts`. Wednesday is excluded, Friday dinner is
leftovers night, and lunches aren't plated with chicken, so the weekly max is 3.

Two independent deadlines, both enforced server-side in `app/_actions/plans.ts`
rather than by hiding controls in the browser:

- **How many** (`healthyQuota`) — `isQuotaEditable()` opens Saturday 00:00 and
  closes at the end of Sunday, house time. Mon–Fri the number is frozen.
  `saveDefaultPlan` deliberately stops copying the standing number into the
  current week once the window shuts, so saving a default plan mid-week can't
  be used to edit a locked number.
- **Which ones** (`healthySlots`) — `isDinnerChoiceLocked()` closes each dinner
  at **4:30pm on its own day** (`DINNER_CUTOFF_HOUR` / `_MINUTE`), when the cook
  needs that night's count. Nothing is locked on Sat/Sun, since that's the
  planning window for the week ahead.

Marking a dinner **Out** gives the swap back — you can't be served chicken at a
meal you aren't attending, so `normalizeHealthySlots()` drops the pick and the
count goes up. The exception is a dinner that has already passed: the cook
plated it hours ago, so the swap stays spent. `isDinnerChoiceLocked()` is
exactly that "already passed" test, which is why the same helper governs both.

Weekdays and clock are resolved in `America/Chicago` (`HOUSE_TIME_ZONE`) because
Vercel runs in UTC and a naive check would flip the window six hours early.

Monday the total is final — `/admin` shows it under the Weekly Menu save button,
and that's the figure handed to the chef before the week's shopping.

The count is set **only on `/this-week`** — `/default-plan` carries the meal
grid and allergies, nothing chicken-related.

It **resets to 0 every Saturday 00:00** house time. There's no scheduled job:
each stored count is tagged with `healthyWeekOf`, the date of its week's
Saturday, and `currentHealthy()` reads anything older as 0. That's equivalent
to a midnight cron, needs no infrastructure, and stays correct even if nobody
opens the site for a month. Because the tag owns the reset, `rolloverMeals()`
deliberately no longer touches the chicken fields — rollover timing can't
disturb them.

**`CHICKEN_LOCKS_ENABLED`** in `app/_lib/meals.ts` turns *both* deadlines off in
one line. That's the switch to flip for testing; set it back to `true` for
normal operation.

Where each piece lives:

- **Rules** — `app/_lib/meals.ts`: `HEALTHY_SLOTS`, `MAX_HEALTHY`,
  `isHealthyEligible`, `normalizeHealthySlots`, `healthyRemaining`. Both the
  editor and the server action call these, so they can't disagree.
- **Editing** — `/default-plan` sets only the standing *number* (which meals get
  swapped is decided day-of, so there's nothing per-slot to store). `/this-week`
  shows the number **and** a checkbox per eligible meal.
- **Enforcement** — `app/_actions/plans.ts` re-normalizes whatever the browser
  sent and rejects an over-quota save. The disabled checkboxes are convenience,
  not the gate.
- **Kitchen** — `/plates` shows a Chicken Dinner card plus a chicken-plate
  count on the Early Dinner set-for line. **Dinner only** — the kitchen only
  needs the count for the cooked dinner service, so lunch chicken flags are not
  surfaced there even though members can still set them.

> `healthySlots` is deliberately an index list rather than a parallel
> 12-length array. No array length is load-bearing, so adding the column needed
> no backfill — contrast the padding warning under *Change the meal slot layout*
> below.

## Allergens

Members enter free-text allergies / dietary restrictions on `/default-plan`
(`Member.allergens`, nullable). Blank is stored as `null` so it doesn't render;
values are trimmed and capped at 200 characters in `app/_actions/plans.ts`.

They appear in an **Allergens** panel pinned above the day picker on `/plates`,
listing every member who has entered something, sorted by name. It's
deliberately day-independent — the kitchen sees it on every visit, not only on
days that member happens to be eating.

Only `saveDefaultPlan` writes the field. `saveWeeklyPlan` accepts it for a
matching signature but ignores it, so saving on This Week can't wipe someone's
allergies.

> **`/plates` is public.** The allergen panel therefore puts a named medical
> detail on a page anyone can load, and any 4-digit ID can edit any member's
> entry. That's a deliberate call for kitchen visibility, not an oversight — but
> it's the thing to revisit first if the house ever wants this tightened.

## Extending the app

Common changes and where to make them:

### Add a new env var
1. Add it to `EnvSchema` in `app/_lib/env.ts` (required or optional).
2. Update `.env.example` with a placeholder.
3. Set it in Vercel's Environment Variables page.
4. Read it via `import { env } from "@/app/_lib/env"` — never via
   `process.env.X` directly. The validation throws at startup if a required
   var is missing or malformed, which is much friendlier than a cryptic
   runtime crash.

### Add a new admin bulk action (like Rollover / Reset / Promote)
1. Add the server action to `app/_actions/bulk.ts` (mirror an existing one).
   Wrap mutations in `prisma.$transaction(...)` so partial failures don't
   strand data.
2. Add an entry to the `ACTIONS` array in `app/admin/BulkActions.tsx` with
   label, description, and confirmation prompt.
3. That's it — the UI auto-renders the new card.

### Add a new member field
1. Add it to `model Member` in `prisma/schema.prisma`.
2. Run `npm run db:recover` locally against your dev database. The guardrail
   will refuse if rows exist; pass `-- --force` to override (this is
   `prisma db push`, which can rewrite columns).
3. Update `app/_actions/roster.ts`: `NewMemberSchema` (for input validation
   on Add Member) and the `RosterRow`/`AddedMember` types.
4. Update `app/admin/roster/RosterManager.tsx` so the new field is editable
   in the Add Member form and shown in the roster table.

### Change the meal slot layout (e.g. add a Sunday dinner)
This one is the riskiest — the 12-slot layout is referenced in many places.
Steps if you ever need to:
1. Update the slot table comment + `SLOT_COUNT` in `app/_lib/meals.ts`.
2. Update `LUNCH_SLOTS` / `DINNER_SLOTS` so the rollover billing buckets
   are still right.
3. Update `MealPlanTable.tsx` to render the new slot, and the public menu
   page in `app/page.tsx` (the Sat/Sun table) plus `app/admin/MenuForm.tsx`.
4. Run a one-shot script that pads each member's `weeklyPlan` and
   `defaultPlan` arrays to the new length before deploying — otherwise
   every page that reads `plan[newIndex]` will get `undefined`.
5. Revisit `HEALTHY_SLOTS` / `MAX_HEALTHY` in `app/_lib/meals.ts` — they name
   slot indexes too, and `MAX_HEALTHY` is the cap the editor and
   `app/_actions/plans.ts` validate against.

### Add a new page
1. Create `app/<slug>/page.tsx`. Server Component by default; add
   `"use client"` only for things that need local state.
2. Add a `<Link>` to `LINKS` in `components/Navbar.tsx`.
3. If it should be public, no other changes. If it should be admin-gated,
   put it under `app/admin/...` — `middleware.ts` already protects that
   path.

## CI

`.github/workflows/ci.yml` runs `prisma generate`, `tsc --noEmit`, and
`npm run build` on every push and PR to `main` / `dev`. Lets you catch
broken commits before Vercel sees them.
