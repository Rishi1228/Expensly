# Expensly

A multi-user expense tracker: log every daily expense by category, set up recurring bills that log themselves, and see where your money goes.

**Stack:** React 19 (Vite, Tailwind v4, TanStack Query, Recharts) · Express 5 · Supabase (Postgres with row-level security, Auth, `pg_cron`)
**Docs:** [PROMPT.md](PROMPT.md) (spec) · [PLAN.md](PLAN.md) (phases) · [PROGRESS.md](PROGRESS.md) (status and decisions)

## Features

- **Expenses:** amount, category (14 built-in), optional subcategory, description, date. Search, filter by period and category, grouped by day.
- **Dashboard:** spent, change vs the previous period, average per day, top category, a daily/monthly trend chart, and a category breakdown you can drill into.
- **Recurring bills:** weekly / monthly / yearly bills (rent, Netflix, house-help wage) are logged automatically on each due date. Pause, resume, edit, delete.
- **Family groups:** create a family and invite members by email (they accept in the app). Everyone logs their own expenses; the Family page shows the family total, who spent what, and each person's numbers. The head removes members and chooses whether everyone can see each other's spending or only the head can.
- **Custom categories:** add your own categories (icon and color) and subcategories.
- **Accounts:** email sign-up, forgot / reset / change password, optional Google sign-in. Each user sees only their own data (enforced in the database).
- **Light and dark mode**, mobile-first layout (bottom nav on phones, sidebar on desktop).

## How it fits together

```
client/   React app (Vite). Talks to /api with the user's Supabase access token.
server/   Express API. Each request uses a Supabase client carrying that token,
          so Postgres row-level security applies to every query.
api/      Vercel entry: exports the Express app as a serverless function.
supabase/ SQL migrations: schema, RLS, seed categories, stats functions,
          and the recurring-bill job (scheduled daily with pg_cron).
```

Analytics are computed in SQL functions. Recurring bills are logged by `log_due_recurring()` (pg_cron, daily 12:05 UTC), and by a catch-up call when the app opens, so bills appear on the user's local date. A unique `(recurring_id, expense_date)` constraint makes double-logging impossible.

## Local setup

Requires Node 20+ and a Supabase project.

```bash
npm install
cp server/.env.example server/.env    # Supabase URL, anon key, service-role key, DATABASE_URL
cp client/.env.example client/.env    # Supabase URL + anon key
npx supabase db push --db-url "<DATABASE_URL from server/.env>"   # apply migrations
npm run dev                           # API on :5000, app on http://localhost:5173
```

In Supabase → Authentication → URL Configuration, add `http://localhost:5173/**` to **Redirect URLs** so confirmation and password-reset emails link back to your local app.

## Scripts (run from the repo root)

| Script            | What it does                                                                       |
| ----------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`     | Runs the API and the app together                                                  |
| `npm run build`   | Builds the app for production                                                      |
| `npm test`        | Server unit tests + client component tests (no database needed)                    |
| `npm run test:db` | API tests against your real Supabase project (creates and deletes temporary users) |
| `npm run lint`    | Lints the client and the server                                                    |
| `npm run format`  | Formats everything with Prettier                                                   |

CI (GitHub Actions) runs lint, `npm test` and the build on every push and pull request.

## Deploy to Vercel

One Vercel project serves both parts: the React build as static files and the Express API as a serverless function at `/api` (see `vercel.json`). Because they share a domain, no CORS or API URL setup is needed.

1. In Vercel, **Add New → Project**, import `Rishi1228/Expensly`. Leave the root directory as `/` and the framework as "Other"; build settings come from `vercel.json`.
2. Add these **Environment Variables** (Production and Preview):

   | Name                     | Value                                             |
   | ------------------------ | ------------------------------------------------- |
   | `SUPABASE_URL`           | Supabase project URL                              |
   | `SUPABASE_ANON_KEY`      | Supabase anon / publishable key                   |
   | `VITE_SUPABASE_URL`      | Same as `SUPABASE_URL`                            |
   | `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY`                       |
   | `VITE_ENABLE_GOOGLE`     | `false` (or `true` once Google sign-in is set up) |

   The service-role key is **not** needed on Vercel; the API only ever acts as the signed-in user. Keep it in `server/.env` for `npm run test:db`.

3. **Deploy.** Then open `https://<your-app>.vercel.app/api/health`; it should return `{"status":"ok"}`.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to `https://<your-app>.vercel.app` and add `https://<your-app>.vercel.app/**` to **Redirect URLs**.

Database changes are not deployed by Vercel. Apply new migrations with `npx supabase db push`. The recurring-bill job runs inside Supabase, so Vercel needs no cron.
