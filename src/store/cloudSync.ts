// 클라우드 동기화 — 로그인 시에만 활성. 로컬 PIN 모드에는 영향 없음.
// 모델: trips 행 1개 = 여행 1개, doc(jsonb)에 TripDoc 전체.
// ponytail: 문서 전체 last-write-wins 동기화. 2인 여행엔 충분.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore, emptyDoc, flightRows } from './useAppStore';
import { notifyNewComments } from '../lib/notify';
import { mergeDoc, docDiffers } from './mergeDoc';
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
let watchedIds = '';
/** 여행별 "마지막으로 서버와 맞춘 문서" — 3-way 병합의 기준(base) */
const baseDocs: Record<string, TripDoc> = {};

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
  const localPresent = useAppStore.getState().present;
  const docs: Record<string, TripDoc> = {};
  const needPush: string[] = [];
  for (const r of rows) {
    const remote = sanitizeDoc(r.doc);
    const base = baseDocs[r.id];
    const local = localPresent[r.id];
    // 로컬에 아직 서버로 안 올라간 편집이 있으면 항목 단위로 병합, 아니면 서버본 채택
    if (base && local && docDiffers(local, base)) {
      const merged = mergeDoc(base, local, remote) as TripDoc;
      docs[r.id] = merged;
      if (docDiffers(merged, remote)) needPush.push(r.id);
    } else {
      docs[r.id] = remote;
    }
    baseDocs[r.id] = docs[r.id];
  }
  applyingRemote = true;
  useAppStore.getState().hydrateCloud(projects, docs);
  applyingRemote = false;

  const st = useAppStore.getState();
  notifyNewComments(docs, st.cloudUser?.name ?? '', !!st.settings.notifyMemories);
  if (needPush.length) { clearTimeout(pushTimer); pushTimer = setTimeout(() => pushTrip(needPush[0]), 400); }
  startRealtime(rows.map((r) => r.id));
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
  const local = s.present[id];
  const user = s.cloudUser;
  if (!proj || !local || !user) return;

  // 보내기 직전 서버 최신본과 병합 (내 push 가 상대의 최근 편집을 덮지 않도록)
  let toSend: TripDoc = local;
  const { data: cur } = await supabase.from('trips').select('doc').eq('id', id).maybeSingle();
  if (cur?.doc && baseDocs[id]) {
    toSend = mergeDoc(baseDocs[id], local, sanitizeDoc(cur.doc as TripDoc)) as TripDoc;
  }

  const { error } = await supabase
    .from('trips')
    .update({ doc: sanitizeDoc(toSend), meta: stripId(proj), updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id);
  if (error) { err('동기화 실패: ' + error.message); return; }
  err(null);
  baseDocs[id] = toSend;
  if (toSend !== local) {
    applyingRemote = true;
    useAppStore.getState().patchDoc(id, toSend);
    applyingRemote = false;
  }
}

/** 내 여행 id 로 범위를 좁힌 realtime 구독 — 사용자가 많아져도 남의 여행 변경엔 안 깨어남 */
function startRealtime(tripIds: string[]) {
  if (!supabase) return;
  const key = [...tripIds].sort().join(',');
  if (channel && key === watchedIds) return; // 구독 대상 그대로면 유지
  if (channel) { supabase.removeChannel(channel); channel = null; }
  watchedIds = key;
  if (!tripIds.length) return;

  const onChange = (payload: { eventType?: string; new: unknown }) => {
    const me = useAppStore.getState().cloudUser?.id;
    const by = (payload.new as { updated_by?: string } | null)?.updated_by;
    if (payload.eventType === 'UPDATE' && by && by === me) return; // 내 변경 에코 무시
    fetchTrips();
  };
  let ch = supabase.channel('trips-sync');
  // postgres_changes 필터는 절당 값 1개 → id 마다 절을 추가
  for (const id of tripIds) {
    ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${id}` }, onChange);
  }
  channel = ch.subscribe();
}

function teardown() {
  clearTimeout(pushTimer);
  unsubStore?.();
  unsubStore = null;
  bootstrapTried = false;
  watchedIds = '';
  for (const k of Object.keys(baseDocs)) delete baseDocs[k];
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
      await fetchTrips();       // fetchTrips 안에서 내 여행 id 로 realtime 구독
      startPushWatcher();
      await consumePendingInvite();
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

/** 회원 탈퇴 — 여행·멤버십·푸시구독은 물론 인증 계정(auth.users)까지 지우고 로그아웃.
 *  1순위: delete-account Edge Function(서비스 롤 → 계정 완전 삭제).
 *  함수 미배포/실패 시: 클라이언트에서 지울 수 있는 데이터만 정리 (계정 행은 남음). */
export async function deleteMyAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: '클라우드에 연결돼 있지 않아요' };
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return { ok: false, error: '로그인 상태가 아니에요' };

  teardown();

  let fullyDeleted = false;
  try {
    const { data, error } = await supabase.functions.invoke('delete-account');
    if (!error && (data as { ok?: boolean })?.ok) fullyDeleted = true;
  } catch { /* 함수 미배포 → 아래 폴백 */ }

  if (!fullyDeleted) {
    // 폴백: 계정 행은 못 지우지만 내 데이터는 정리
    const { error: e1 } = await supabase.from('trips').delete().eq('owner', uid);
    if (e1) return { ok: false, error: '여행 삭제 실패: ' + e1.message };
    try { await supabase.from('trip_members').delete().eq('user_id', uid); } catch { /* noop */ }
    try { await supabase.from('push_subscriptions').delete().eq('user_id', uid); } catch { /* noop */ }
  }

  await supabase.auth.signOut();
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('mammoose-')).forEach((k) => localStorage.removeItem(k));
  } catch { /* noop */ }
  useAppStore.getState().resetLocal();
  useAppStore.setState({ unlocked: false, cloudError: null });
  return { ok: true };
}

/** 로그인 상태에서 새 여행 생성 — 로컬 임시 id 대신 클라우드에 바로 행을 만들고 활성화.
 *  (로컬 trip-xxx id 는 pushWatcher 가 무시 → 동기화 안 되던 문제 방지) */
export async function createCloudTrip(meta: Omit<Project, 'id'>): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: '클라우드가 꺼져 있습니다' };
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: '로그인이 필요합니다' };
  const doc = emptyDoc();
  doc.timeline = flightRows('cloud', meta);
  const { error } = await supabase.from('trips').insert({ owner: u.user.id, meta, doc });
  if (error) return { ok: false, error: error.message };
  bootstrapTried = true;
  await fetchTrips();
  // fetchTrips 는 created_at 오름차순 → 방금 만든 여행이 목록 마지막
  const ps = useAppStore.getState().projects;
  if (ps.length) useAppStore.getState().setActiveProject(ps[ps.length - 1].id);
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

const PENDING_INVITE_KEY = 'mammoose-pending-invite';

/** 초대 링크(?invite=CODE)로 들어온 경우, 로그인 전이면 코드를 보관해 뒀다가 로그인 후 자동 참여. */
export function stashInviteFromUrl(): void {
  try {
    const code = new URLSearchParams(location.search).get('invite');
    if (!code) return;
    localStorage.setItem(PENDING_INVITE_KEY, code.trim().toUpperCase());
    const url = new URL(location.href);
    url.searchParams.delete('invite');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch { /* noop */ }
}

async function consumePendingInvite(): Promise<void> {
  let code: string | null = null;
  try { code = localStorage.getItem(PENDING_INVITE_KEY); } catch { /* noop */ }
  if (!code) return;
  try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* noop */ }
  const r = await acceptInvite(code);
  err(r.ok ? null : (r.error ?? '초대 참여에 실패했어요'));
}
