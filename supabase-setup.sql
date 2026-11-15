-- Supabase Dashboard > SQL Editor에서 실행
-- 각 계정은 자신의 단어장만 읽고 수정할 수 있습니다.
create table if not exists public.moavoca_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.moavoca_data enable row level security;
revoke all on public.moavoca_data from anon;
grant select,insert,update on public.moavoca_data to authenticated;
drop policy if exists "read own data" on public.moavoca_data;
drop policy if exists "insert own data" on public.moavoca_data;
drop policy if exists "update own data" on public.moavoca_data;
create policy "read own data" on public.moavoca_data for select to authenticated using ((select auth.uid())=user_id);
create policy "insert own data" on public.moavoca_data for insert to authenticated with check ((select auth.uid())=user_id);
create policy "update own data" on public.moavoca_data for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
