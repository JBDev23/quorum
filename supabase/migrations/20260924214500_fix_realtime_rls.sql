-- Fix Supabase Realtime failing to evaluate RLS with SECURITY DEFINER functions.
-- We replace the usage of is_meeting_member and is_group_member with direct subqueries
-- so that auth.uid() maintains its context during Realtime replication.

drop policy if exists meetings_select_member on public.meetings;
create policy meetings_select_member on public.meetings
  for select to authenticated using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = meetings.group_id and gm.user_id = (select auth.uid())
    )
  );

drop policy if exists polls_select_member on public.polls;
create policy polls_select_member on public.polls
  for select to authenticated using (
    exists (
      select 1 from public.meetings m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = polls.meeting_id and gm.user_id = (select auth.uid())
    )
  );

drop policy if exists meeting_attendances_select_member on public.meeting_attendances;
create policy meeting_attendances_select_member on public.meeting_attendances
  for select to authenticated using (
    exists (
      select 1 from public.meetings m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = meeting_attendances.meeting_id and gm.user_id = (select auth.uid())
    )
  );

drop policy if exists poll_participations_select_member on public.poll_participations;
create policy poll_participations_select_member on public.poll_participations
  for select to authenticated using (
    exists (
      select 1 from public.polls p
      join public.meetings m on m.id = p.meeting_id
      join public.group_members gm on gm.group_id = m.group_id
      where p.id = poll_participations.poll_id and gm.user_id = (select auth.uid())
    )
  );

drop policy if exists meeting_delegations_select_member on public.meeting_delegations;
create policy meeting_delegations_select_member on public.meeting_delegations
  for select to authenticated using (
    exists (
      select 1 from public.meetings m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = meeting_delegations.meeting_id and gm.user_id = (select auth.uid())
    )
  );
