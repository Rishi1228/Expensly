# Personal Finance Manager

Track every daily expense by category and see where your money goes.
Stack: React (Vite) + Express + Supabase Postgres. Docs: [PROMPT.md](PROMPT.md) · [PLAN.md](PLAN.md) · [PROGRESS.md](PROGRESS.md)

## Setup

```bash
npm install                                  # installs root, client and server
cp server/.env.example server/.env           # fill in Supabase keys
cp client/.env.example client/.env           # fill in Supabase URL + anon key
npm run dev                                  # API on :5000, client on :5173
```

## Scripts (root)

| Script           | What it does                         |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Runs the API and the client together |
| `npm run build`  | Builds the client for production     |
| `npm run lint`   | Lints the client and the server      |
| `npm run format` | Formats code with Prettier           |

## Deploy (Vercel)

One Vercel project serves both parts: the React build as static files, and the Express API as a serverless function at `/api` (`api/index.js`, routing in `vercel.json`).

1. Import the GitHub repo in Vercel. Keep the root directory as `/`; build settings come from `vercel.json`.
2. Add these environment variables (Production and Preview):

   | Name                        | Value                                             |
   | --------------------------- | ------------------------------------------------- |
   | `SUPABASE_URL`              | Supabase project URL                              |
   | `SUPABASE_ANON_KEY`         | Supabase anon / publishable key                   |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server only, never `VITE_`)     |
   | `VITE_SUPABASE_URL`         | Same as `SUPABASE_URL`                            |
   | `VITE_SUPABASE_ANON_KEY`    | Same as `SUPABASE_ANON_KEY`                       |
   | `VITE_ENABLE_GOOGLE`        | `false` (or `true` once Google sign-in is set up) |

3. Deploy.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to your Vercel URL and add `https://<your-app>.vercel.app/**` to **Redirect URLs** (plus `http://localhost:5173/**` for local dev). Sign-up confirmation and password-reset emails link back to these.

Database migrations are applied separately: `npx supabase db push --db-url "$DATABASE_URL"`. Recurring bills are logged by a `pg_cron` job inside Supabase, so Vercel needs no cron setup.
