# 맘무스 (MamMoose) — 커플 여행 플래너

모바일 전용 여행 통합 관리 웹앱. Vite + React + TS + Tailwind + Zustand + @dnd-kit + big.js.
한글 폰트는 전부 NanumSquare (타이틀만 라틴 Times New Roman).

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

PIN: `250914` (MY > 설정에서 변경, 브라우저 localStorage에 저장)

## 빌드 / 테스트 / 배포

```bash
npm run build    # tsc 타입체크 + vite 프로덕션 빌드 → dist/
npm test         # history / currency / timezone 순수 로직 검증
npm start        # 빌드 결과 정적 서빙 (Railway가 $PORT로 실행)
```

Railway: GitHub 저장소 연결 시 `railway.json` 기준으로 자동 빌드/배포.
Google Maps 키는 Railway 환경변수 `VITE_GOOGLE_MAPS_API_KEY`에 설정
(미설정 시 지도는 Mock Map 박스로 폴백).

## Phase 1 범위 (완료)

| 파일 | 내용 |
|---|---|
| `src/types.ts` | 전체 데이터 스키마 (Project / TimelineItem / Restaurant / Hotel / Spot / Todo / Expense / Chat / Settings) |
| `src/store/useAppStore.ts` | Zustand 전역 스토어 — 다중 여행 데이터 격리, `mutate()` 기반 변경 |
| `src/store/history.ts` | Undo/Redo 3-스택 (past/present/future, 최대 30) — `history.test.mts`로 검증 |
| `src/lib/useUndoRedoHotkeys.ts` | Cmd/Ctrl+Z · Cmd/Ctrl+Shift+Z |
| `src/components/PinAuth.tsx` | 모바일 PIN 키패드 + 에러 shake |
| `src/components/Layout.tsx` · `BottomNav.tsx` | 모바일 프레임 셸 + 하단 5탭 |
| `src/data/seed.ts` | `02_초기_데이터_샘플.xlsx` 자동 파싱 시드 (맛집 80 · 숙소 7 · 관광지 15 · 항공 2) |

## Phase 2 범위 (완료)

| 파일 | 내용 |
|---|---|
| `src/lib/currency.ts` | big.js VND→KRW 정밀 환산 + 무키 환율 API + 24h 캐시 + fallback 0.055 (`currency.test.mts`) |
| `src/lib/timezone.ts` | KST/ICT 벽시계 계산 → 현재 시각 타임라인 블록 자동 포커스 (`timezone.test.mts`) |
| `src/lib/areaCoords.ts` | 하노이 구역 근사 좌표 (시드 장소를 지도에 표시) |
| `src/tabs/ScheduleTab.tsx` | [타임라인] \| [동선] 서브탭 |
| `src/tabs/TimelineView.tsx` | @dnd-kit 크로스-데이 DND, 출발시각·소요시간 필드, 타임존 자동 스크롤 |
| `src/tabs/MapView.tsx` | Google Maps 마커/폴리라인 + 키 없을 때 Mock 인터랙티브 지도, 타임라인 양방향 동기화 |
| `src/tabs/RestaurantsTab.tsx` | 카테고리 필터 · 컬럼 검색/정렬/순서변경 · 수기 등록 · 미니맵 |
| `src/tabs/TodoTab.tsx` | 노션형 체크리스트 · 우선순위 태그 |
| `src/tabs/BudgetTab.tsx` | 6 카테고리(기타 직접입력) · 날짜/카테고리 필터 · 하단 고정 합계 · 1초 debounce 저장 |
| `src/tabs/MyTab.tsx` | [채팅](프로필·배경·HH:mm) \| [여행 선택](다중 프로젝트 격리) \| [설정](PIN 변경) |

## 다음

`VITE_GOOGLE_MAPS_API_KEY` 미설정 상태 — 실제 지도는 키 등록 후 활성화.
회원가입(카카오/구글) 검토 중.
