-- Feature flag for vote delegations + lock revoke while meeting is active.

alter table public.meetings
  add column if not exists allow_delegations boolean not null default false;

create or replace function public.set_meeting_allow_delegations(
  p_meeting_id uuid,
  p_allow boolean
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_premium boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_meeting_organizer(p_meeting_id) then
    raise exception 'Only organizers can update this setting';
  end if;

  if p_allow then
    select u.is_premium into v_is_premium
    from public.users u
    where u.id = v_uid;

    if not coalesce(v_is_premium, false) then
      raise exception 'Premium required for delegations';
    end if;
  end if;

  update public.meetings
  set allow_delegations = p_allow
  where id = p_meeting_id;

  if not found then
    raise exception 'Meeting not found';
  end if;
end;
$$;

revoke all on function public.set_meeting_allow_delegations(uuid, boolean) from public, anon;
grant execute on function public.set_meeting_allow_delegations(uuid, boolean) to authenticated;

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
  v_allow_delegations boolean;
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

  select m.group_id, m.status, m.allow_delegations
  into v_group_id, v_status, v_allow_delegations
  from public.meetings m
  where m.id = p_meeting_id;

  if v_group_id is null then
    raise exception 'Meeting not found';
  end if;

  if not coalesce(v_allow_delegations, false) then
    raise exception 'Delegations are not enabled for this meeting';
  end if;

  if v_status = 'closed' then
    raise exception 'Meeting is closed';
  end if;

  if not public.is_group_member_user(v_group_id, v_uid) then
    raise exception 'Not a member of this group';
  end if;

  if public.is_group_organizer(v_group_id) then
    raise exception 'Organizers cannot delegate their vote';
  end if;

  if not public.is_group_member_user(v_group_id, p_delegate_id) then
    raise exception 'Delegate is not a member of this group';
  end if;

  if exists (
    select 1
    from public.meeting_delegations d
    where d.meeting_id = p_meeting_id
      and d.delegator_id = v_uid
  ) then
    raise exception 'You already have a delegation. Revoke it first.';
  end if;

  insert into public.meeting_delegations (meeting_id, delegator_id, delegate_id)
  values (p_meeting_id, v_uid, p_delegate_id);
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

  if v_status = 'active' then
    raise exception 'Cannot revoke delegation while meeting is active';
  end if;

  delete from public.meeting_delegations
  where meeting_id = p_meeting_id
    and delegator_id = v_uid;
end;
$$;
