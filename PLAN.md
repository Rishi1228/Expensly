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

## Family Groups (phases 8–12)

> Source: the "family" section of [IDEA.md](IDEA.md).

**Rules**

- A user belongs to **at most one family**. Whoever creates it becomes the **head**.
- **Any member can invite** someone by email. The invitee must **accept** before joining (joining lets the head see their expenses, so it never happens silently). Invites to emails without an account wait until that person signs up.
- **Only the head** can remove members, change the view setting, rename the family, hand over headship, or delete the family. Members (not the head) can leave.
- **View setting** (head chooses):
  - **Everyone sees everyone**: all members see each member's totals, breakdowns and expenses.
  - **Restricted** (default): the head sees everyone; other members see the family's combined total, category breakdown and trend, plus their own numbers. Everyone else shows up only as one combined "Other members" row.
- Each person still logs **their own** expenses; family members can never edit or delete someone else's expense.
- Personal pages (Dashboard, Expenses, Recurring) stay personal and unchanged.

**New tables**

| Table            | Key Columns                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `families`       | `id`, `name`, `head_id`, `members_can_view_all` (default false), `created_at`                |
| `family_members` | `family_id`, `user_id` (**unique**: one family per user), `joined_at`                        |
| `family_invites` | `id`, `family_id`, `email` (lower-case), `invited_by`, `created_at`; unique per family+email |

All family reads go through SECURITY DEFINER SQL functions that check membership and the view setting themselves, so the existing RLS on `expenses` stays "own rows only".

**New API routes**

| Method | Route                                                                      | Who            | Purpose                                                    |
| ------ | -------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------- |
| GET    | `/api/family`                                                              | anyone         | My family, members, my role, pending invites I've received |
| POST   | `/api/family`                                                              | no family yet  | Create a family (I become head)                            |
| PUT    | `/api/family`                                                              | head           | Rename / change view setting                               |
| DELETE | `/api/family`                                                              | head           | Delete the family                                          |
| POST   | `/api/family/invites`                                                      | member         | Invite by email                                            |
| DELETE | `/api/family/invites/:id`                                                  | head / inviter | Cancel an invite                                           |
| POST   | `/api/family/invites/:id/accept\|decline`                                  | invitee        | Respond to an invite                                       |
| DELETE | `/api/family/members/:userId`                                              | head           | Remove a member                                            |
| POST   | `/api/family/leave`                                                        | member         | Leave (head must hand over or delete first)                |
| POST   | `/api/family/transfer`                                                     | head           | Make another member the head                               |
| GET    | `/api/family/stats/summary\|by-member\|by-category\|by-subcategory\|trend` | member         | Family analytics (`?member=` for one person)               |
| GET    | `/api/family/expenses`                                                     | member         | Expenses of members I'm allowed to see                     |

### Phase 8 — Family: Database & Permissions

- [x] Migration: `families`, `family_members`, `family_invites` + indexes, RLS (read-only for members; all writes via functions)
- [x] Helper functions: `my_family_id()`, `is_family_head()`, `family_visible_members()`
- [x] Action functions with the rules above: create, invite, accept/decline, cancel invite, remove, leave, transfer, update settings, delete
- [x] Family analytics functions: total, by member (with "Other members" row), by category, by subcategory, trend, expense list

**Done when:** a restricted member can't read another member's expenses through any function, and a non-head can't remove anyone.

### Phase 9 — Family: API

- [x] Zod schemas + routes/controllers for family management
- [x] Family stats + family expenses routes (same response shapes as personal stats)
- [x] Map function errors to clear 400/403/404/409 messages

**Done when:** every route above works and rule violations return clear errors.

### Phase 10 — Family: Management UI

- [x] "Family" in the navigation (sidebar + phone bottom nav)
- [x] No family: create one, and see/accept/decline invites I've received
- [x] Family page: members list (head badge), invite by email, pending invites
- [x] Head-only controls: view setting toggle, rename, remove member, make head, delete family; members: leave

**Done when:** two users can form a family end-to-end in the browser on desktop and phone.

### Phase 11 — Family Dashboard

- [x] Family view on the Family page: family total, change vs previous period, avg/day, top category
- [x] "Who spent what" ranked per-member bars; tap a member to filter the whole view to them
- [x] Family category breakdown (with drill-down) and trend chart, reusing the personal components
- [x] Recent family expenses with the member's name on each row
- [x] Period chips like the personal dashboard

**Done when:** family numbers equal the sum of the members' personal numbers, and restricted members see only what the rules allow.

### Phase 12 — Family: Tests & QA

- [x] DB tests: permission rules (invite/accept, head-only actions, one family per user, restricted vs open visibility, non-member blocked) and family stats numbers
- [x] Unit tests for the new schemas; component tests for the family page states
- [ ] Browser check at phone and desktop widths, light and dark

**Done when:** `npm test`, `npm run test:db` and lint pass, and the browser check has no console errors.

---

## Later Ideas (not in scope)

Monthly budgets & alerts · payment method field · lent-money repaid/pending tracking · CSV export.
