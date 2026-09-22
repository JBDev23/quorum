-- Proxy voting via meeting_delegations.
-- Drops the 4-arg overload so PostgREST resolves the new signature.

drop function if exists public.cast_ballot(uuid, text, uuid, boolean);

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

  -- Device holder must be accredited
  if not public.is_meeting_attendee(v_meeting_id) then
    raise exception 'Not accredited for this meeting';
  end if;

  -- Own vote: blocked if this user already delegated away
  if p_delegator_id is null then
    if exists (
      select 1
      from public.meeting_delegations d
      where d.meeting_id = v_meeting_id
        and d.delegator_id = v_uid
    ) then
      raise exception 'You have delegated your vote';
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
      raise exception 'Not authorized to vote on behalf of this user';
    end if;
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
  values (p_poll_id, v_actual_voter);

  insert into public.cast_votes (receipt_hash, poll_id, option_id, is_blank)
  values (p_receipt_hash, p_poll_id, p_option_id, p_is_blank);

  return p_receipt_hash;
exception
  when unique_violation then
    raise exception 'Already voted in this poll';
end;
$$;

revoke all on function public.cast_ballot(uuid, text, uuid, boolean, uuid) from public, anon;
grant execute on function public.cast_ballot(uuid, text, uuid, boolean, uuid) to authenticated;

-- Live participation stats should refresh when delegations change
alter table public.meeting_delegations replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.meeting_delegations;
  exception when duplicate_object then null;
  end;
end $$;
