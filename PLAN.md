# PLAN — Personal Finance Manager

> See [PROMPT.md](PROMPT.md) for requirements. Track status in [PROGRESS.md](PROGRESS.md).

## Architecture

```
React (Vite) client  ──HTTP + Supabase JWT──▶  Express API  ──▶  Supabase Postgres (RLS)
        │                                                        ▲
        └──────── Supabase Auth (login / signup) ────────────────┘
                                         pg_cron ─▶ recurring bills auto-log
```

## Folder Structure

```
PersonalFinanceManager/
├── client/                 # React + Vite
│   └── src/
│       ├── api/            # API client (fetch + auth header)
│       ├── components/     # UI components (forms, charts, layout)
│       ├── pages/          # Dashboard, Expenses, Recurring, Auth, Profile
│       ├── hooks/          # TanStack Query hooks
│       ├── lib/            # supabase client, utils, formatters
│       └── schemas/        # Zod schemas
├── server/                 # Express API
│   └── src/
│       ├── routes/         # expenses, categories, stats, recurring
│       ├── controllers/
│       ├── middleware/     # auth (JWT), validate, errorHandler
│       ├── lib/            # supabase admin client
│       └── jobs/           # recurring fallback cron
├── supabase/
│   ├── migrations/         # SQL schema, RLS, views, functions
│   └── seed.sql            # default categories/subcategories
├── IDEA.md · PROMPT.md · PLAN.md · PROGRESS.md
```

## Database Schema

| Table                | Key Columns                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`           | `id` (= auth.users.id), `full_name`, `currency` (default INR), `created_at`                                                          |
| `categories`         | `id`, `user_id` (null = default), `name`, `icon`, `color`, `sort_order`                                                              |
| `subcategories`      | `id`, `category_id`, `user_id` (null = default), `name`                                                                              |
| `expenses`           | `id`, `user_id`, `amount`, `category_id`, `subcategory_id?`, `description?`, `expense_date`, `recurring_id?`, `created_at`           |
| `recurring_expenses` | `id`, `user_id`, `amount`, `category_id`, `subcategory_id?`, `description?`, `frequency`, `start_date`, `next_due_date`, `is_active` |

Indexes: `expenses(user_id, expense_date)`, `expenses(user_id, category_id)`.

## API Routes

| Method         | Route                                     | Purpose                                                               |
| -------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| GET/POST       | `/api/expenses`                           | List (filters: from, to, category, search, page) / create             |
| GET/PUT/DELETE | `/api/expenses/:id`                       | Read / update / delete                                                |
| GET/POST       | `/api/categories`                         | Defaults + user's custom categories (with subcategories) / add custom |
| POST           | `/api/categories/:id/subcategories`       | Add custom subcategory                                                |
| GET            | `/api/stats/summary`                      | Totals, % change, top category, avg/day                               |
| GET            | `/api/stats/by-category`                  | Spend per main category                                               |
| GET            | `/api/stats/by-subcategory?category=`     | Drill-down                                                            |
| GET            | `/api/stats/trend?granularity=day\|month` | Time series                                                           |
| GET/POST       | `/api/recurring`                          | List / create recurring bills                                         |
| PUT/DELETE     | `/api/recurring/:id`                      | Update, pause/resume / delete                                         |

---

## Phases

### Phase 0 — Project Setup

- [ ] `git init`, `.gitignore`, root README
- [ ] Scaffold `client/` (Vite React + Tailwind) and `server/` (Express)
- [ ] Create the Supabase project and add `.env` / `.env.example` to both apps
- [ ] ESLint + Prettier setup

**Done when:** both apps run locally (`npm run dev`) and the client can reach the server's `/api/health`.

### Phase 1 — Database & Auth

- [ ] SQL migration for all tables + indexes
- [ ] RLS policies (`user_id = auth.uid()`; defaults readable by everyone)
- [ ] Seed default categories and subcategories (from PROMPT.md)
- [ ] Trigger to create a `profiles` row on signup
- [ ] Enable email and Google login in Supabase Auth
- [ ] Express `requireAuth` middleware that checks the Supabase JWT

**Done when:** a signed-up user can call a protected route, and user A cannot read user B's rows.

### Phase 2 — Expense & Category API

- [ ] Expense CRUD routes with Zod validation
- [ ] Filtering (date range, category, search) + pagination
- [ ] Category / subcategory routes (including custom ones)
- [ ] Central error handler + consistent JSON responses

**Done when:** all routes work in Postman/Thunder Client, and bad input returns 400 with clear messages.

### Phase 3 — Frontend Core

- [ ] Supabase auth on the client: login, signup, logout, Google sign-in, protected routes
- [ ] Responsive layout shell (sidebar on desktop, bottom nav on mobile)
- [ ] Add/Edit expense form: amount, category → dependent subcategory, description, date
- [ ] Expenses list page: grouped by date, filters, search, edit, delete
- [ ] TanStack Query hooks + toast notifications

**Done when:** a user can sign up, add, edit, delete and filter expenses on both phone and desktop widths.

### Phase 4 — Analytics Dashboard

- [ ] SQL views / RPC functions for summary, by-category, by-subcategory, trend
- [ ] Stats API routes
- [ ] Summary cards (this month, last month, % change, top category, avg/day)
- [ ] ~~Donut chart~~ Ranked category bar list with drill-down into subcategories (changed in Phase 4: 14 categories don't fit a readable donut)
- [ ] Trend line/bar chart (daily / monthly)
- [ ] Recent expenses + date-range and category filters

**Done when:** dashboard numbers match a manual SQL check, and the charts are readable on mobile.

### Phase 5 — Recurring Bills

- [x] Recurring CRUD API + UI page (list, add, edit, pause/resume, delete)
- [x] `pg_cron` daily job (SQL function) that inserts due expenses and moves `next_due_date` forward
- [x] ~~Fallback `node-cron` job in the server~~ Not needed: pg_cron is available
- [x] Mark auto-logged expenses with a "recurring" badge in the list

**Done when:** a template due today creates exactly one expense when the job runs, and running it again doesn't create a duplicate.

### Phase 6 — Polish & Responsive QA

- [x] Dark mode toggle
- [x] Loading skeletons, empty states, error states
- [x] Floating quick-add button (mobile)
- [x] Accessibility pass (labels, focus, contrast) + test at 360px / 768px / 1280px
- [x] Profile page (name, currency display)

**Done when:** no layout breaks at the three widths, and Lighthouse accessibility scores ≥ 90.

### Phase 7 — Testing & Deployment

- [x] API tests (Vitest + Supertest), including the RLS isolation test
- [x] Key frontend component tests (Vitest + Testing Library)
- [x] CI on GitHub Actions (lint, tests, build)
- [ ] Deploy client + API together on Vercel (API as a serverless function at `/api`; same domain, so no CORS setup); set production env vars
- [x] Final README: setup, env vars, scripts, deploy steps

**Done when:** the live URL works end-to-end for a new user signup.

---

## Later Ideas (not in scope)

Monthly budgets & alerts · payment method field · lent-money repaid/pending tracking · CSV export.
