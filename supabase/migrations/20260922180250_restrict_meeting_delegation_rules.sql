-- Organizers cannot create delegations; one outgoing only (no silent replace).

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
