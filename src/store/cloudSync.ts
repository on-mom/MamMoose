// 클라우드 동기화 — 로그인 시에만 활성. 로컬 PIN 모드에는 영향 없음.
// 모델: trips 행 1개 = 여행 1개, doc(jsonb)에 TripDoc 전체.
// ponytail: 문서 전체 last-write-wins 동기화. 2인 여행엔 충분.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from './useAppStore';
import { notifyNewComments } from '../lib/notify';
import type { Project, TripDoc } from '../types';

interface TripRow {
  id: string;
  owner: string;
  meta: Omit<Project, 'id'>;
  doc: TripDoc;
  updated_by: string | null;
}

let applyingRemote = false;
let bootstrapTried = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let channel: RealtimeChannel | null = null;
let unsubStore: (() => void) | null = null;
let currentUid: string | null = null;

const isCloudId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/.test(id);

/** 큰 data URL 이미지가 doc 에 섞여 들어가면 quota/전송 부담 → 제거.
 *  http(s) URL(Storage 업로드분)은 작으므로 유지. */
function sanitizeDoc(doc: TripDoc): TripDoc {
  const big = (v: unknown) => typeof v === 'string' && v.startsWith('data:') && v.length > 60000;
  if (doc?.people) {
    for (const p of Object.values(doc.people)) {
      const o = p as { bg?: unknown; avatar?: unknown };
      if (big(o.bg)) delete o.bg;
      if (big(o.avatar)) delete o.avatar;
    }
  }
  return doc;
}
const stripId = (p: Project): Omit<Project, 'id'> => {
  const rest: Record<string, unknown> = { ...p };
  delete rest.id;
  delete rest.ownerId; // 서버 trips.owner 가 진실 — meta 에 중복 저장 안 함
  return rest as Omit<Project, 'id'>;
};
const err = (msg: string | null) => useAppStore.getState().setCloudError(msg);

async function fetchTrips() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('trips')
    .select('id, owner, meta, doc, updated_by')
    .order('created_at', { ascending: true });
  if (error) { err('여행 목록을 불러오지 못했습니다: ' + error.message); return; }

  const rows = (data ?? []) as TripRow[];
  if (rows.length === 0) {
    if (!bootstrapTried) { bootstrapTried = true; await bootstrapFirstTrip(); }
    return;
  }

  err(null);
  const projects: Project[] = rows.map((r) => ({ ...r.meta, id: r.id, ownerId: r.owner }));
  const docs: Record<string, TripDoc> = {};
  for (const r of rows) docs[r.id] = sanitizeDoc(r.doc);
  applyingRemote = true;
  useAppStore.getState().hydrateCloud(projects, docs);
  applyingRemote = false;

  const st = useAppStore.getState();
  notifyNewComments(docs, st.cloudUser?.name ?? '', !!st.settings.notifyMemories);
}

/** 첫 로그인: 현재 로컬 활성 여행을 클라우드로 1회 올린다 (루프 방지: bootstrapTried) */
async function bootstrapFirstTrip() {
  if (!supabase) return;
  const s = useAppStore.getState();
  const proj = s.projects.find((p) => p.id === s.activeProjectId) ?? s.projects[0];
  const doc = proj ? s.present[proj.id] ?? s.present[s.activeProjectId] : undefined;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !proj) return;

  // 되돌려받기(select) 없이 insert → RLS 반환 타이밍 이슈 회피 → 다시 조회
  const { error } = await supabase
    .from('trips')
    .insert({ owner: userData.user.id, meta: stripId(proj), doc: doc ?? {} });
  if (error) { err('여행을 클라우드에 만들지 못했습니다: ' + error.message); return; }
  await fetchTrips();
}

function startPushWatcher() {
  unsubStore?.();
  unsubStore = useAppStore.subscribe((s, prev) => {
    if (applyingRemote || !useAppStore.getState().cloudUser) return;
    const id = s.activeProjectId;
    if (!isCloudId(id)) return;
    const docChanged = s.present[id] !== prev.present[id];
    const metaChanged = s.projects.find((p) => p.id === id) !== prev.projects.find((p) => p.id === id);
    if (!docChanged && !metaChanged) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushTrip(id), 800);
  });
}

async function pushTrip(id: string) {
  if (!supabase) return;
  const s = useAppStore.getState();
  const proj = s.projects.find((p) => p.id === id);
  const doc = s.present[id];
  const user = s.cloudUser;
  if (!proj || !doc || !user) return;
  const { error } = await supabase
    .from('trips')
    .update({ doc: sanitizeDoc(doc), meta: stripId(proj), updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id);
  if (error) err('동기화 실패: ' + error.message);
  else err(null);
}

function startRealtime() {
  if (!supabase || channel) return;
  channel = supabase
    .channel('trips-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
      const me = useAppStore.getState().cloudUser?.id;
      const by = (payload.new as { updated_by?: string } | null)?.updated_by;
      if (payload.eventType === 'UPDATE' && by && by === me) return; // 내 변경 에코 무시
      fetchTrips();
    })
    .subscribe();
}

function teardown() {
  clearTimeout(pushTimer);
  unsubStore?.();
  unsubStore = null;
  bootstrapTried = false;
  if (channel && supabase) { supabase.removeChannel(channel); channel = null; }
}

export function initCloudSync() {
  if (!supabase) return;
  supabase.auth.onAuthStateChange(async (_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid === currentUid) return;
    currentUid = uid;

    if (session?.user) {
      const m = session.user.user_metadata ?? {};
      // 다른(또는 최초) 계정으로 로그인 → 이전 세션의 로컬 여행·프로필·테마를 비운다.
      // 같은 계정 재접속(토큰 갱신·새로고침)이면 유지.
      const prevUid = useAppStore.getState().cloudUser?.id ?? null;
      if (session.user.id !== prevUid) useAppStore.getState().prepareForCloud();

      useAppStore.getState().setCloudUser({
        id: session.user.id,
        name: m.name || m.full_name || m.nickname || m.user_name || '여행자',
        avatar: m.avatar_url || m.picture || null,
        email: session.user.email ?? m.email ?? null,
        provider: session.user.app_metadata?.provider
          ?? session.user.identities?.[0]?.provider ?? null,
      });
      useAppStore.setState({ unlocked: true });
      bootstrapTried = false;
      await fetchTrips();
      startPushWatcher();
      startRealtime();
    } else {
      teardown();
      useAppStore.getState().resetLocal();
      useAppStore.setState({ unlocked: false, cloudError: null });
    }
  });
}

// ---------- 동행자 초대 ----------
const newCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function createInvite(tripId: string): Promise<{ code?: string; error?: string }> {
  if (!supabase) return { error: '클라우드가 꺼져 있습니다' };
  if (!isCloudId(tripId)) {
    return { error: '이 여행이 아직 클라우드에 저장되지 않았습니다. 잠시 후 다시 시도하세요.' };
  }
  const user = useAppStore.getState().cloudUser;
  if (!user) return { error: '로그인이 필요합니다' };
  const code = newCode();
  const { error } = await supabase.from('invites').insert({ code, trip_id: tripId, invited_by: user.id });
  if (error) return { error: error.message };
  return { code };
}

/** 개설자가 동행자를 여행에서 제외 (trip_members 삭제 → 상대는 접근 불가). */
export async function ejectMember(tripId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase || !isCloudId(tripId)) return { ok: false, error: '클라우드 여행이 아닙니다' };
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** 회원 탈퇴 — 내 클라우드 데이터(여행·멤버십·푸시구독)를 영구 삭제하고 로그아웃. */
export async function deleteMyAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: '클라우드에 연결돼 있지 않아요' };
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return { ok: false, error: '로그인 상태가 아니에요' };

  teardown();
  // 내가 만든 여행 전부 삭제 (trip_members·invites·doc 은 FK cascade)
  const { error: e1 } = await supabase.from('trips').delete().eq('owner', uid);
  if (e1) return { ok: false, error: '여행 삭제 실패: ' + e1.message };
  // 남의 여행에 참여했던 멤버십 · 푸시 구독 정리 (실패해도 계속)
  try { await supabase.from('trip_members').delete().eq('user_id', uid); } catch { /* noop */ }
  try { await supabase.from('push_subscriptions').delete().eq('user_id', uid); } catch { /* noop */ }

  await supabase.auth.signOut();
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('mammoose-')).forEach((k) => localStorage.removeItem(k));
  } catch { /* noop */ }
  useAppStore.getState().resetLocal();
  useAppStore.setState({ unlocked: false, cloudError: null });
  return { ok: true };
}

export async function deleteCloudTrip(tripId: string) {
  if (!supabase || !isCloudId(tripId)) return;
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) err('여행 삭제 실패: ' + error.message);
}

export async function acceptInvite(code: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: '클라우드가 꺼져 있습니다' };
  const { data, error } = await supabase.rpc('accept_invite', { invite_code: code.trim().toUpperCase() });
  if (error) {
    return {
      ok: false,
      error: /invalid_or_expired/.test(error.message) ? '유효하지 않거나 만료된 코드입니다' : error.message,
    };
  }
  bootstrapTried = true; // 참여로 여행이 생겼으니 부트스트랩 불필요
  await fetchTrips();
  if (typeof data === 'string') useAppStore.getState().setActiveProject(data);
  return { ok: true };
}
