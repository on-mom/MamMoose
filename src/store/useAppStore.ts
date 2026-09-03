import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** localStorage 래퍼 — 용량 초과(quota)로 저장 실패해도 앱이 죽지 않게. */
const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => {
    try { localStorage.setItem(k, v); }
    catch (e) {
      console.warn('[mammoose] 로컬 저장 실패(용량 초과 가능). 클라우드 로그인 시 안전합니다.', e);
    }
  },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* noop */ } },
};
import type {
  AppSettings, Project, TabKey, TripDoc, UserProfile,
} from '../types';
import {
  SEED_PROJECT, SEED_RESTAURANTS, SEED_HOTELS, SEED_SPOTS, SEED_TIMELINE,
  HANOI_PROJECT, blankProject,
} from '../data/seed';
import { commit, undo as histUndo, redo as histRedo } from './history';

const DEFAULT_PIN = '250914';
// 고정 fallback 환율: 1 VND = 0.055 KRW (실시간 API 실패 시)
const DEFAULT_VND_KRW = '0.055';

type Docs = Record<string, TripDoc>;

const uid = () => Math.random().toString(36).slice(2, 10);
const clone = <T,>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));

function emptyDoc(): TripDoc {
  return { timeline: [], restaurants: [], hotels: [], spots: [], todos: [], expenses: [], messages: [], people: {}, diary: [] };
}

/** 하노이 예시 데이터를 프로젝트에 귀속시켜 문서 생성 */
function hanoiDoc(projectId: string): TripDoc {
  return {
    ...emptyDoc(),
    timeline: SEED_TIMELINE.map((t) => ({ ...t, id: uid(), projectId })),
    restaurants: SEED_RESTAURANTS.map((r) => ({ ...r, id: uid(), projectId })),
    hotels: SEED_HOTELS.map((h) => ({ ...h, id: uid(), projectId })),
    spots: SEED_SPOTS.map((s) => ({ ...s, id: uid(), projectId })),
  };
}
const START_PROJECT = blankProject();

export interface CloudUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface AppState {
  // --- 인증 & 진입 ---
  unlocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;

  // --- 클라우드 계정 (카카오/구글 로그인 시에만 채워짐. null = 로컬 PIN 모드) ---
  cloudUser: CloudUser | null;
  /** 클라우드 동기화 상태/오류 메시지 (null = 정상) */
  cloudError: string | null;
  setCloudError: (msg: string | null) => void;
  /** 로그인/로그아웃 시 cloudSync 가 호출 */
  setCloudUser: (u: CloudUser | null) => void;
  /** 클라우드에서 받은 여행 목록/문서로 전체 교체 */
  hydrateCloud: (projects: Project[], docs: Docs) => void;
  /** 로컬 빈 여행 상태로 초기화 (로그아웃) */
  resetLocal: () => void;
  /** 하노이 예시 여행을 추가 (MY › 여행 "예시 불러오기") */
  loadHanoiSample: () => string;

  // --- 탭 네비게이션 ---
  activeTab: TabKey;
  setTab: (t: TabKey) => void;

  // --- 다중 여행 프로젝트 ---
  projects: Project[];
  activeProjectId: string;
  setActiveProject: (id: string) => void;
  addProject: (p: Omit<Project, 'id'>) => string;
  patchProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // --- Undo/Redo 히스토리 스택 (여행 문서 전체 스냅샷) ---
  past: Docs[];
  present: Docs;
  future: Docs[];
  undo: () => void;
  redo: () => void;

  // --- 문서 변경 (activeProjectId 문서에 적용, 자동 히스토리 기록) ---
  mutate: (recipe: (doc: TripDoc) => void) => void;
  /** 현재 활성 프로젝트의 문서 (없으면 빈 문서) */
  activeDoc: () => TripDoc;

  // --- 프로필 / 설정 (히스토리 비대상) ---
  profile: UserProfile;
  setProfile: (patch: Partial<UserProfile>) => void;
  settings: AppSettings;
  setPin: (next: string) => void;
  setRate: (patch: Partial<Pick<AppSettings, 'fixedVndToKrw' | 'rateMode'>>) => void;
  setNotifyMemories: (on: boolean) => void;
  setTheme: (patch: Partial<Pick<AppSettings, 'themeAccent' | 'themeBg'>>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      unlocked: false,
      unlock: (pin) => {
        const ok = pin === get().settings.pin;
        if (ok) set({ unlocked: true });
        return ok;
      },
      lock: () => set({ unlocked: false }),

      cloudUser: null,
      cloudError: null,
      setCloudError: (msg) => set({ cloudError: msg }),
      setCloudUser: (u) => set({ cloudUser: u }),
      hydrateCloud: (projects, docs) =>
        set((s) => ({
          projects: projects.length ? projects : s.projects,
          present: docs,
          activeProjectId:
            projects.find((p) => p.id === s.activeProjectId)?.id ?? projects[0]?.id ?? s.activeProjectId,
          past: [],
          future: [],
        })),
      resetLocal: () =>
        set({
          cloudUser: null,
          projects: [START_PROJECT],
          activeProjectId: START_PROJECT.id,
          present: { [START_PROJECT.id]: emptyDoc() },
          past: [],
          future: [],
        }),
      loadHanoiSample: () => {
        const id = HANOI_PROJECT.id;
        set((s) => ({
          projects: s.projects.some((p) => p.id === id) ? s.projects : [...s.projects, { ...HANOI_PROJECT }],
          present: { ...s.present, [id]: s.present[id] ?? hanoiDoc(id) },
          activeProjectId: id,
          past: [], future: [],
        }));
        return id;
      },

      activeTab: 'schedule',
      setTab: (t) => set({ activeTab: t }),

      projects: [START_PROJECT],
      activeProjectId: START_PROJECT.id,
      setActiveProject: (id) => set({ activeProjectId: id }),
      addProject: (p) => {
        const id = `trip-${uid()}`;
        const doc = emptyDoc();
        const totalDays = Math.max(1, Math.round((Date.parse(p.endDate) - Date.parse(p.startDate)) / 86400000) + 1);
        // 항공편이 있으면 1일차/마지막날 고정 항목으로
        if (p.outbound) doc.timeline.push({
          id: uid(), projectId: id, day: 1, order: -1,
          startTime: p.outbound.depTime || '00:00', durationMin: 120,
          place: `${p.outbound.depAirport} → ${p.outbound.arrAirport} 출국 (${p.outbound.flightNo})`,
          lat: null, lng: null, memo: '',
        });
        if (p.inbound) doc.timeline.push({
          id: uid(), projectId: id, day: totalDays, order: 99,
          startTime: p.inbound.depTime || '00:00', durationMin: 120,
          place: `${p.inbound.depAirport} → ${p.inbound.arrAirport} 귀국 (${p.inbound.flightNo})`,
          lat: null, lng: null, memo: '',
        });
        set((s) => ({
          projects: [...s.projects, { ...p, id }],
          present: { ...s.present, [id]: doc },
        }));
        return id;
      },
      patchProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProject: (id) =>
        set((s) => {
          if (s.projects.length <= 1) return s; // 마지막 1개는 삭제 불가
          const projects = s.projects.filter((p) => p.id !== id);
          const present = { ...s.present };
          delete present[id];
          const activeProjectId = s.activeProjectId === id ? projects[0].id : s.activeProjectId;
          return { projects, present, activeProjectId, past: [], future: [] };
        }),

      past: [],
      present: { [START_PROJECT.id]: emptyDoc() },
      future: [],
      undo: () => set((s) => histUndo(s)),
      redo: () => set((s) => histRedo(s)),

      mutate: (recipe) =>
        set((s) => {
          const pid = s.activeProjectId;
          const nextPresent = clone(s.present);
          if (!nextPresent[pid]) nextPresent[pid] = emptyDoc();
          recipe(nextPresent[pid]);
          return commit(s, nextPresent);
        }),
      activeDoc: () => get().present[get().activeProjectId] ?? emptyDoc(),

      profile: { displayName: '', avatarDataUrl: null, chatBgDataUrl: null },
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      settings: { pin: DEFAULT_PIN, fixedVndToKrw: DEFAULT_VND_KRW, rateMode: 'fixed' },
      setPin: (next) => set((s) => ({ settings: { ...s.settings, pin: next } })),
      setRate: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setNotifyMemories: (on) => set((s) => ({ settings: { ...s.settings, notifyMemories: on } })),
      setTheme: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'mammoose-store',
      version: 8,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted: any, from) => {
        if (from < 8) {
          // Todo 담당자 단일 → 배열
          for (const doc of Object.values(persisted?.present ?? {}) as any[]) {
            for (const t of doc?.todos ?? []) {
              if (t.assignee && !t.assignees) t.assignees = [t.assignee];
              delete t.assignee;
            }
          }
        }
        if (from < 2 && persisted?.settings?.fixedVndToKrw === '0.0546') {
          persisted.settings.fixedVndToKrw = DEFAULT_VND_KRW;
        }
        if (from < 7) {
          // 프로필 사진/배경이 큰 data URL 로 저장돼 있으면 제거 (quota 초과 원인).
          // 앞으로는 로그인 시 Storage URL 로만 저장됨. 사용자가 다시 올리면 됨.
          const big = (v: any) => typeof v === 'string' && v.startsWith('data:') && v.length > 120000;
          if (persisted?.profile) {
            if (big(persisted.profile.chatBgDataUrl)) persisted.profile.chatBgDataUrl = null;
            if (big(persisted.profile.avatarDataUrl)) persisted.profile.avatarDataUrl = null;
          }
          for (const doc of Object.values(persisted?.present ?? {}) as any[]) {
            for (const p of Object.values(doc?.people ?? {}) as any[]) {
              if (big(p?.bg)) delete p.bg;
              if (big(p?.avatar)) delete p.avatar;
            }
          }
        }
        if (from < 6) {
          // 채팅 배경(bg)은 더 이상 동기화 안 함 — 용량 큰 사진이 doc/localStorage quota 초과시킴.
          // 기존에 저장된 people[*].bg 제거.
          for (const doc of Object.values(persisted?.present ?? {}) as any[]) {
            for (const p of Object.values(doc?.people ?? {}) as any[]) {
              if (p && 'bg' in p) delete p.bg;
            }
          }
        }
        if (from < 4) {
          // 시드 여행에 구조화된 항공편 주입 (자유 텍스트 → 구조화)
          for (const p of persisted?.projects ?? []) {
            if (p.id === SEED_PROJECT.id && !p.outbound) {
              p.outbound = SEED_PROJECT.outbound;
              p.inbound = SEED_PROJECT.inbound;
            }
          }
        }
        if (from < 3) {
          // 최신 시드의 nameKo/menu 를 기존 맛집 데이터에 이름으로 병합 (수기 등록분은 보존)
          const bySeed = new Map(SEED_RESTAURANTS.map((r) => [r.name, r]));
          for (const doc of Object.values(persisted?.present ?? {}) as TripDoc[]) {
            for (const r of doc?.restaurants ?? []) {
              const seed = bySeed.get(r.name);
              if (seed) {
                if (!r.nameKo && seed.nameKo) r.nameKo = seed.nameKo;
                if (!r.menu && seed.menu) r.menu = seed.menu;
              }
            }
          }
        }
        return persisted;
      },
      // 히스토리 스택과 임시 탭 상태는 저장하지 않는다
      partialize: (s) => ({
        unlocked: s.unlocked,
        cloudUser: s.cloudUser,
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        present: s.present,
        profile: s.profile,
        settings: s.settings,
      }),
    },
  ),
);

/** 활성 프로젝트 메타 */
export const useActiveProject = (): Project | undefined =>
  useAppStore((s) => s.projects.find((p) => p.id === s.activeProjectId));

export const useCanUndo = () => useAppStore((s) => s.past.length > 0);
export const useCanRedo = () => useAppStore((s) => s.future.length > 0);
