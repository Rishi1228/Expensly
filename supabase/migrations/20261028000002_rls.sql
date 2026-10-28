-- Phase 1: Row Level Security. Every user sees only their own rows;
-- built-in categories/subcategories (user_id is null) are readable by all signed-in users.

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.subcategories       enable row level security;
alter table public.recurring_expenses  enable row level security;
alter table public.expenses            enable row level security;

-- Explicit grants (signed-in users only; RLS narrows rows further)
revoke all on public.profiles, public.categories, public.subcategories,
              public.recurring_expenses, public.expenses from anon;
grant select, update                 on public.profiles           to authenticated;
grant select, insert, update, delete on public.categories         to authenticated;
grant select, insert, update, delete on public.subcategories      to authenticated;
grant select, insert, update, delete on public.recurring_expenses to authenticated;
grant select, insert, update, delete on public.expenses           to authenticated;

-- profiles
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- categories
create policy "categories: read default or own" on public.categories
  for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "categories: insert own" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "categories: update own" on public.categories
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories: delete own" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

-- subcategories (custom ones may hang off a default or an own category)
create policy "subcategories: read default or own" on public.subcategories
  for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "subcategories: insert own" on public.subcategories
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    )
  );
create policy "subcategories: update own" on public.subcategories
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "subcategories: delete own" on public.subcategories
  for delete to authenticated using (user_id = (select auth.uid()));

-- recurring_expenses
create policy "recurring: all own" on public.recurring_expenses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- expenses
create policy "expenses: all own" on public.expenses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
