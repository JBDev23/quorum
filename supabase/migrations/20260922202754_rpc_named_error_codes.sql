-- Stable machine-readable RPC error codes (ERR_*) for client mapping.
-- Prefer named messages over opaque SQLSTATE values like P0001.

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
    raise exception 'ERR_NOT_AUTHENTICATED';
  end if;

  select m.group_id, m.status
  into v_group_id, v_status
  from public.meetings m
  where m.id = p_meeting_id;

  if v_group_id is null then
    raise exception 'ERR_NOT_FOUND';
  end if;

  if not public.is_group_organizer(v_group_id) then
    raise exception 'ERR_UNAUTHORIZED';
  end if;

  if v_status not in ('accreditation', 'active') then
    raise exception 'ERR_INVALID_STATUS';
  end if;

  if not public.is_group_member_user(v_group_id, p_user_id) then
    raise exception 'ERR_NOT_MEMBER';
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
      raise exception 'ERR_LIMIT_REACHED';
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
  p_is_blank boolean default false,
  p_delegator_id uuid default null
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_actual_voter uuid := coalesce(p_delegator_id, v_uid);
  v_meeting_id uuid;
  v_poll_status public.poll_status;
  v_meeting_status public.meeting_status;
  v_allow_blank boolean;
begin
  if v_uid is null then
    raise exception 'ERR_NOT_AUTHENTICATED';
  end if;

  if p_receipt_hash is null or length(trim(p_receipt_hash)) = 0 then
    raise exception 'ERR_RECEIPT_REQUIRED';
  end if;

  select p.meeting_id, p.status, m.status, m.allow_blank_votes
  into v_meeting_id, v_poll_status, v_meeting_status, v_allow_blank
  from public.polls p
  join public.meetings m on m.id = p.meeting_id
  where p.id = p_poll_id;

  if v_meeting_id is null then
    raise exception 'ERR_POLL_NOT_FOUND';
  end if;

  if v_poll_status is distinct from 'active' then
    raise exception 'ERR_POLL_CLOSED';
  end if;

  if v_meeting_status is distinct from 'active' then
    raise exception 'ERR_MEETING_INACTIVE';
  end if;

  -- Device holder must be accredited
  if not public.is_meeting_attendee(v_meeting_id) then
    raise exception 'ERR_NOT_ACCREDITED';
  end if;

  -- Own vote: blocked if this user already delegated away
  if p_delegator_id is null then
    if exists (
      select 1
      from public.meeting_delegations d
      where d.meeting_id = v_meeting_id
        and d.delegator_id = v_uid
    ) then
      raise exception 'ERR_VOTE_DELEGATED';
    end if;
  else
    -- Proxy vote: must hold an active delegation from that user
    if not exists (
      select 1
      from public.meeting_delegations d
      where d.meeting_id = v_meeting_id
        and d.delegator_id = p_delegator_id
        and d.delegate_id = v_uid
    ) then
      raise exception 'ERR_NOT_AUTHORIZED_DELEGATE';
    end if;
  end if;

  if p_is_blank then
    if not v_allow_blank then
      raise exception 'ERR_BLANK_NOT_ALLOWED';
    end if;
    if p_option_id is not null then
      raise exception 'ERR_INVALID_OPTION';
    end if;
  else
    if p_option_id is null then
      raise exception 'ERR_INVALID_OPTION';
    end if;
    if not exists (
      select 1 from public.poll_options o
      where o.id = p_option_id and o.poll_id = p_poll_id
    ) then
      raise exception 'ERR_INVALID_OPTION';
    end if;
  end if;

  insert into public.poll_participations (poll_id, user_id)
  values (p_poll_id, v_actual_voter);

  insert into public.cast_votes (receipt_hash, poll_id, option_id, is_blank)
  values (p_receipt_hash, p_poll_id, p_option_id, p_is_blank);

  return p_receipt_hash;
exception
  when unique_violation then
    raise exception 'ERR_ALREADY_VOTED';
end;
$$;
