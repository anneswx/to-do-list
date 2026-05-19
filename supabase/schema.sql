-- Run this in Supabase: SQL Editor → New query → Run
--
-- 1. Replace 'our-couple-list' below with your own secret list id
--    (same value as VITE_LIST_ID in .env and GitHub secrets)
-- 2. Enable Realtime: Table Editor → tasks → Realtime → ON

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id text not null,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_list_created_idx
  on public.tasks (list_id, created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;

-- Shared list: only rows for your list_id (change the string to match VITE_LIST_ID)
create policy "tasks_select"
  on public.tasks for select
  using (list_id = 'our-couple-list');

create policy "tasks_insert"
  on public.tasks for insert
  with check (list_id = 'our-couple-list');

create policy "tasks_update"
  on public.tasks for update
  using (list_id = 'our-couple-list');

create policy "tasks_delete"
  on public.tasks for delete
  using (list_id = 'our-couple-list');
