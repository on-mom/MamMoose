// 맘무스(MamMoose) — 커플 여행 플래너 데이터 스키마 (Phase 1)
// 모든 엔티티는 projectId로 여행 프로젝트에 귀속되어 다중 여행 데이터 격리에 쓰인다.

export type TabKey = 'schedule' | 'restaurants' | 'todo' | 'budget' | 'my';

/** 항공편 1편 */
export interface Flight {
  date: string;       // YYYY-MM-DD
  flightNo: string;   // 편명 (예: VJ961)
  carrier?: string;   // 항공사명 (편명으로 자동 채움, 수정 가능)
  depAirport: string; // 출발 공항 코드 (예: ICN)
  depTime: string;    // HH:mm
  arrAirport: string; // 도착 공항 코드 (예: HAN)
  arrTime: string;    // HH:mm
}

/** 여행 단위 (MY 탭 > 여행 선택에서 항공권 정보 기반으로 생성/전환) */
export interface Project {
  id: string;
  name: string;
  destination: string;
  /** ISO 날짜 (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  /** IANA 타임존 — 일정 탭 자동 스크롤의 현지 시각 기준 (예: 'Asia/Ho_Chi_Minh') */
  timezone: string;
  /** 구조화된 항공편 */
  outbound?: Flight;
  inbound?: Flight;
  /** 구버전 자유 텍스트 (하위호환 표시용) */
  outboundFlight?: string;
  inboundFlight?: string;
  /** 이 여행 예산 (KRW). 초과 시 가계부에 "예쁜 지출" 도장 */
  budgetKrw?: number;
  /** 우리 여행 규칙 (고정 메모) */
  rules?: string;
}

/** 일정 탭 > 타임라인 항목. 동선 탭의 지도 마커와 양방향 동기화(Phase 2) */
export interface TimelineItem {
  id: string;
  projectId: string;
  /** 여행 n일차 (1-base) */
  day: number;
  /** 같은 날 안에서의 정렬 순서 (DND로 변경) */
  order: number;
  /** 출발 시각 HH:mm */
  startTime: string;
  /** 예상 소요 시간(분) */
  durationMin: number;
  place: string;
  lat: number | null;
  lng: number | null;
  memo?: string;
  /** 좋아요 누른 참여자 닉네임 */
  likes?: string[];
  /** 코멘트 (참여자별) */
  comments?: TimelineComment[];
  /** 첨부 사진 (Supabase Storage URL 또는 압축 data URL) */
  photos?: string[];
}

/** 참여자 댓글 — 타임라인·장소·맛집·숙소 모달 공용 */
export interface TimelineComment {
  id: string;
  author: string;
  text: string;
  /** epoch ms */
  at: number;
  /** @멘션된 참여자 닉네임 */
  mentions?: string[];
}
export type EntryComment = TimelineComment;

export type RestaurantCategory =
  | '현지식' | '커리' | '카페' | '뷔페' | '베이커리'
  | '고기류' | '쇼핑몰' | '밤문화' | '맛집' | '맛집/브런치' | '공원/나들이' | '기타';

/** 맛집 탭 항목 (초기 시드 + 사용자 수기 등록) */
export interface Restaurant {
  id: string;
  projectId: string;
  /** 원어(구글맵 검색용) 상호명 */
  name: string;
  /** 표에 노출하는 한국어 표기 (없으면 name 사용) */
  nameKo?: string;
  category: RestaurantCategory | string;
  area: string;
  mapUrl: string;
  /** 원문 표기 유지 (예: "180,000~240,000 VND") */
  priceVndText: string;
  priceKrwText: string;
  /** 표기 범위의 평균 VND (정렬/필터용, 0이면 정보 없음) */
  priceVndAvg: number;
  note: string;
  /** 추천/시그니처 메뉴 (있으면 상세 팝업에 표시) */
  menu?: string;
  /** 사용자가 직접 추가한 항목이면 true */
  custom?: boolean;
  /** 상세 모달 댓글 */
  comments?: EntryComment[];
}

/** 숙소 후보 (MY 탭 여행 정보 / 맛집 탭 보조 시드) */
export interface Hotel {
  id: string;
  projectId: string;
  name: string;
  grade: string;
  rating: number;
  address: string;
  priceTotalText: string;
  nearby: string;
  feature: string;
  breakfast: string;
  /** 상세 모달 댓글 */
  comments?: EntryComment[];
}

/** 추천 관광지 (일정/동선 탭 시드) */
export interface Spot {
  id: string;
  projectId: string;
  name: string;
  category: string;
  area: string;
  tip: string;
  nearby: string;
  /** 상세 모달 댓글 */
  comments?: EntryComment[];
}

export type TodoPriority = 'high' | 'mid' | 'low';

/** Todo 탭 — 노션 스타일 체크리스트 항목 */
export interface Todo {
  id: string;
  projectId: string;
  text: string;
  done: boolean;
  priority: TodoPriority;
  order: number;
  /** 담당자 닉네임 (여러 명 가능) */
  assignees?: string[];
  /** @deprecated 단일 담당자 (v8 이전) */
  assignee?: string;
}

export type ExpenseCategory = '숙소' | '쇼핑' | '항공' | '식사' | '체험' | '기타';

/** 가계부 탭 — VND 입력 → KRW 환산 (big.js 정밀 연산, Phase 2) */
export interface Expense {
  id: string;
  projectId: string;
  /** ISO 날짜 YYYY-MM-DD */
  date: string;
  category: ExpenseCategory;
  /** category === '기타'일 때 직접 입력 라벨 */
  categoryEtc?: string;
  vendor: string;
  /** VND 원금 (문자열로 보관해 부동소수점 오차 차단) */
  amountVnd: string;
  /** 환산된 KRW (문자열) */
  amountKrw: string;
}

/** MY 탭 > 채팅 프로필 (내 프로필 — 로컬 보관) */
export interface UserProfile {
  displayName: string;
  avatarDataUrl: string | null;
  chatBgDataUrl: string | null;
  /** 상태 메시지 (카톡식) */
  statusMessage?: string;
}

/** 채팅방 참여자 스냅샷 — TripDoc 에 담겨 동행자에게도 동기화됨 (별도 서버 테이블 없이) */
export interface Person {
  name: string;
  avatar?: string | null;
  bg?: string | null;
  statusMessage?: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  author: string;
  text: string;
  /** epoch ms — 표시 시 HH:mm 로 포맷 */
  sentAt: number;
}

/** 한 줄 일기 — 일정 탭에서 작성, MY 탭 [일기]에서 모아보기 */
export interface DiaryEntry {
  id: string;
  projectId: string;
  /** YYYY-MM-DD */
  date: string;
  author: string;
  text: string;
  /** 기분 이모지 (선택) */
  mood?: string;
  createdAt: number;
  /** 첨부 사진 */
  photos?: string[];
}

/** MY 탭 > 설정 + 앱 전역 설정 */
export interface AppSettings {
  /** 접근 PIN (기본 250914) */
  pin: string;
  /** VND→KRW 고정 환율 (1 VND = ? KRW). 실시간 연동 전까지 고정값 사용 */
  fixedVndToKrw: string;
  /** 환율 모드 */
  rateMode: 'fixed' | 'live';
  /** 여행 후 "추억함 확인" 알림 받기 */
  notifyMemories?: boolean;
}

/** Undo/Redo 대상이 되는 여행 문서 (프로젝트별 데이터 묶음) */
export interface TripDoc {
  timeline: TimelineItem[];
  restaurants: Restaurant[];
  hotels: Hotel[];
  spots: Spot[];
  todos: Todo[];
  expenses: Expense[];
  messages: ChatMessage[];
  /** 채팅 참여자 프로필 스냅샷 (name → Person). 발신·프로필수정 시 갱신 */
  people?: Record<string, Person>;
  /** 한 줄 일기 */
  diary?: DiaryEntry[];
}
