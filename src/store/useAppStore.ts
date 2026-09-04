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
  AppSettings, Project, TabKey, TimelineItem, TripDoc, UserProfile,
} from '../types';
import { blankProject, flightTimelineItem } from '../data/seed';
import { commit, undo as histUndo, redo as histRedo } from './history';

const DEFAULT_PIN = '250914';
// 고정 fallback 환율: 1 VND = 0.055 KRW (실시간 API 실패 시)
const DEFAULT_VND_KRW = '0.055';

type Docs = Record<string, TripDoc>;

const uid = () => Math.random().toString(36).slice(2, 10);
const clone = <T,>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));

export function emptyDoc(): TripDoc {
  return { timeline: [], restaurants: [], hotels: [], spots: [], todos: [], expenses: [], messages: [], people: {}, diary: [] };
}

const START_PROJECT = blankProject();
const EMPTY_PROFILE: UserProfile = { displayName: '', avatarDataUrl: null, chatBgDataUrl: null, statusMessage: '' };

/** 여행 항공편 → 타임라인의 항공편 행 (1일차 / 마지막날). 항공편 없으면 빈 배열. */
export function flightRows(projectId: string, p: Pick<Project, 'startDate' | 'endDate' | 'outbound' | 'inbound'>): TimelineItem[] {
  const days = Math.max(1, Math.round((Date.parse(p.endDate) - Date.parse(p.startDate)) / 86400000) + 1);
  const rows: TimelineItem[] = [];
  const has = (f?: { depAirport?: string; flightNo?: string }) => !!(f && (f.depAirport || f.flightNo));
  if (has(p.outbound)) rows.push({ ...flightTimelineItem('outbound', p.outbound!), id: uid(), projectId, day: 1, order: -1 });
  if (has(p.inbound)) rows.push({ ...flightTimelineItem('inbound', p.inbound!), id: uid(), projectId, day: days, order: 99 });
  return rows;
}

export interface CloudUser {
  id: string;
  name: string;
  avatar: string | null;
  email?: string | null;
  /** 로그인 수단 — 'kakao' | 'google' 등 */
  provider?: string | null;
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
  /** 클라우드 로그인 직후 — 이전 세션의 로컬 여행·프로필·테마를 비우고 클라우드만 반영 */
  prepareForCloud: () => void;

  // --- 탭 네비게이션 ---
  activeTab: TabKey;
  /** MY 탭 내 하위 탭(채팅/일기/도구/여행/설정) — 새로고침 유지 */
  mySub: string;
  setMySub: (v: string) => void;
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
      resetLocal: () => {
        const fresh = blankProject();
        set((s) => ({
          cloudUser: null,
          projects: [fresh],
          activeProjectId: fresh.id,
          present: { [fresh.id]: emptyDoc() },
          profile: { ...EMPTY_PROFILE },
          settings: { ...s.settings, themeAccent: undefined, themeBg: undefined, notifyMemories: false },
          past: [],
          future: [],
        }));
      },
      prepareForCloud: () => {
        const fresh = blankProject();
        set((s) => ({
          projects: [fresh],
          activeProjectId: fresh.id,
          present: { [fresh.id]: emptyDoc() },
          profile: { ...EMPTY_PROFILE },
          settings: { ...s.settings, themeAccent: undefined, themeBg: undefined, notifyMemories: false },
          past: [],
          future: [],
        }));
      },

      activeTab: 'schedule',
      // MY 로 새로 들어오면 항상 채팅부터. (같은 탭 내 이동은 mySub 유지 = 새로고침 대비)
      setTab: (t) => set((s) => ({ activeTab: t, ...(t === 'my' && s.activeTab !== 'my' ? { mySub: 'chat' } : {}) })),
      mySub: 'chat',
      setMySub: (v) => set({ mySub: v }),

      projects: [START_PROJECT],
      activeProjectId: START_PROJECT.id,
      setActiveProject: (id) => set({ activeProjectId: id }),
      addProject: (p) => {
        const id = `trip-${uid()}`;
        const doc = emptyDoc();
        doc.timeline = flightRows(id, p);
        set((s) => ({
          projects: [...s.projects, { ...p, id }],
          present: { ...s.present, [id]: doc },
        }));
        return id;
      },
      patchProject: (id, patch) =>
        set((s) => {
          const projects = s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const touchesFlights = ['outbound', 'inbound', 'startDate', 'endDate'].some((k) => k in patch);
          const doc = s.present[id];
          const proj = projects.find((p) => p.id === id);
          if (!touchesFlights || !doc || !proj) return { projects };
          // 항공편/기간이 바뀌면 타임라인 항공편 행 자동 갱신 (사용자 추가 행은 보존)
          const kept = doc.timeline.filter((t) => !t.flightLeg);
          return {
            projects,
            present: { ...s.present, [id]: { ...doc, timeline: [...flightRows(id, proj), ...kept] } },
          };
        }),
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
      version: 11,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted: any, from) => {
        if (from < 9) {
          // 항공편 자동 생성 행에 flightLeg 태그 (수정 시 자동 갱신되도록)
          for (const doc of Object.values(persisted?.present ?? {}) as any[]) {
            for (const t of doc?.timeline ?? []) {
              if (t.flightLeg) continue;
              const pl = String(t.place ?? '');
              if (/→/.test(pl) && /(출국|출발)/.test(pl)) t.flightLeg = 'outbound';
              else if (/→/.test(pl) && /(귀국|입국|귀가)/.test(pl)) t.flightLeg = 'inbound';
            }
          }
        }
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
        if (from < 10) {
          // 예시(샘플) 여행 제거. sample-* 는 무조건 throwaway.
          // hanoi-2026-09(구버전 시드 id)는 사용자가 채운 흔적(메시지/일기/사진)이 없을 때만 삭제.
          const present: Record<string, any> = persisted?.present ?? {};
          const touched = (d: any) => !!(d && (d.messages?.length || d.diary?.length
            || d.timeline?.some((t: any) => t.photos?.length || t.likes?.length || t.comments?.length)));
          const drop = (id: string) => id.startsWith('sample-') || (id === 'hanoi-2026-09' && !touched(present[id]));
          persisted.projects = (persisted?.projects ?? []).filter((p: any) => !drop(p.id));
          for (const k of Object.keys(present)) if (drop(k)) delete present[k];
          if (!persisted.projects.length) {
            const fresh = blankProject();
            persisted.projects = [fresh];
            persisted.present = { ...present, [fresh.id]: emptyDoc() };
            persisted.activeProjectId = fresh.id;
          } else if (!persisted.projects.some((p: any) => p.id === persisted.activeProjectId)) {
            persisted.activeProjectId = persisted.projects[0].id;
          }
        }
        if (from < 11) {
          // 프로필명 입력 중 생긴 people 중복 스냅샷 정리 — 같은 userId 는 가장 긴 이름만 유지
          for (const doc of Object.values(persisted?.present ?? {}) as any[]) {
            const ppl = doc?.people;
            if (!ppl) continue;
            const byUid: Record<string, string[]> = {};
            for (const [k, p] of Object.entries(ppl) as [string, any][]) {
              if (p?.userId) (byUid[p.userId] ??= []).push(k);
            }
            for (const keys of Object.values(byUid)) {
              if (keys.length < 2) continue;
              const keep = [...keys].sort((a, b) => b.length - a.length)[0];
              for (const k of keys) if (k !== keep) delete ppl[k];
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
        activeTab: s.activeTab, // 새로고침해도 보던 탭 유지
        mySub: s.mySub,
      }),
    },
  ),
);

/** 활성 프로젝트 메타 */
export const useActiveProject = (): Project | undefined =>
  useAppStore((s) => s.projects.find((p) => p.id === s.activeProjectId));

export const useCanUndo = () => useAppStore((s) => s.past.length > 0);
export const useCanRedo = () => useAppStore((s) => s.future.length > 0);
