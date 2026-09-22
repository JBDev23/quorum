-- Device Expo push tokens + server-side dispatch triggers for meeting/poll events.
-- Aligned with remote migration 20260917185549_device_push_tokens.

create extension if not exists pg_net with schema extensions;

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  constraint device_push_tokens_token_unique unique (expo_push_token)
);

create index if not exists device_push_tokens_user_id_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Users can select own push tokens" on public.device_push_tokens;
create policy "Users can select own push tokens"
  on public.device_push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push tokens" on public.device_push_tokens;
create policy "Users can insert own push tokens"
  on public.device_push_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push tokens" on public.device_push_tokens;
create policy "Users can update own push tokens"
  on public.device_push_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push tokens" on public.device_push_tokens;
create policy "Users can delete own push tokens"
  on public.device_push_tokens
  for delete
  to authenticated
  using (auth.uid() = user_id);

create schema if not exists private;

create or replace function private.dispatch_push_event(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  edge_url text := 'https://nzslsspkfuhyiexwxyii.supabase.co/functions/v1/dispatch-push';
  secret text;
begin
  select ds.decrypted_secret
    into secret
  from vault.decrypted_secrets ds
  where ds.name = 'push_dispatch_secret'
  limit 1;

  if secret is null or length(secret) = 0 then
    raise warning 'push_dispatch_secret not configured in vault; skipping push dispatch';
    return;
  end if;

  perform net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', secret
    ),
    body := payload
  );
end;
$$;

revoke all on function private.dispatch_push_event(jsonb) from public;

create or replace function public.trg_meetings_dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status in ('scheduled', 'accreditation')
  then
    perform private.dispatch_push_event(
      jsonb_build_object(
        'event', case new.status
          when 'scheduled' then 'meeting_scheduled'
          when 'accreditation' then 'doors_open'
        end,
        'meeting_id', new.id,
        'group_id', new.group_id,
        'title', new.title
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists meetings_dispatch_push on public.meetings;
create trigger meetings_dispatch_push
  after update of status on public.meetings
  for each row
  execute function public.trg_meetings_dispatch_push();

create or replace function public.trg_polls_dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meeting_title text;
  meeting_group_id uuid;
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'active'
  then
    select m.title, m.group_id
      into meeting_title, meeting_group_id
    from public.meetings m
    where m.id = new.meeting_id;

    perform private.dispatch_push_event(
      jsonb_build_object(
        'event', 'poll_active',
        'meeting_id', new.meeting_id,
        'poll_id', new.id,
        'group_id', meeting_group_id,
        'title', coalesce(new.title, meeting_title, 'Votación')
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists polls_dispatch_push on public.polls;
create trigger polls_dispatch_push
  after update of status on public.polls
  for each row
  execute function public.trg_polls_dispatch_push();

grant select, insert, update, delete on public.device_push_tokens to authenticated;
