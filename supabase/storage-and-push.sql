-- ============================================================
--  맘무스 — 사진 저장 + 웹 푸시 준비
--  Supabase 대시보드 → SQL Editor 에 이 파일 전체 붙여넣고 RUN.
--  schema.sql 을 이미 실행한 상태에서 추가로 1회 실행.
--  (재실행해도 안전)
-- ============================================================

-- ---------- 1. trip-photos 버킷 + 정책 ----------
-- 버킷을 SQL 로 생성(대시보드에서 안 만들어졌거나 "Bucket not found" 뜰 때).
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = true;

-- 읽기(SELECT)는 Public 버킷이라 자동 허용. 업로드/삭제만 정책 추가.
drop policy if exists "trip-photos insert" on storage.objects;
create policy "trip-photos insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-photos');

drop policy if exists "trip-photos delete" on storage.objects;
create policy "trip-photos delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'trip-photos');

-- ---------- 2. 웹 푸시 구독 저장 ----------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  display_name text,
  user_agent   text,
  created_at   timestamptz default now(),
  last_used_at timestamptz default now()
);
alter table public.push_subscriptions add column if not exists display_name text;
alter table public.push_subscriptions enable row level security;

drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 발송(Edge Function)은 service_role 로 접근하므로 RLS 우회 — 별도 정책 불필요.

-- ---------- 3. 앱 전역 설정 (VAPID 공개키 등, 선택) ----------
-- 공개키는 클라이언트 env(VITE_VAPID_PUBLIC_KEY)로 넣어도 되고, 여기 저장해도 됨.
create table if not exists public.app_state (
  key   text primary key,
  value text
);
alter table public.app_state enable row level security;
drop policy if exists "app_state read" on public.app_state;
create policy "app_state read"
  on public.app_state for select to authenticated using (true);
