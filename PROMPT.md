# PROMPT — Personal Finance Manager

> Source: [IDEA.md](IDEA.md). This is the prompt to follow when building the project.

## Goal

Build a **responsive, multi-user personal expense tracker** that logs every daily expense and shows clear analytics on where the money goes.

## Tech Stack

| Layer      | Choice                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| Frontend   | React + Vite, Tailwind CSS, React Router, TanStack Query, Recharts, React Hook Form + Zod |
| Backend    | Node.js + Express REST API, `@supabase/supabase-js`, Zod validation                       |
| Database   | Supabase Postgres (in place of MongoDB) with Row Level Security (RLS)                     |
| Auth       | Supabase Auth (email/password + Google). Express checks the Supabase JWT on every request |
| Scheduling | Supabase `pg_cron` (fallback: `node-cron` on the server) for recurring bills              |

## Users

- Many users can sign up. Each user sees **only their own data**: RLS on every table, scoped to `auth.uid()`.

## Categories

The main category is **required**. The subcategory is **optional**. Users can add their own subcategories (and custom categories).

| #   | Main Category | Subcategories                                                           |
| --- | ------------- | ----------------------------------------------------------------------- |
| 1   | Food          | Online Order, Dine-in (Restaurant), Dine-in (Street)                    |
| 2   | Travel        | Cab/Auto, Metro/Bus, Train, Flight, Fuel                                |
| 3   | Groceries     | Zepto, Blinkit, DMart, In-store                                         |
| 4   | Necessities   | Electricity Bill, Gas Bill, Newspaper Bill, House Help Wage, Fees, Rent |
| 5   | Repairs       | Home, Vehicle, Electronics                                              |
| 6   | Entertainment | OTT, Movie, Play (Turf, PS, Pool, Badminton), Concerts, Events          |
| 7   | Investment    | SIP/Mutual Fund, Stocks, FD/RD, Gold                                    |
| 8   | Lent Money    | (person name goes in the description)                                   |

**Suggested extra categories:**

| #   | Category          | Subcategories                    |
| --- | ----------------- | -------------------------------- |
| 9   | Shopping          | Clothes, Electronics, Home Items |
| 10  | Health            | Medicine, Doctor, Gym, Insurance |
| 11  | Personal Care     | Salon, Grooming                  |
| 12  | Gifts & Donations | Gifts, Charity                   |
| 13  | Education         | Courses, Books                   |
| 14  | Miscellaneous     | —                                |

## Expense Entry

| Field         | Required | Notes                                           |
| ------------- | -------- | ----------------------------------------------- |
| Amount        | ✅       | INR, positive number, stored as `numeric(12,2)` |
| Main category | ✅       | From the category list                          |
| Subcategory   | ❌       | Filtered by the chosen main category            |
| Description   | ❌       | Free text                                       |
| Date          | ✅       | Defaults to today                               |

## Recurring Bills (auto-log)

- Create a recurring template: amount, category, subcategory, description, frequency (weekly / monthly / yearly), start date, next due date, active/paused.
- A daily scheduled job inserts an expense for every template that is due, then moves `next_due_date` forward.
- Examples: OTT subscriptions, rent, house-help wage, newspaper bill.

## Analytics Dashboard

- Summary cards: **this month's total**, **last month's total**, % change, **top category**, average per day.
- **Donut chart** by main category → click a slice to **drill down** into its subcategories.
- **Trend chart**: daily spend (current month) / monthly spend (last 12 months).
- **Top categories** bar list and **recent expenses** list.
- Filters: date range (this month, last month, last 3 months, custom) and category.

## UI / UX

- Clean, minimal, **mobile-first** design.
- Phones: bottom navigation (Dashboard, Expenses, Add, Recurring, Profile) and a floating **quick-add** button.
- Desktop: sidebar navigation.
- Light and dark mode. Clear loading, empty and error states.

## Non-functional

- Input checked on both the client and the server (shared Zod schemas where possible).
- Secrets live in `.env` and are never committed. The service-role key is used only on the server.
- Analytics are computed in SQL (views / RPC functions), not in JavaScript loops.
