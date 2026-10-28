-- Phase 4: analytics functions. SECURITY INVOKER (the default) means they run as the
-- calling user, so RLS still applies; the explicit user_id filter also lets Postgres use
-- the (user_id, expense_date) index. Null p_from / p_to = unbounded.

-- Total + count for a date range
create or replace function public.spend_total(p_from date default null, p_to date default null)
returns table (total numeric, expense_count bigint)
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(e.amount), 0), count(*)
  from public.expenses e
  where e.user_id = (select auth.uid())
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to);
$$;

-- Spend per main category, biggest first
create or replace function public.spend_by_category(p_from date default null, p_to date default null)
returns table (category_id uuid, name text, icon text, color text, total numeric, expense_count bigint)
language sql
stable
set search_path = ''
as $$
  select c.id, c.name, c.icon, c.color, sum(e.amount), count(*)
  from public.expenses e
  join public.categories c on c.id = e.category_id
  where e.user_id = (select auth.uid())
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to)
  group by c.id, c.name, c.icon, c.color
  order by sum(e.amount) desc, c.name;
$$;

-- Spend per subcategory within one category (null subcategory = "Other / unspecified")
create or replace function public.spend_by_subcategory(
  p_category_id uuid,
  p_from date default null,
  p_to date default null
)
returns table (subcategory_id uuid, name text, total numeric, expense_count bigint)
language sql
stable
set search_path = ''
as $$
  select s.id, coalesce(s.name, 'Unspecified'), sum(e.amount), count(*)
  from public.expenses e
  left join public.subcategories s on s.id = e.subcategory_id
  where e.user_id = (select auth.uid())
    and e.category_id = p_category_id
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to)
  group by s.id, s.name
  order by sum(e.amount) desc, 2;
$$;

-- Spend per day or per month, with empty buckets filled with 0.
-- The series runs from p_from (or the first expense) up to p_to, but stops at p_today
-- unless there are later-dated expenses, so the chart doesn't show empty future days.
create or replace function public.spend_trend(
  p_from date default null,
  p_to date default null,
  p_granularity text default 'day',
  p_today date default current_date
)
returns table (bucket date, total numeric, expense_count bigint)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_step  interval;
  v_start date;
  v_end   date;
  v_last  date;
begin
  if p_granularity not in ('day', 'month') then
    raise exception 'granularity must be day or month' using errcode = '22023';
  end if;
  v_step := case p_granularity when 'day' then interval '1 day' else interval '1 month' end;

  select min(e.expense_date), max(e.expense_date) into v_start, v_last
  from public.expenses e
  where e.user_id = v_uid
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to);

  v_start := coalesce(p_from, v_start, p_today);
  v_end   := greatest(least(coalesce(p_to, p_today), p_today), coalesce(v_last, v_start), v_start);

  if p_granularity = 'month' then
    v_start := date_trunc('month', v_start)::date;
    v_end   := date_trunc('month', v_end)::date;
  end if;

  return query
  select g.bucket::date,
         coalesce(sum(e.amount), 0),
         count(e.id)
  from generate_series(v_start, v_end, v_step) as g(bucket)
  left join public.expenses e
    on e.user_id = v_uid
   and (case when p_granularity = 'day' then e.expense_date
             else date_trunc('month', e.expense_date)::date end) = g.bucket::date
   and (p_from is null or e.expense_date >= p_from)
   and (p_to   is null or e.expense_date <= p_to)
  group by g.bucket
  order by g.bucket;
end;
$$;

revoke all on function public.spend_total(date, date)                        from public, anon;
revoke all on function public.spend_by_category(date, date)                  from public, anon;
revoke all on function public.spend_by_subcategory(uuid, date, date)         from public, anon;
revoke all on function public.spend_trend(date, date, text, date)            from public, anon;
grant execute on function public.spend_total(date, date)                     to authenticated;
grant execute on function public.spend_by_category(date, date)               to authenticated;
grant execute on function public.spend_by_subcategory(uuid, date, date)      to authenticated;
grant execute on function public.spend_trend(date, date, text, date)         to authenticated;
