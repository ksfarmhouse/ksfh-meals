# KSFH Meals

Internal meal sign-up site for the K-State FarmHouse fraternity. Built with
Next.js 15 (App Router), Prisma, and a Supabase Postgres database. Deploys to
Vercel; domain via GoDaddy.

All application state (members, meal sign-ups, weekly menu, attendance counts)
lives in Supabase Postgres. The Next.js app holds no persistent state — every
read and every mutation goes through the database, so deploys, redeploys, and
server restarts never alter user data.

## Stack

- Next.js 15 (App Router, Server Components, Server Actions)
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

# 3. Migrate + seed
npx prisma migrate dev          # creates tables in Supabase
npx prisma db seed              # inserts the placeholder Menu row (idempotent)

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
5. Run `npx prisma migrate dev` against your dev `.env` once — that creates the
   `Member` and `Menu` tables in Supabase.

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
up to date on Vercel. Migrations are not run automatically on deploy — apply
them locally with `npx prisma migrate deploy` against the prod connection
string when schema changes ship.

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
`.fh-table`.
