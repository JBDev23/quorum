-- Habilitar realtime para encuestas, asistencia y votos
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
