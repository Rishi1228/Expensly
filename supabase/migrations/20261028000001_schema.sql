-- Phase 1: core schema for Personal Finance Manager
-- Tables: profiles, categories, subcategories, recurring_expenses, expenses

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (one row per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  currency    text not null default 'INR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories (user_id null = built-in default visible to everyone)
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  icon        text,
  color       text,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

create unique index categories_owner_name_uidx
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- ---------------------------------------------------------------------------
-- subcategories
-- ---------------------------------------------------------------------------
create table public.subcategories (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 50),
  sort_order   int not null default 100,
  created_at   timestamptz not null default now()
);

create unique index subcategories_owner_name_uidx
  on public.subcategories (
    category_id,
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(name)
  );

create index subcategories_category_idx on public.subcategories (category_id);

-- ---------------------------------------------------------------------------
-- recurring_expenses (templates that auto-log expenses)
-- ---------------------------------------------------------------------------
create table public.recurring_expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount          numeric(12, 2) not null check (amount > 0),
  category_id     uuid not null references public.categories (id) on delete restrict,
  subcategory_id  uuid references public.subcategories (id) on delete set null,
  description     text check (char_length(description) <= 500),
  frequency       text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  start_date      date not null default current_date,
  next_due_date   date not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index recurring_user_idx on public.recurring_expenses (user_id);
create index recurring_due_idx on public.recurring_expenses (next_due_date) where is_active;

create trigger recurring_updated_at
  before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount          numeric(12, 2) not null check (amount > 0),
  category_id     uuid not null references public.categories (id) on delete restrict,
  subcategory_id  uuid references public.subcategories (id) on delete set null,
  description     text check (char_length(description) <= 500),
  expense_date    date not null default current_date,
  recurring_id    uuid references public.recurring_expenses (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- a recurring template can log at most one expense per due date
  constraint expenses_recurring_date_unique unique (recurring_id, expense_date)
);

create index expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index expenses_user_category_idx on public.expenses (user_id, category_id);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity: category must be default or owned by the row's user,
-- and the subcategory (if any) must belong to that category and be visible.
-- ---------------------------------------------------------------------------
create or replace function public.validate_category_refs()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cat_owner uuid;
  sub_cat   uuid;
  sub_owner uuid;
begin
  select user_id into cat_owner from public.categories where id = new.category_id;
  if not found or (cat_owner is not null and cat_owner <> new.user_id) then
    raise exception 'Invalid category' using errcode = '23503';
  end if;

  if new.subcategory_id is not null then
    select category_id, user_id into sub_cat, sub_owner
      from public.subcategories where id = new.subcategory_id;
    if not found
       or sub_cat <> new.category_id
       or (sub_owner is not null and sub_owner <> new.user_id) then
      raise exception 'Subcategory does not belong to the selected category' using errcode = '23503';
    end if;
  end if;

  return new;
end;
$$;

create trigger expenses_validate_refs
  before insert or update of category_id, subcategory_id, user_id on public.expenses
  for each row execute function public.validate_category_refs();

create trigger recurring_validate_refs
  before insert or update of category_id, subcategory_id, user_id on public.recurring_expenses
  for each row execute function public.validate_category_refs();
