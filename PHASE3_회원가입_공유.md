# Phase 3 — 회원가입(카카오/구글) + 동행자 초대·실시간 공유

결정: **Supabase** (관리형 Postgres + Auth + Realtime). 별도 서버 운영 없음.
프론트는 계속 Railway 배포, 데이터/인증만 Supabase.

## 진행 전 사용자가 준비할 것

1. **Supabase 프로젝트 생성** (supabase.com, 무료 티어)
   → `Project URL`, `anon public key` 를 Railway/`.env` 에 넣기
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. **Google OAuth** — Google Cloud Console에서 OAuth 클라이언트 생성
   → Supabase Auth > Providers > Google 에 Client ID/Secret 입력
   → 승인된 리디렉션 URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. **카카오 OAuth** — Kakao Developers에서 앱 생성, REST API 키 발급
   → Supabase Auth > Providers > Kakao 에 입력
   → Redirect URI 동일하게 등록
4. 배포 도메인(Railway URL)을 Supabase Auth > URL Configuration 의
   Site URL / Redirect URLs 에 추가

위 4개가 되면 나머지(코드)는 이쪽에서 구현.

## 데이터 모델 (초안)

기존 `present[projectId] = TripDoc` 구조를 거의 그대로 원격에 매핑:

```sql
-- 사용자 프로필 (auth.users 확장)
profiles(id uuid pk = auth.uid, display_name text, avatar_url text)

-- 여행 = 프로젝트. doc 는 TripDoc 전체를 jsonb 로 (충돌은 updated_at + 마지막-쓰기-승리)
trips(id uuid pk, owner uuid, meta jsonb, doc jsonb, updated_at timestamptz)

-- 동행자 멤버십
trip_members(trip_id uuid, user_id uuid, role text, primary key(trip_id,user_id))

-- 초대: 코드/링크 발급 → 상대가 수락하면 trip_members 에 추가
invites(id uuid pk, trip_id uuid, code text unique, invited_by uuid,
        expires_at timestamptz, accepted_by uuid null)
```

RLS: `trips`/`doc` 는 `trip_members` 에 속한 사용자만 read/write.
Realtime: `trips` row 변경 구독 → 양쪽 zustand `present` 갱신.

## 코드 작업 (사용자 준비 후)

- `src/lib/supabase.ts` — 클라이언트 (env 없으면 null → 로컬 모드 유지)
- `src/store` — 인증 슬라이스 + 원격 동기화 미들웨어
  (로그인 시 로컬 데이터 1회 업로드 마이그레이션)
- `AuthGate` — PIN 화면에 "카카오로 시작 / 구글로 시작" 추가 (로그인 시 PIN 스킵 옵션)
- MY > 여행 선택 — "동행자 초대" (코드 생성/공유) + "초대 코드 입력해 참여"
- MY > 채팅 — author 를 실제 로그인 사용자로, 메시지도 Realtime

## 현재 상태 (2026-09-03)

**코드: 구현 완료.**
- `src/lib/supabase.ts` — 클라이언트 (env 없으면 null → 로컬 모드)
- `src/store/cloudSync.ts` — 로그인 감지 → 여행 로드/부트스트랩 → 변경 800ms debounce push → Realtime 수신 시 refetch, 초대(`createInvite` / `acceptInvite`)
- `src/store/useAppStore.ts` — `cloudUser`, `hydrateCloud`, `resetLocal` 슬라이스
- `src/components/AuthScreen.tsx` — 카카오 / 구글 / PIN 선택
- `src/tabs/MyTab.tsx` — 채팅 author=로그인 사용자, 여행별 “동행자 초대” 코드, “초대 코드로 참여”, 설정에 로그아웃

**셋업 완료 (2026-09-03):**
- ✅ `supabase/schema.sql` 실행됨 — profiles/trips/trip_members/invites + accept_invite RPC 확인
- ✅ Kakao provider 정상 (로그인 페이지 도달)
- ✅ Google provider 정상 (Client ID 재입력 후 로그인 페이지 도달)

**남은 일:**
1. 사용자가 실제로 카카오/구글 로그인 완료 → 앱 진입 → 여행이 Supabase `trips` 에 저장되는지 확인
2. 동행자 초대 테스트 (2인 필요): 한 명이 MY>여행선택>동행자 초대 코드 생성 → 다른 기기에서 로그인 후 코드 입력
3. (나중) Railway 배포 → `*.up.railway.app` 주소를 Supabase URL Configuration + 카카오/구글 Redirect 에 추가
   → 배포 시 Railway Variables 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 넣어야 함
