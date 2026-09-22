-- Meeting vote delegations: one outgoing delegation per user per meeting.
-- Mutations go through SECURITY DEFINER RPCs; clients may only SELECT.

create table if not exists public.meeting_delegations (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  delegator_id uuid not null references public.users (id) on delete cascade,
  delegate_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint meeting_delegations_no_self check (delegator_id <> delegate_id),
  constraint meeting_delegations_unique_delegator unique (meeting_id, delegator_id)
);

create index if not exists meeting_delegations_delegate_idx
  on public.meeting_delegations (meeting_id, delegate_id);

alter table public.meeting_delegations enable row level security;

drop policy if exists meeting_delegations_select_member on public.meeting_delegations;
create policy meeting_delegations_select_member on public.meeting_delegations
  for select to authenticated using (is_meeting_member(meeting_id));

-- No INSERT/UPDATE/DELETE policies: mutations only via RPCs below.

grant select on public.meeting_delegations to authenticated;

create or replace function public.create_meeting_delegation(
  p_meeting_id uuid,
  p_delegate_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_group_id uuid;
  v_status public.meeting_status;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_delegate_id is null then
    raise exception 'Delegate is required';
  end if;

  if p_delegate_id = v_uid then
    raise exception 'Cannot delegate to yourself';
  end if;

  select m.group_id, m.status
  into v_group_id, v_status
  from public.meetings m
  where m.id = p_meeting_id;

  if v_group_id is null then
    raise exception 'Meeting not found';
  end if;

  if v_status = 'closed' then
    raise exception 'Meeting is closed';
  end if;

  if not public.is_group_member_user(v_group_id, v_uid) then
    raise exception 'Not a member of this group';
  end if;

  if not public.is_group_member_user(v_group_id, p_delegate_id) then
    raise exception 'Delegate is not a member of this group';
  end if;

  insert into public.meeting_delegations (meeting_id, delegator_id, delegate_id)
  values (p_meeting_id, v_uid, p_delegate_id)
  on conflict on constraint meeting_delegations_unique_delegator
  do update set
    delegate_id = excluded.delegate_id,
    created_at = now();
end;
$$;

create or replace function public.revoke_meeting_delegation(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status public.meeting_status;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select m.status
  into v_status
  from public.meetings m
  where m.id = p_meeting_id;

  if v_status is null then
    raise exception 'Meeting not found';
  end if;

  if v_status = 'closed' then
    raise exception 'Meeting is closed';
  end if;

  delete from public.meeting_delegations
  where meeting_id = p_meeting_id
    and delegator_id = v_uid;
end;
$$;

revoke all on function public.create_meeting_delegation(uuid, uuid) from public, anon;
revoke all on function public.revoke_meeting_delegation(uuid) from public, anon;
grant execute on function public.create_meeting_delegation(uuid, uuid) to authenticated;
grant execute on function public.revoke_meeting_delegation(uuid) to authenticated;
