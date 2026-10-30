-- Phase 8: family groups.
--
-- A user is in at most one family. The creator is the head. Any member can invite by
-- email; the invitee must accept. Only the head removes members, changes settings,
-- hands over headship or deletes the family.
--
-- Members can only READ these tables (RLS). Every change goes through a SECURITY DEFINER
-- function below that checks the rules. Family analytics are SECURITY DEFINER too and
-- decide themselves whose expenses the caller may see, so the RLS on public.expenses
-- stays "own rows only" and the personal pages are unaffected.
--
-- Errors use custom SQLSTATEs so the API can turn them into clear HTTP errors:
--   PF400 bad request · PF403 not allowed · PF404 not found · PF409 conflict

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.families (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (char_length(name) between 1 and 50),
  members_can_view_all  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger families_updated_at
  before update on public.families
  for each row execute function public.set_updated_at();

create table public.family_members (
  family_id  uuid not null references public.families (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  is_head    boolean not null default false,
  joined_at  timestamptz not null default now(),
  primary key (family_id, user_id),
  constraint family_members_one_family unique (user_id)
);

-- exactly one head per family (at most one here; the functions keep it at one)
create unique index family_members_one_head_uidx on public.family_members (family_id) where is_head;

create table public.family_invites (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  email       text not null check (email = lower(email) and char_length(email) between 3 and 254),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint family_invites_unique unique (family_id, email)
);

create index family_invites_email_idx on public.family_invites (email);

-- When a member row goes away (leave, removal, or account deletion): if it was the head,
-- the longest-standing member becomes head; if nobody is left, the family is deleted.
create or replace function public.family_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.families where id = old.family_id) then
    return null; -- the whole family is being deleted
  end if;

  if old.is_head then
    update public.family_members
       set is_head = true
     where family_id = old.family_id
       and user_id = (
         select user_id from public.family_members
          where family_id = old.family_id
          order by joined_at, user_id
          limit 1
       );
  end if;

  if not exists (select 1 from public.family_members where family_id = old.family_id) then
    delete from public.families where id = old.family_id;
  end if;
  return null;
end;
$$;

create trigger family_members_after_delete
  after delete on public.family_members
  for each row execute function public.family_member_removed();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select family_id from public.family_members where user_id = (select auth.uid());
$$;

create or replace function public.my_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(email) from auth.users where id = (select auth.uid());
$$;

create or replace function public.is_family_head()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_head from public.family_members where user_id = (select auth.uid())),
    false
  );
$$;

/** Raises unless the caller is in a family; returns the family id. */
create or replace function public.require_family()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.my_family_id();
begin
  if v_family is null then
    raise exception 'You are not in a family' using errcode = 'PF404';
  end if;
  return v_family;
end;
$$;

create or replace function public.require_family_head()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family();
begin
  if not public.is_family_head() then
    raise exception 'Only the head of the family can do this' using errcode = 'PF403';
  end if;
  return v_family;
end;
$$;

/**
 * Members whose individual expenses the caller may see: everyone if the caller is the
 * head or the family is open, otherwise only the caller.
 */
create or replace function public.family_visible_members()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id
  from public.family_members m
  join public.families f on f.id = m.family_id
  where m.family_id = public.my_family_id()
    and (
      m.user_id = (select auth.uid())
      or f.members_can_view_all
      or public.is_family_head()
    );
$$;

/**
 * The members an analytics call covers: the whole family, or one member the caller
 * may see. Raises if the caller isn't in a family or can't see that member.
 */
create or replace function public.family_scope(p_member uuid default null)
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family();
begin
  if p_member is null then
    return array(select user_id from public.family_members where family_id = v_family);
  end if;
  if not exists (select 1 from public.family_visible_members() v where v = p_member) then
    raise exception 'You can''t view this member''s expenses' using errcode = 'PF403';
  end if;
  return array[p_member];
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: members can read their own family; invitees can read invites sent to them.
-- No write grants: all changes go through the functions below.
-- ---------------------------------------------------------------------------
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;

revoke all on public.families, public.family_members, public.family_invites from anon, authenticated;
grant select on public.families, public.family_members, public.family_invites to authenticated;

create policy "families: read own" on public.families
  for select to authenticated using (id = (select public.my_family_id()));
create policy "family_members: read own family" on public.family_members
  for select to authenticated using (family_id = (select public.my_family_id()));
create policy "family_invites: read own family or addressed to me" on public.family_invites
  for select to authenticated
  using (family_id = (select public.my_family_id()) or email = (select public.my_email()));

-- ---------------------------------------------------------------------------
-- Overview: everything the Family page needs in one call
-- ---------------------------------------------------------------------------
create or replace function public.get_my_family()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_family uuid := public.my_family_id();
  v_email  text := public.my_email();
  v_result jsonb;
begin
  select jsonb_build_object(
    'family', (
      select jsonb_build_object(
        'id', f.id, 'name', f.name,
        'members_can_view_all', f.members_can_view_all, 'created_at', f.created_at)
      from public.families f where f.id = v_family
    ),
    'is_head', public.is_family_head(),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
          'user_id', m.user_id,
          'full_name', p.full_name,
          'email', u.email,
          'is_head', m.is_head,
          'is_me', m.user_id = v_uid,
          'can_view', m.user_id in (select public.family_visible_members()),
          'joined_at', m.joined_at)
        order by m.is_head desc, m.joined_at, m.user_id)
      from public.family_members m
      join auth.users u on u.id = m.user_id
      left join public.profiles p on p.id = m.user_id
      where m.family_id = v_family
    ), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', i.id,
          'email', i.email,
          'invited_by', i.invited_by,
          'invited_by_name', p.full_name,
          'created_at', i.created_at)
        order by i.created_at)
      from public.family_invites i
      left join public.profiles p on p.id = i.invited_by
      where i.family_id = v_family
    ), '[]'::jsonb),
    'received_invites', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', i.id,
          'family_name', f.name,
          'invited_by_name', coalesce(p.full_name, u.email),
          'created_at', i.created_at)
        order by i.created_at desc)
      from public.family_invites i
      join public.families f on f.id = i.family_id
      left join public.profiles p on p.id = i.invited_by
      left join auth.users u on u.id = i.invited_by
      where i.email = v_email
        and i.family_id is distinct from v_family
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Actions
-- ---------------------------------------------------------------------------
create or replace function public.create_family(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = 'PF403';
  end if;
  if public.my_family_id() is not null then
    raise exception 'You are already in a family' using errcode = 'PF409';
  end if;
  insert into public.families (name) values (trim(p_name)) returning id into v_id;
  insert into public.family_members (family_id, user_id, is_head) values (v_id, v_uid, true);
  return v_id;
exception
  when unique_violation then
    raise exception 'You are already in a family' using errcode = 'PF409';
end;
$$;

create or replace function public.update_family(
  p_name text default null,
  p_members_can_view_all boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family_head();
begin
  update public.families
     set name = coalesce(trim(p_name), name),
         members_can_view_all = coalesce(p_members_can_view_all, members_can_view_all)
   where id = v_family;
end;
$$;

create or replace function public.delete_family()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family_head();
begin
  delete from public.families where id = v_family;
end;
$$;

create or replace function public.invite_family_member(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family();
  v_email  text := lower(trim(p_email));
  v_id     uuid;
begin
  if exists (
    select 1 from public.family_members m
    join auth.users u on u.id = m.user_id
    where m.family_id = v_family and lower(u.email) = v_email
  ) then
    raise exception 'That person is already in your family' using errcode = 'PF409';
  end if;

  insert into public.family_invites (family_id, email, invited_by)
  values (v_family, v_email, (select auth.uid()))
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'That email has already been invited' using errcode = 'PF409';
end;
$$;

/** The head or whoever sent the invite can take it back. */
create or replace function public.cancel_family_invite(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family();
  v_by     uuid;
begin
  select invited_by into v_by
    from public.family_invites where id = p_invite and family_id = v_family;
  if not found then
    raise exception 'Invite not found' using errcode = 'PF404';
  end if;
  if not public.is_family_head() and v_by is distinct from (select auth.uid()) then
    raise exception 'Only the head or the person who sent it can cancel this invite'
      using errcode = 'PF403';
  end if;
  delete from public.family_invites where id = p_invite;
end;
$$;

create or replace function public.respond_family_invite(p_invite uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_family uuid;
begin
  select family_id into v_family
    from public.family_invites where id = p_invite and email = public.my_email();
  if not found then
    raise exception 'Invite not found' using errcode = 'PF404';
  end if;

  if p_accept then
    if public.my_family_id() is not null then
      raise exception 'Leave your current family before joining another' using errcode = 'PF409';
    end if;
    insert into public.family_members (family_id, user_id) values (v_family, v_uid);
  end if;
  delete from public.family_invites where id = p_invite;
exception
  when unique_violation then
    raise exception 'Leave your current family before joining another' using errcode = 'PF409';
end;
$$;

create or replace function public.remove_family_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family_head();
begin
  if p_user = (select auth.uid()) then
    raise exception 'Hand over headship or delete the family instead' using errcode = 'PF400';
  end if;
  delete from public.family_members where family_id = v_family and user_id = p_user;
  if not found then
    raise exception 'Member not found' using errcode = 'PF404';
  end if;
end;
$$;

/** Members can leave. The head can leave only when alone (which deletes the family). */
create or replace function public.leave_family()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_family uuid := public.require_family();
begin
  if public.is_family_head()
     and exists (select 1 from public.family_members
                 where family_id = v_family and user_id <> v_uid) then
    raise exception 'Make someone else the head before leaving' using errcode = 'PF400';
  end if;
  delete from public.family_members where family_id = v_family and user_id = v_uid;
end;
$$;

create or replace function public.transfer_family_head(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_family uuid := public.require_family_head();
begin
  if p_user = v_uid then
    return;
  end if;
  if not exists (select 1 from public.family_members where family_id = v_family and user_id = p_user) then
    raise exception 'Member not found' using errcode = 'PF404';
  end if;
  update public.family_members set is_head = false where family_id = v_family and user_id = v_uid;
  update public.family_members set is_head = true  where family_id = v_family and user_id = p_user;
end;
$$;

-- ---------------------------------------------------------------------------
-- Family analytics. p_member = null → whole family; otherwise one visible member.
-- Combined family numbers are open to every member; per-person numbers follow
-- family_visible_members().
-- ---------------------------------------------------------------------------
create or replace function public.family_spend_total(
  p_from date default null,
  p_to date default null,
  p_member uuid default null
)
returns table (total numeric, expense_count bigint, first_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(e.amount), 0), count(*), min(e.expense_date)
  from public.expenses e
  where e.user_id = any ((select public.family_scope(p_member))::uuid[])
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to);
$$;

/**
 * Spend per member, biggest first. Members the caller can't see are folded into one
 * "Other members" row (user_id null), so the rows always add up to the family total.
 */
create or replace function public.family_spend_by_member(p_from date default null, p_to date default null)
returns table (user_id uuid, full_name text, is_head boolean, is_me boolean,
               total numeric, expense_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_family uuid := public.require_family();
  v_uid    uuid := (select auth.uid());
begin
  return query
  with members as (
    select m.user_id,
           m.is_head,
           m.user_id in (select public.family_visible_members()) as visible
    from public.family_members m
    where m.family_id = v_family
  ),
  spend as (
    select mem.user_id, mem.is_head, mem.visible,
           coalesce(sum(e.amount), 0) as total, count(e.id) as cnt
    from members mem
    left join public.expenses e
      on e.user_id = mem.user_id
     and (p_from is null or e.expense_date >= p_from)
     and (p_to   is null or e.expense_date <= p_to)
    group by mem.user_id, mem.is_head, mem.visible
  )
  select s.user_id, coalesce(p.full_name, split_part(u.email, '@', 1)), s.is_head,
         s.user_id = v_uid, s.total, s.cnt
  from spend s
  join auth.users u on u.id = s.user_id
  left join public.profiles p on p.id = s.user_id
  where s.visible
  union all
  select null, 'Other members', false, false, sum(s.total), sum(s.cnt)::bigint
  from spend s
  where not s.visible
  having count(*) > 0
  order by 5 desc, 2;
end;
$$;

create or replace function public.family_spend_by_category(
  p_from date default null,
  p_to date default null,
  p_member uuid default null
)
returns table (category_id uuid, name text, icon text, color text, total numeric, expense_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.icon, c.color, sum(e.amount), count(*)
  from public.expenses e
  join public.categories c on c.id = e.category_id
  where e.user_id = any ((select public.family_scope(p_member))::uuid[])
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to)
  group by c.id, c.name, c.icon, c.color
  order by sum(e.amount) desc, c.name;
$$;

create or replace function public.family_spend_by_subcategory(
  p_category_id uuid,
  p_from date default null,
  p_to date default null,
  p_member uuid default null
)
returns table (subcategory_id uuid, name text, total numeric, expense_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, coalesce(s.name, 'Unspecified'), sum(e.amount), count(*)
  from public.expenses e
  left join public.subcategories s on s.id = e.subcategory_id
  where e.user_id = any ((select public.family_scope(p_member))::uuid[])
    and e.category_id = p_category_id
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to)
  group by s.id, s.name
  order by sum(e.amount) desc, 2;
$$;

-- Same bucketing as spend_trend (see ..._stats_functions.sql), over the family scope.
create or replace function public.family_spend_trend(
  p_from date default null,
  p_to date default null,
  p_granularity text default 'day',
  p_today date default current_date,
  p_member uuid default null
)
returns table (bucket date, total numeric, expense_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ids   uuid[] := public.family_scope(p_member);
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
  where e.user_id = any (v_ids)
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
    on e.user_id = any (v_ids)
   and (case when p_granularity = 'day' then e.expense_date
             else date_trunc('month', e.expense_date)::date end) = g.bucket::date
   and (p_from is null or e.expense_date >= p_from)
   and (p_to   is null or e.expense_date <= p_to)
  group by g.bucket
  order by g.bucket;
end;
$$;

/** Individual expenses of the members the caller may see (newest first), paged. */
create or replace function public.family_expenses(
  p_from date default null,
  p_to date default null,
  p_member uuid default null,
  p_category_id uuid default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, user_id uuid, member_name text, amount numeric, description text,
  expense_date date, recurring_id uuid, created_at timestamptz,
  category jsonb, subcategory jsonb, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  perform public.require_family();
  if p_member is null then
    v_ids := array(select public.family_visible_members());
  else
    v_ids := public.family_scope(p_member);
  end if;

  return query
  select e.id, e.user_id, coalesce(p.full_name, split_part(u.email, '@', 1)),
         e.amount, e.description, e.expense_date, e.recurring_id, e.created_at,
         jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color),
         case when s.id is null then null else jsonb_build_object('id', s.id, 'name', s.name) end,
         count(*) over ()
  from public.expenses e
  join public.categories c on c.id = e.category_id
  left join public.subcategories s on s.id = e.subcategory_id
  join auth.users u on u.id = e.user_id
  left join public.profiles p on p.id = e.user_id
  where e.user_id = any (v_ids)
    and (p_from is null or e.expense_date >= p_from)
    and (p_to   is null or e.expense_date <= p_to)
    and (p_category_id is null or e.category_id = p_category_id)
  order by e.expense_date desc, e.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: signed-in users only
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.my_family_id()',
    'public.my_email()',
    'public.is_family_head()',
    'public.require_family()',
    'public.require_family_head()',
    'public.family_visible_members()',
    'public.family_scope(uuid)',
    'public.get_my_family()',
    'public.create_family(text)',
    'public.update_family(text, boolean)',
    'public.delete_family()',
    'public.invite_family_member(text)',
    'public.cancel_family_invite(uuid)',
    'public.respond_family_invite(uuid, boolean)',
    'public.remove_family_member(uuid)',
    'public.leave_family()',
    'public.transfer_family_head(uuid)',
    'public.family_spend_total(date, date, uuid)',
    'public.family_spend_by_member(date, date)',
    'public.family_spend_by_category(date, date, uuid)',
    'public.family_spend_by_subcategory(uuid, date, date, uuid)',
    'public.family_spend_trend(date, date, text, date, uuid)',
    'public.family_expenses(date, date, uuid, uuid, int, int)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

revoke all on function public.family_member_removed() from public, anon, authenticated;
