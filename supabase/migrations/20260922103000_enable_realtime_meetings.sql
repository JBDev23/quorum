-- Enable Realtime for meetings so status transitions re-render
-- home, group detail, and in-meeting screens via postgres_changes.

alter table public.meetings replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.meetings;
  exception when duplicate_object then null;
  end;
end $$;
