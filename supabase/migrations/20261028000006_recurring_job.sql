-- Phase 5: recurring bills auto-log.
--
-- next_occurrence(): the schedule date after a given day. Monthly/yearly dates are
--   always computed from start_date, so "31 Jan" gives 28 Feb then 31 Mar (no drift).
-- log_due_recurring(): inserts one expense per due date (catching up missed runs)
--   and moves next_due_date forward. Safe to run any number of times: the
--   unique (recurring_id, expense_date) constraint blocks duplicates.
-- log_my_due_recurring(): the same, for the signed-in user only, using their local
--   "today". The app calls it on load, so bills appear on the right local date.
-- pg_cron runs log_due_recurring() daily at 12:05 UTC. At that moment the UTC date
--   has started in every timezone (UTC-12 … UTC+14), so a bill is never logged early.

-- ---------------------------------------------------------------------------
-- next_occurrence
-- ---------------------------------------------------------------------------
create or replace function public.next_occurrence(p_start date, p_freq text, p_after date)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  step int;
  n    int;
  d    date;
begin
  if p_after < p_start then
    return p_start;
  end if;

  if p_freq = 'weekly' then
    return p_start + 7 * ((p_after - p_start) / 7 + 1);
  end if;

  step := case p_freq when 'monthly' then 1 when 'yearly' then 12 end;
  if step is null then
    raise exception 'Unknown frequency %', p_freq using errcode = '22023';
  end if;

  -- whole steps between the two months, rounded down, then walk forward
  n := ((extract(year from p_after) - extract(year from p_start)) * 12
        + extract(month from p_after) - extract(month from p_start))::int;
  n := (n / step) * step;
  d := (p_start + make_interval(months => n))::date;
  while d <= p_after loop
    n := n + step;
    d := (p_start + make_interval(months => n))::date;
  end loop;
  return d;
end;
$$;

-- ---------------------------------------------------------------------------
-- log_due_recurring (job; service role / cron only)
-- ---------------------------------------------------------------------------
create or replace function public.log_due_recurring(
  p_today date default current_date,
  p_user  uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        record;
  due      date;
  added    int;
  inserted int := 0;
begin
  for r in
    select *
      from public.recurring_expenses
     where is_active
       and next_due_date <= p_today
       and (p_user is null or user_id = p_user)
     for update skip locked
  loop
    begin
      due := r.next_due_date;
      while due <= p_today loop
        insert into public.expenses
          (user_id, amount, category_id, subcategory_id, description, expense_date, recurring_id)
        values
          (r.user_id, r.amount, r.category_id, r.subcategory_id, r.description, due, r.id)
        on conflict on constraint expenses_recurring_date_unique do nothing;
        get diagnostics added = row_count;
        inserted := inserted + added;
        due := public.next_occurrence(r.start_date, r.frequency, due);
      end loop;

      update public.recurring_expenses set next_due_date = due where id = r.id;
    exception when others then
      -- one broken template must not stop the others
      raise warning 'recurring % skipped: %', r.id, sqlerrm;
    end;
  end loop;

  return inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- log_my_due_recurring (signed-in user, their local "today")
-- ---------------------------------------------------------------------------
create or replace function public.log_my_due_recurring(p_today date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  -- local dates are at most one day either side of UTC
  if p_today is null or p_today not between current_date - 1 and current_date + 1 then
    raise exception 'Invalid date' using errcode = '22023';
  end if;
  return public.log_due_recurring(p_today, uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
revoke all on function public.next_occurrence(date, text, date) from public, anon;
revoke all on function public.log_due_recurring(date, uuid) from public, anon, authenticated;
revoke all on function public.log_my_due_recurring(date) from public, anon;

grant execute on function public.next_occurrence(date, text, date) to authenticated;
grant execute on function public.log_my_due_recurring(date) to authenticated;
grant execute on function public.log_due_recurring(date, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Daily schedule (skipped with a notice if pg_cron isn't available)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('log-due-recurring', '5 12 * * *', 'select public.log_due_recurring()');
  else
    raise notice 'pg_cron not available: bills are still logged when the app opens (log_my_due_recurring)';
  end if;
end;
$$;
