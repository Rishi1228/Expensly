# PROGRESS — Personal Finance Manager

> Phase details live in [PLAN.md](PLAN.md). Update this file at the start and end of each phase.

Legend: ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

## Status Overview

| Phase | Name                   | Status | Started    | Completed  |
| ----- | ---------------------- | ------ | ---------- | ---------- |
| 0     | Project Setup          | ✅     | 2026-10-28 | 2026-10-28 |
| 1     | Database & Auth        | ✅     | 2026-10-28 | 2026-10-28 |
| 2     | Expense & Category API | ✅     | 2026-10-28 | 2026-10-28 |
| 3     | Frontend Core          | ✅     | 2026-10-28 | 2026-10-28 |
| 4     | Analytics Dashboard    | ✅     | 2026-10-28 | 2026-10-28 |
| 5     | Recurring Bills        | ✅     | 2026-10-28 | 2026-10-28 |
| 6     | Polish & Responsive QA | ⬜     | —          | —          |
| 7     | Testing & Deployment   | ⬜     | —          | —          |

## Changelog

- **2026-10-28**: Phase 7: tests (server 39 unit + 42 DB, client 23 component/unit), GitHub Actions CI, final README with Vercel steps. Only the Vercel deploy itself is left (done from the Vercel dashboard).

- **2026-10-28**: Phase 6 done. Dark mode, error states, dialog focus handling, forgot/reset/change password, custom categories page, per-page code splitting. Renamed to Expensly. Vercel setup added; code pushed to github.com/Rishi1228/Expensly.

- **2026-10-28**: Phase 5 done. Recurring bills: SQL job on pg_cron (daily 12:05 UTC) + catch-up when the app opens, API, and a Recurring page. `e2e-recurring` script: 40/40, including "due today → exactly one expense, rerun → no duplicate". Checked in Chrome on desktop.
- **2026-10-28**: Phase 4 done. Stats SQL functions + API (35/35 checks vs hand-computed numbers) and a new dashboard (tiles, trend chart, category breakdown with drill-down). Checked in Chrome on desktop and phone.
- **2026-10-28**: Phase 3 done. Login/signup, responsive layout, add/edit/delete expenses, filtered list. Tested in Chrome on desktop and at 390px phone width.
- **2026-10-28**: Migrations 001–004 applied to Supabase. End-to-end test: 31/31 passed (CRUD, filters, validation, user isolation, custom categories). Phases 0–2 done.
- **2026-10-28**: Env files consolidated: `server/.env` (URL, anon, service-role, pooler `DATABASE_URL`), `client/.env` (URL, publishable key). Root `.env` removed.
- **2026-10-28**: Phases 0–2 code written. Waiting on a Supabase project to apply migrations and test against the real database.
- **2026-10-28**: Created PROMPT.md, PLAN.md and PROGRESS.md. Stack confirmed: React + Express + Supabase Postgres, multi-user, recurring bills auto-log.

---

## Phase 0 — Project Setup

- [x] git init, .gitignore, README
- [x] Scaffold client (Vite React + Tailwind v4) and server (Express 5)
- [x] Supabase project + .env files (`server/.env`, `client/.env`)
- [x] ESLint + Prettier

**Notes / Decisions:** npm workspaces (`client`, `server`). Root `npm run dev` runs both apps via `concurrently`. Vite proxies `/api` to `:5000`. Verified: build passes, lint is clean, client → `/api/health` works.
**Blockers:** —

## Phase 1 — Database & Auth

- [x] Tables + indexes migration: `supabase/migrations/20261028000001_schema.sql`
- [x] RLS policies: `..._rls.sql`
- [x] Seed default categories: `..._seed_categories.sql` (14 categories, 46 subcategories)
- [x] Profile-on-signup trigger
- [x] Email auth enabled · [ ] Google auth (optional; off in the Supabase dashboard)
- [x] Express JWT middleware: `server/src/middleware/auth.js` (uses `auth.getClaims`)
- [x] Migrations applied to Supabase + RLS isolation check
- [x] `..._fk_no_action.sql`: category FKs → NO ACTION so deleting an account always cascades cleanly

**Notes / Decisions:** The API uses a per-request Supabase client carrying the user's token, so RLS applies to every API query. The service-role key is only for background jobs. A DB trigger makes sure a category/subcategory pair is valid and visible to the user. `unique(recurring_id, expense_date)` blocks duplicate auto-logs.
**Blockers:** —

**How to apply migrations:** the direct DB host is IPv6-only and can't be reached from this network, so `DATABASE_URL` uses the IPv4 session pooler (`aws-0-eu-west-1`, password URL-encoded). Run `npx supabase db push --db-url "<DATABASE_URL>"`.

## Phase 2 — Expense & Category API

- [x] Expense CRUD + validation (Zod v4)
- [x] Filters + pagination (from, to, category, subcategory, search, page, limit)
- [x] Category / subcategory routes (list with nested subs, add custom, delete custom)
- [x] Error handler (Supabase error codes → 400/404/409; JSON 400s; clean 500s)
- [x] End-to-end test against the real DB: 31/31 passed

**Notes / Decisions:** Tested without a DB: health 200, missing/bad token 401, bad JSON 400, unknown route 404, schema validation (amount rounding, empty description → null, date range check).
**Blockers:** —

## Phase 3 — Frontend Core

- [x] Auth pages + protected routes (`AuthPage`, `RouteGuards`). Signup shows "check your inbox" when email confirmation is on. The Google button is hidden behind `VITE_ENABLE_GOOGLE`
- [x] Responsive layout shell (`AppLayout`): sidebar on desktop; header + bottom nav with a center **+** on phones
- [x] Add/Edit expense form (`ExpenseForm`): amount, category grid → subcategory chips, Today/Yesterday shortcuts, description; two-tap delete
- [x] Expenses list (`ExpensesPage`): grouped by day with day totals, search (debounced), period presets + custom range, category filter, Load more
- [x] TanStack Query hooks (`useExpenses`, `useCategories`) + sonner toasts; the cache is cleared on sign-out
- [x] Interim Dashboard (greeting + 5 recent) and Profile (name, email, currency, sign out); Recurring placeholder

**Notes / Decisions:** One shared add/edit dialog, opened from anywhere (`useExpenseDialog`). It's a bottom sheet on phones and a centered dialog on desktop. The API client attaches the Supabase token automatically.
**Browser test (Chrome, test user, deleted afterwards):** login → redirect back to the page you asked for ✓, empty-form validation ✓, add with subcategory ✓, edit amount ✓, delete ✓, category filter + search ✓, phone layout + bottom sheet ✓, sign out → protected page redirects to login ✓, no console errors ✓. Fixed: the header "Add expense" button was showing on phones.
**Follow-ups (Phase 6):** the bundle is ~1 MB / 310 kB gzip after Recharts, so lazy-load per route; dark mode toggle; forgot-password flow; a UI to manage custom categories (the API already supports it).
**Blockers:** —

## Phase 4 — Analytics Dashboard

- [x] SQL functions (`..._stats_functions.sql`): `spend_total`, `spend_by_category`, `spend_by_subcategory`, `spend_trend` (fills empty days/months with 0). SECURITY INVOKER, so RLS applies; `anon` can't call them
- [x] Stats API: `/api/stats/summary`, `/by-category`, `/by-subcategory`, `/trend`. The client sends its local `today` so day boundaries follow the user's timezone
- [x] Summary tiles: Spent, Change vs previous period (icon + label, rose = spent more), Avg per day (only days elapsed), Top category
- [x] Category breakdown with drill-down into subcategories + "View expenses" link (opens the Expenses page pre-filtered via `?category=&period=`)
- [x] Trend chart (Recharts): daily bars for ranges ≤ 92 days, monthly otherwise; hover tooltip; screen-reader table
- [x] Recent expenses + period chips (This month / Last month / Last 3 months / This year / All time)

**Notes / Decisions:**

- **Donut → ranked bar list.** With 14 categories a donut can't give each slice a color you can tell apart (the chart guidance caps distinct colors at about 8). A single-hue bar list sorted by amount, with share %, reads faster and drills down the same way. The category icons keep their own colors for identity.
- "Previous period": whole calendar months shift by the same number of months (Oct → Sep, Aug–Oct → May–Jul, 2026 → 2025); other ranges shift back by their length in days. Change % is blank when the previous period has no spend.
- Bar color `#6366f1` validated against white and slate-900 surfaces (contrast, lightness, chroma).
- **Tested:** `e2e-stats` script: 35/35 (totals, change %, avg/day, shares, subcategory split incl. "Unspecified", daily/monthly buckets, future-dated expense, validation 400s, user isolation, anon blocked). Browser check with ~120 seeded expenses: tiles, tooltip, drill-down, filtered link, monthly view, 390px layout, no console errors. Fixed: tooltip text was invisible (it inherited the grid color); period-chip scrollbar hidden.
  **Blockers:** —

## Phase 5 — Recurring Bills

- [x] Migration `..._recurring_job.sql`: `next_occurrence()` (monthly/yearly dates always counted from `start_date`, so 31 Jan → 28 Feb → 31 Mar), `log_due_recurring()` (job; catches up missed dates; `ON CONFLICT DO NOTHING` + `FOR UPDATE SKIP LOCKED`), `log_my_due_recurring(today)` (signed-in user only, local date must be within ±1 day of UTC)
- [x] pg_cron job `log-due-recurring` at `5 12 * * *`. At 12:05 UTC the date has started everywhere (UTC-12…+14), so bills are never logged early
- [x] API `/api/recurring`: list, create, update, delete, `POST /run`. Mutations take `?today=` (client's local date). Create/resume/schedule change sets `next_due_date` to the first date on/after today, then logs anything due today
- [x] UI: Recurring page (per-month estimate, next bill, active/paused lists, pause/resume button, add/edit/delete dialog). `CategoryPicker` pulled out of `ExpenseForm` and shared
- [x] App load calls `/recurring/run` once, so IST users see bills in the morning, not after the 17:35 IST server run
- [x] "Recurring" badge in the expense list (already in place from Phase 3)
- [ ] ~~node-cron fallback~~: not needed, pg_cron is available

**Notes / Decisions:**

- Resuming a paused bill doesn't back-fill the paused weeks; it restarts from today. A start date in the past doesn't back-fill either.
- Deleting a bill keeps the expenses it already logged (`recurring_id` → null). Deleting one logged expense doesn't make the job re-create it.
- Editing only amount/description/category keeps the schedule; the form only sends `frequency`/`start_date` when they change.
- `log_due_recurring` is callable only by `service_role` (and cron); users get `log_my_due_recurring`.
- **Tested:** `e2e-recurring` script 40/40 (validation, due-today logs once, rerun + forced rerun → no duplicate, future/past start, 3-week catch-up with correct dates, pause skipped by job, resume without back-fill, schedule edits, user isolation, function permissions, delete keeps expenses). Browser (desktop): on-load catch-up logged a bill due yesterday with toast, add bill due today, resume paused bill, monthly estimate, badges in Expenses, no console errors. Phone-width check not done this time (window resize didn't apply); do it in Phase 6 QA.
  **Blockers:** —

## Phase 6 — Polish & Responsive QA

- [x] Dark mode: Light / Dark / System (Profile) + quick toggle in the header/sidebar. Saved per browser; `index.html` applies it before first paint. Toasts follow the theme
- [x] Loading / empty / error states: inline "Try again" on dashboard cards and Profile; error boundary around each page (resets on navigation) and the whole app
- [x] Quick-add: center **+** in the phone bottom nav (always visible), "Add expense" in the desktop sidebar
- [x] Accessibility: dialogs move focus in, keep Tab inside, and return focus on close; "Skip to content" link; radio/pressed roles on chip pickers; labelled icon buttons
- [x] Profile: account details, theme, Manage categories, Change password, sign out
- [x] Forgot password (`/forgot-password`) → email link → `/reset-password`
- [x] Categories page (`/categories`): add custom categories (name, icon, color), add/remove subcategories, delete custom categories (blocked with a clear message if in use)
- [x] Code splitting: each page is its own chunk. First load ≈ 200 kB gzip (was 313 kB); the chart library (107 kB) loads only with the dashboard

**Notes / Decisions:** App name is now **Expensly** (matches the repo). Vercel: `api/index.js` exports the Express app; `vercel.json` routes `/api/*` to it and everything else to the SPA.
**Tested (Chrome):** dark + light on all pages, forgot-password page, Profile theme switch, create category with icon/color, add subcategory, recurring catch-up on login. Phone width checked with 390px frames (window resize doesn't work in this browser): Recurring, Categories, Dashboard, Expenses, in light and dark. Fixed: bill rows cut off the next due date on phones (now shown first); "1 subcategories". No console errors.
**Blockers:** —

## Phase 7 — Testing & Deployment

- [x] API tests (Vitest + supertest). `npm test`: 39 unit tests (dates, schemas, auth/JSON/404 handling, error mapping), no DB needed. `npm run test:db`: 42 tests against real Supabase (expenses, filters, custom categories, stats numbers, recurring job incl. "due today logs once, rerun adds none", user isolation, SQL function permissions)
- [x] Component tests (Vitest + Testing Library, 23): ExpenseForm (validation, create body, two-tap delete), RecurringForm (create body, edit sends schedule only when changed), CategoryPicker, Modal focus trap, theme, date/money formatting
- [x] CI: `.github/workflows/ci.yml` runs lint, `npm test`, build on push/PR
- [x] Vercel setup: `api/index.js` + `vercel.json`; checked locally that the function entry serves `/api/*`. Linux native build packages confirmed in the lockfile
- [ ] Deploy on Vercel: steps in README ("Deploy to Vercel"). Needs the user's Vercel account
- [x] Final README

**Notes / Decisions:** The service-role key isn't used by the API at all, so it is left out of Vercel (only DB tests use it). DB tests create temporary users and delete them after.
**Blockers:** Deploy waits on the user importing the repo in Vercel.
