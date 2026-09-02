-- ============================================================
--  맘무스 (MamMoose) — Phase 3 스키마
--  Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 RUN.
--  한 번만 실행하면 됩니다. (재실행해도 안전하도록 작성)
-- ============================================================

-- ---------- 1. 프로필 (auth.users 와 1:1) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles readable by all authed" on public.profiles;
create policy "profiles readable by all authed"
  on public.profiles for select to authenticated using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- 가입 시 프로필 자동 생성 (카카오/구글 메타데이터에서 이름·사진 추출)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'user_name',
      '여행자'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. 여행(trip) — doc 에 TripDoc 전체를 jsonb 로 ----------
create table if not exists public.trips (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users on delete cascade,
  meta       jsonb not null default '{}',   -- Project 메타 (이름/목적지/날짜/타임존/항공편)
  doc        jsonb not null default '{}',   -- TripDoc (timeline/restaurants/todos/expenses/messages...)
  updated_at timestamptz default now(),
  updated_by uuid,
  created_at timestamptz default now()
);
alter table public.trips enable row level security;

-- ---------- 3. 멤버십 ----------
create table if not exists public.trip_members (
  trip_id   uuid references public.trips on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  role      text default 'member',
  joined_at timestamptz default now(),
  primary key (trip_id, user_id)
);
alter table public.trip_members enable row level security;

-- 현재 사용자가 해당 여행의 멤버인가? (security definer 로 RLS 재귀 방지)
create or replace function public.is_trip_member(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = t and user_id = auth.uid()
  );
$$;

-- 여행 생성 시 소유자를 멤버로 자동 등록
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_trip_created on public.trips;
create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.add_owner_as_member();

-- trips 정책
drop policy if exists "members read trips"   on public.trips;
drop policy if exists "members update trips" on public.trips;
drop policy if exists "owner insert trips"   on public.trips;
drop policy if exists "owner delete trips"   on public.trips;
create policy "members read trips"   on public.trips for select to authenticated using (public.is_trip_member(id));
create policy "members update trips" on public.trips for update to authenticated using (public.is_trip_member(id));
create policy "owner insert trips"   on public.trips for insert to authenticated with check (auth.uid() = owner);
create policy "owner delete trips"   on public.trips for delete to authenticated using (auth.uid() = owner);

-- trip_members 정책
drop policy if exists "members read membership" on public.trip_members;
drop policy if exists "owner manages members"   on public.trip_members;
create policy "members read membership" on public.trip_members for select to authenticated using (public.is_trip_member(trip_id));
create policy "owner manages members"   on public.trip_members for all to authenticated using (
  exists (select 1 from public.trips where id = trip_id and owner = auth.uid())
);

-- ---------- 4. 초대 코드 ----------
create table if not exists public.invites (
  code        text primary key,
  trip_id     uuid not null references public.trips on delete cascade,
  invited_by  uuid not null references auth.users,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days'),
  accepted_by uuid
);
alter table public.invites enable row level security;

drop policy if exists "trip members manage invites" on public.invites;
create policy "trip members manage invites"
  on public.invites for all to authenticated using (public.is_trip_member(trip_id));

-- 초대 수락: 코드로 여행을 찾아 자신을 멤버로 추가 (security definer)
create or replace function public.accept_invite(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  select trip_id into v_trip
    from public.invites
   where code = invite_code
     and (expires_at is null or expires_at > now());
  if v_trip is null then
    raise exception 'invalid_or_expired_invite';
  end if;
  insert into public.trip_members (trip_id, user_id, role)
    values (v_trip, auth.uid(), 'member')
    on conflict do nothing;
  update public.invites set accepted_by = auth.uid() where code = invite_code;
  return v_trip;
end $$;

-- ---------- 5. 실시간 동기화 ----------
-- trips 행 변경을 멤버들에게 실시간 푸시 (이미 추가돼 있으면 건너뜀)
do $$
begin
  alter publication supabase_realtime add table public.trips;
exception when duplicate_object then null;
end $$;
