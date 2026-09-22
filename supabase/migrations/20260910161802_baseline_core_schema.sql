-- quorum baseline schema (squashed from remote project nzslsspkfuhyiexwxyii).
-- Fresh installs: apply this file + following history stubs / push tokens migration.
-- Existing remote: already applied under these version timestamps.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_net" with schema extensions;

create schema if not exists private;

-- Enums
do $$ begin
  create type public.group_role as enum ('organizer', 'participant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.meeting_status as enum (
    'draft', 'scheduled', 'accreditation', 'active', 'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.poll_status as enum ('draft', 'active', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.poll_type as enum ('yes_no', 'multiple_choice');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  is_premium boolean not null default false,
  created_at timestamptz default now(),
  notify_new_meetings boolean not null default true,
  notify_doors_open boolean not null default true,
  notify_polls boolean not null default true
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_pin varchar not null unique,
  creator_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.group_role not null default 'participant',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  status public.meeting_status not null default 'draft',
  allow_blank_votes boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.meeting_attendances (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  accredited_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  title text not null,
  type public.poll_type not null,
  status public.poll_status not null default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists public.poll_participations (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table if not exists public.cast_votes (
  receipt_hash text primary key,
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid references public.poll_options (id) on delete set null,
  is_blank boolean not null default false,
  cast_at timestamptz not null default now(),
  constraint cast_votes_blank_xor_option_chk check (
    (is_blank = true and option_id is null)
    or (is_blank = false and option_id is not null)
  )
);

create table if not exists public.billing_webhook_events (
  id text primary key,
  event_type text,
  app_user_id text,
  processed_at timestamptz not null default now()
);

-- Auth helpers (SECURITY DEFINER)
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_group_member_user(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$$;

create or replace function public.is_group_organizer(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.role = 'organizer'
  );
$$;

create or replace function public.is_meeting_member(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.meetings m
    where m.id = p_meeting_id and public.is_group_member(m.group_id)
  );
$$;

create or replace function public.is_meeting_organizer(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.meetings m
    where m.id = p_meeting_id and public.is_group_organizer(m.group_id)
  );
$$;

create or replace function public.is_meeting_attendee(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.meeting_attendances ma
    where ma.meeting_id = p_meeting_id and ma.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_poll_member(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.polls p
    join public.meetings m on m.id = p.meeting_id
    where p.id = p_poll_id and public.is_group_member(m.group_id)
  );
$$;

create or replace function public.is_poll_organizer(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.polls p
    join public.meetings m on m.id = p.meeting_id
    where p.id = p_poll_id and public.is_group_organizer(m.group_id)
  );
$$;

create or replace function public.is_poll_attendee(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.polls p
    join public.meeting_attendances ma
      on ma.meeting_id = p.meeting_id and ma.user_id = (select auth.uid())
    where p.id = p_poll_id
  );
$$;

-- Triggers / profile bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  full_name text;
  first_name text;
  last_name text;
  avatar_url text;
  trimmed text;
begin
  first_name := nullif(btrim(coalesce(meta ->> 'first_name', meta ->> 'given_name', '')), '');
  last_name := nullif(btrim(coalesce(meta ->> 'last_name', meta ->> 'family_name', '')), '');

  if first_name is null or last_name is null then
    full_name := nullif(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
    if full_name is not null then
      trimmed := full_name;
      if first_name is null then
        first_name := split_part(trimmed, ' ', 1);
      end if;
      if last_name is null and position(' ' in trimmed) > 0 then
        last_name := nullif(btrim(substr(trimmed, char_length(split_part(trimmed, ' ', 1)) + 2)), '');
      end if;
    end if;
  end if;

  avatar_url := coalesce(meta ->> 'avatar_url', meta ->> 'picture');

  insert into public.users (id, first_name, last_name, avatar_url)
  values (new.id, first_name, last_name, avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.creator_id, 'organizer')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

create or replace function public.enforce_is_premium_server_only()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if tg_op = 'UPDATE'
     and new.is_premium is distinct from old.is_premium
     and coalesce(auth.jwt() ->> 'role', '') is distinct from 'service_role' then
    raise exception 'is_premium is managed by the billing system';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_is_premium_server_only on public.users;
create trigger trg_enforce_is_premium_server_only
  before update on public.users
  for each row execute function public.enforce_is_premium_server_only();

-- RPCs
create or replace function public.create_group(p_name text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_name text := trim(p_name);
  v_pin text;
  v_group public.groups%rowtype;
  v_attempt int := 0;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  if v_name is null or length(v_name) < 3 then
    raise exception 'INVALID_NAME' using errcode = 'P0001';
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'PIN_GENERATION_FAILED' using errcode = 'P0001';
    end if;

    v_pin := '';
    for i in 1..6 loop
      v_pin := v_pin || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;

    begin
      insert into public.groups (name, invite_pin, creator_id)
      values (v_name, v_pin, auth.uid())
      returning * into v_group;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'organizer')
  on conflict do nothing;

  return json_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'invite_pin', v_group.invite_pin,
    'role', 'organizer'
  );
end;
$$;

create or replace function public.join_group(p_group_id uuid, p_pin text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.invite_pin = p_pin
  ) then
    raise exception 'Invalid group invite';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, (select auth.uid()), 'participant')
  on conflict do nothing;

  return p_group_id;
end;
$$;

create or replace function public.join_group_by_pin(p_pin text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_group public.groups%rowtype;
  v_already_member boolean;
  v_pin text := trim(p_pin);
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  if v_pin is null or length(v_pin) < 4 then
    raise exception 'INVALID_PIN' using errcode = 'P0001';
  end if;

  select * into v_group
  from public.groups
  where invite_pin = v_pin
  limit 1;

  if not found then
    raise exception 'INVALID_PIN' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.group_members
    where group_id = v_group.id and user_id = auth.uid()
  ) into v_already_member;

  if v_already_member then
    raise exception 'ALREADY_MEMBER' using errcode = 'P0001';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'participant');

  return json_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'invite_pin', v_group.invite_pin,
    'role', 'participant'
  );
end;
$$;

create or replace function public.accredit_attendee(p_meeting_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_group_id uuid;
  v_status public.meeting_status;
  v_is_premium boolean;
  v_attendee_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  select m.group_id, m.status
  into v_group_id, v_status
  from public.meetings m
  where m.id = p_meeting_id;

  if v_group_id is null then
    raise exception 'Meeting not found';
  end if;

  if not public.is_group_organizer(v_group_id) then
    raise exception 'Only organizers can accredit attendees';
  end if;

  if v_status not in ('accreditation', 'active') then
    raise exception 'Meeting is not open for accreditation';
  end if;

  if not public.is_group_member_user(v_group_id, p_user_id) then
    raise exception 'User is not a member of this group';
  end if;

  if exists (
    select 1 from public.meeting_attendances
    where meeting_id = p_meeting_id and user_id = p_user_id
  ) then
    return;
  end if;

  select is_premium into v_is_premium
  from public.users
  where id = auth.uid();

  if not coalesce(v_is_premium, false) then
    select count(*) into v_attendee_count
    from public.meeting_attendances
    where meeting_id = p_meeting_id;

    if v_attendee_count >= 15 then
      raise exception 'Límite de 15 participantes alcanzado. Mejora a Premium para desbloquear el aforo ilimitado.';
    end if;
  end if;

  insert into public.meeting_attendances (meeting_id, user_id)
  values (p_meeting_id, p_user_id)
  on conflict do nothing;
end;
$$;

create or replace function public.cast_ballot(
  p_poll_id uuid,
  p_receipt_hash text,
  p_option_id uuid default null,
  p_is_blank boolean default false
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_meeting_id uuid;
  v_poll_status public.poll_status;
  v_meeting_status public.meeting_status;
  v_allow_blank boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_receipt_hash is null or length(trim(p_receipt_hash)) = 0 then
    raise exception 'receipt_hash is required';
  end if;

  select p.meeting_id, p.status, m.status, m.allow_blank_votes
  into v_meeting_id, v_poll_status, v_meeting_status, v_allow_blank
  from public.polls p
  join public.meetings m on m.id = p.meeting_id
  where p.id = p_poll_id;

  if v_meeting_id is null then
    raise exception 'Poll not found';
  end if;

  if v_poll_status is distinct from 'active' then
    raise exception 'Poll is not active';
  end if;

  if v_meeting_status is distinct from 'active' then
    raise exception 'Meeting is not active';
  end if;

  if not public.is_meeting_attendee(v_meeting_id) then
    raise exception 'Not accredited for this meeting';
  end if;

  if p_is_blank then
    if not v_allow_blank then
      raise exception 'Blank votes are not allowed in this meeting';
    end if;
    if p_option_id is not null then
      raise exception 'Blank vote cannot include an option';
    end if;
  else
    if p_option_id is null then
      raise exception 'Option is required';
    end if;
    if not exists (
      select 1 from public.poll_options o
      where o.id = p_option_id and o.poll_id = p_poll_id
    ) then
      raise exception 'Option does not belong to this poll';
    end if;
  end if;

  insert into public.poll_participations (poll_id, user_id)
  values (p_poll_id, v_uid);

  insert into public.cast_votes (receipt_hash, poll_id, option_id, is_blank)
  values (p_receipt_hash, p_poll_id, p_option_id, p_is_blank);

  return p_receipt_hash;
exception
  when unique_violation then
    raise exception 'Already voted in this poll';
end;
$$;

create or replace function private.open_due_scheduled_meetings()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  updated_count integer;
begin
  update public.meetings
  set
    status = 'accreditation'::public.meeting_status,
    end_date = null
  where status = 'scheduled'::public.meeting_status
    and start_date <= now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- RLS
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendances enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_participations enable row level security;
alter table public.cast_votes enable row level security;
alter table public.billing_webhook_events enable row level security;

-- Policies (drop/create for idempotency on fresh apply)
drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated on public.users
  for select to authenticated using (true);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
  for select to authenticated
  using (is_group_member(id) or creator_id = (select auth.uid()));

drop policy if exists groups_insert_creator on public.groups;
create policy groups_insert_creator on public.groups
  for insert to authenticated
  with check (creator_id = (select auth.uid()));

drop policy if exists groups_update_organizer on public.groups;
create policy groups_update_organizer on public.groups
  for update to authenticated
  using (is_group_organizer(id)) with check (is_group_organizer(id));

drop policy if exists groups_delete_organizer on public.groups;
create policy groups_delete_organizer on public.groups
  for delete to authenticated using (is_group_organizer(id));

drop policy if exists group_members_select_member on public.group_members;
create policy group_members_select_member on public.group_members
  for select to authenticated using (is_group_member(group_id));

drop policy if exists group_members_insert_organizer_or_creator on public.group_members;
create policy group_members_insert_organizer_or_creator on public.group_members
  for insert to authenticated
  with check (
    is_group_organizer(group_id)
    or (
      user_id = (select auth.uid())
      and role = 'organizer'
      and exists (
        select 1 from public.groups g
        where g.id = group_members.group_id and g.creator_id = (select auth.uid())
      )
    )
  );

drop policy if exists group_members_update_organizer on public.group_members;
create policy group_members_update_organizer on public.group_members
  for update to authenticated
  using (is_group_organizer(group_id)) with check (is_group_organizer(group_id));

drop policy if exists group_members_delete_organizer_or_self on public.group_members;
create policy group_members_delete_organizer_or_self on public.group_members
  for delete to authenticated
  using (is_group_organizer(group_id) or user_id = (select auth.uid()));

drop policy if exists meetings_select_member on public.meetings;
create policy meetings_select_member on public.meetings
  for select to authenticated using (is_group_member(group_id));

drop policy if exists meetings_insert_organizer on public.meetings;
create policy meetings_insert_organizer on public.meetings
  for insert to authenticated with check (is_group_organizer(group_id));

drop policy if exists meetings_update_organizer on public.meetings;
create policy meetings_update_organizer on public.meetings
  for update to authenticated
  using (is_group_organizer(group_id)) with check (is_group_organizer(group_id));

drop policy if exists meetings_delete_organizer on public.meetings;
create policy meetings_delete_organizer on public.meetings
  for delete to authenticated using (is_group_organizer(group_id));

drop policy if exists meeting_attendances_select_member on public.meeting_attendances;
create policy meeting_attendances_select_member on public.meeting_attendances
  for select to authenticated using (is_meeting_member(meeting_id));

drop policy if exists meeting_attendances_insert_organizer on public.meeting_attendances;
create policy meeting_attendances_insert_organizer on public.meeting_attendances
  for insert to authenticated
  with check (
    is_meeting_organizer(meeting_id)
    and exists (
      select 1
      from public.meetings m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = meeting_attendances.meeting_id
        and gm.user_id = meeting_attendances.user_id
    )
  );

drop policy if exists meeting_attendances_delete_organizer on public.meeting_attendances;
create policy meeting_attendances_delete_organizer on public.meeting_attendances
  for delete to authenticated using (is_meeting_organizer(meeting_id));

drop policy if exists polls_select_member on public.polls;
create policy polls_select_member on public.polls
  for select to authenticated using (is_meeting_member(meeting_id));

drop policy if exists polls_insert_organizer on public.polls;
create policy polls_insert_organizer on public.polls
  for insert to authenticated
  with check (
    is_meeting_organizer(meeting_id)
    and exists (
      select 1 from public.meetings m
      where m.id = polls.meeting_id
        and m.status = any (array[
          'draft'::public.meeting_status,
          'accreditation'::public.meeting_status,
          'active'::public.meeting_status
        ])
    )
  );

drop policy if exists polls_update_organizer on public.polls;
create policy polls_update_organizer on public.polls
  for update to authenticated
  using (is_meeting_organizer(meeting_id)) with check (is_meeting_organizer(meeting_id));

drop policy if exists polls_delete_organizer on public.polls;
create policy polls_delete_organizer on public.polls
  for delete to authenticated using (is_meeting_organizer(meeting_id));

drop policy if exists poll_options_select_member on public.poll_options;
create policy poll_options_select_member on public.poll_options
  for select to authenticated using (is_poll_member(poll_id));

drop policy if exists poll_options_insert_organizer on public.poll_options;
create policy poll_options_insert_organizer on public.poll_options
  for insert to authenticated with check (is_poll_organizer(poll_id));

drop policy if exists poll_options_update_organizer on public.poll_options;
create policy poll_options_update_organizer on public.poll_options
  for update to authenticated
  using (is_poll_organizer(poll_id)) with check (is_poll_organizer(poll_id));

drop policy if exists poll_options_delete_organizer on public.poll_options;
create policy poll_options_delete_organizer on public.poll_options
  for delete to authenticated using (is_poll_organizer(poll_id));

drop policy if exists poll_participations_select_member on public.poll_participations;
create policy poll_participations_select_member on public.poll_participations
  for select to authenticated using (is_poll_member(poll_id));

drop policy if exists cast_votes_select_member on public.cast_votes;
create policy cast_votes_select_member on public.cast_votes
  for select to authenticated using (is_poll_member(poll_id));

-- Grants
grant usage on schema public to authenticated, anon, service_role;

grant select on public.users to authenticated;
grant update (first_name, last_name, avatar_url, notify_new_meetings, notify_doors_open, notify_polls)
  on public.users to authenticated;
revoke update (is_premium) on table public.users from authenticated, anon;
grant update (is_premium) on table public.users to service_role;

grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, delete on public.meeting_attendances to authenticated;
grant insert on public.meeting_attendances to authenticated;
grant select, insert, update, delete on public.polls to authenticated;
grant select, insert, update, delete on public.poll_options to authenticated;
grant select on public.poll_participations to authenticated;
grant select on public.cast_votes to authenticated;

grant all on public.billing_webhook_events to service_role;
grant all on table public.users to service_role;

grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(uuid, text) to authenticated;
grant execute on function public.join_group_by_pin(text) to authenticated;
grant execute on function public.accredit_attendee(uuid, uuid) to authenticated;
grant execute on function public.cast_ballot(uuid, text, uuid, boolean) to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_new_group() from public, anon, authenticated;
revoke all on function private.open_due_scheduled_meetings() from public, anon, authenticated;

-- Realtime
alter table public.polls replica identity full;
alter table public.meeting_attendances replica identity full;
alter table public.poll_participations replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.polls;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.meeting_attendances;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.poll_participations;
  exception when duplicate_object then null;
  end;
end $$;

-- Cron: open scheduled meetings every minute
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'open-scheduled-meetings') then
    perform cron.schedule(
      'open-scheduled-meetings',
      '* * * * *',
      'select private.open_due_scheduled_meetings()'
    );
  end if;
exception
  when undefined_table then
    raise notice 'cron.job unavailable; skip schedule';
  when insufficient_privilege then
    raise notice 'pg_cron not privileged; skip schedule';
end $$;
