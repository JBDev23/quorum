-- Default privileges grant ALL to anon/authenticated; keep SELECT only
-- so mutations go exclusively through SECURITY DEFINER RPCs.
revoke all on table public.meeting_delegations from anon, authenticated, public;
grant select on table public.meeting_delegations to authenticated;
