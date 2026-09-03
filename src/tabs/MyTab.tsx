import { useEffect, useRef, useState } from 'react';
import {
  Check, LogOut, Plus, Send, Camera, Image as ImageIcon, UserPlus, Copy, AlertTriangle,
  MoreVertical, Pencil, Trash2,
} from 'lucide-react';
import type { Project, Person } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { cloudEnabled, signOut } from '../lib/supabase';
import { createInvite, acceptInvite, deleteCloudTrip } from '../store/cloudSync';
import { Moose } from '../components/Moose';
import Modal from '../components/Modal';
import { outboundText, inboundText, carrierOf } from '../lib/flight';
import { CITY_TZ } from '../lib/cities';
import DiaryView from './DiaryView';
import MemoriesView, { useMemoryPicks, tripEnded } from './MemoriesView';
import { ensureNotifyPermission, fireLocalNotification, alreadyNotified, markNotified, canNotify } from '../lib/notify';

type Sub = 'chat' | 'diary' | 'memories' | 'trips' | 'settings';
const hhmm = (ts: number) =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

const readImage = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    if (file.size > 3 * 1024 * 1024) return rej(new Error('3MB 이하 이미지만 가능'));
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export default function MyTab() {
  const [sub, setSub] = useState<Sub>('chat');
  const cloudError = useAppStore((s) => s.cloudError);
  const project = useActiveProject();
  const picks = useMemoryPicks();
  const notifyOn = useAppStore((s) => s.settings.notifyMemories);
  const showMemories = !!project && (tripEnded(project) || picks.length > 0);

  useEffect(() => {
    if (project && notifyOn && tripEnded(project) && picks.length > 0 && !alreadyNotified(project.id)) {
      fireLocalNotification('맘무스 · 추억함', `${project.name} — 둘이 함께 좋아한 ${picks.length}곳이 기다리고 있어요 💗`);
      markNotified(project.id);
    }
  }, [project, notifyOn, picks.length]);

  const tabs: [Sub, string][] = [
    ['chat', '채팅'], ['diary', '일기'],
    ...(showMemories ? [['memories', '추억함'] as [Sub, string]] : []),
    ['trips', '여행'], ['settings', '설정'],
  ];

  return (
    <div className="edge flex h-full flex-col py-3">
      <div className="mb-3 flex gap-1 rounded-lg bg-moose-dusk p-1 text-[11px]">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={`flex-1 rounded-md py-1.5 ${sub === k ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {cloudError && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{cloudError}</span>
        </div>
      )}
      {project && tripEnded(project) && picks.length > 0 && sub !== 'memories' && (
        <button
          onClick={() => setSub('memories')}
          className="mb-2 flex items-center gap-2 rounded-lg bg-moose-heart/12 px-3 py-2 text-left text-[11px] text-moose-heart ring-1 ring-moose-heart/25"
        >
          <span className="text-sm">💗</span>
          여행이 끝났어요 — 추억함에서 둘이 함께 좋아한 {picks.length}곳을 확인해 보세요
        </button>
      )}
      {sub === 'chat' && <Chat />}
      {sub === 'diary' && <DiaryView />}
      {sub === 'memories' && <MemoriesView />}
      {sub === 'trips' && <Trips />}
      {sub === 'settings' && <Settings />}
    </div>
  );
}

function Chat() {
  const project = useActiveProject()!;
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const messages = useAppStore((s) => s.present[s.activeProjectId]?.messages ?? []);
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people ?? {});
  const mutate = useAppStore((s) => s.mutate);
  const cloudUser = useAppStore((s) => s.cloudUser);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [viewPerson, setViewPerson] = useState<Person | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);

  const myName = cloudUser?.name || profile.displayName || '나';
  const myAvatar = cloudUser?.avatar || profile.avatarDataUrl;

  /** 내 프로필 스냅샷을 채팅방(TripDoc)에 반영 — 동행자에게도 동기화됨 */
  const syncMe = (over: Partial<Person> = {}) =>
    mutate((doc) => {
      doc.people = doc.people ?? {};
      doc.people[myName] = {
        name: myName,
        avatar: myAvatar ?? null,
        bg: profile.chatBgDataUrl ?? null,
        statusMessage: profile.statusMessage ?? '',
        ...over,
      };
    });

  const pickImage = (which: 'avatarDataUrl' | 'chatBgDataUrl') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readImage(file);
      setProfile({ [which]: url });
      setErr('');
      syncMe(which === 'avatarDataUrl' ? { avatar: url } : { bg: url });
    } catch (x) { setErr((x as Error).message); }
  };

  const send = () => {
    if (!text.trim()) return;
    mutate((doc) => {
      doc.messages.push({
        id: uid(), projectId: project.id,
        author: myName, text: text.trim(), sentAt: Date.now(),
      });
      doc.people = doc.people ?? {};
      doc.people[myName] = {
        name: myName, avatar: myAvatar ?? null,
        bg: profile.chatBgDataUrl ?? null, statusMessage: profile.statusMessage ?? '',
      };
    });
    setText('');
  };

  const personOf = (name: string): Person =>
    name === myName
      ? { name: myName, avatar: myAvatar ?? null, bg: profile.chatBgDataUrl ?? null, statusMessage: profile.statusMessage }
      : people[name] ?? { name };

  const Avatar = ({ p, onClick }: { p: Person; onClick?: () => void }) => (
    <button onClick={onClick} disabled={!onClick} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-moose-edge">
      {p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" />
        : <Moose variant="face" className="h-full w-full object-cover" alt="" />}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* 내 프로필 */}
      <div className="card space-y-2 p-3">
        <div className="flex items-center gap-3">
          <button onClick={() => avatarInput.current?.click()} className="relative">
            {myAvatar ? (
              <img src={myAvatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 overflow-hidden rounded-full bg-moose-edge">
                <Moose variant="face" className="h-full w-full object-cover" alt="" />
              </div>
            )}
            <Camera size={12} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-moose-night p-[1px] text-slate-300" />
          </button>
          <input
            value={profile.displayName}
            onChange={(e) => setProfile({ displayName: e.target.value })}
            onBlur={() => syncMe()}
            placeholder="프로필명"
            className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
          />
          <button onClick={() => bgInput.current?.click()} className="flex items-center gap-1 text-[11px] text-slate-400">
            <ImageIcon size={13} /> 배경
          </button>
        </div>
        <input
          value={profile.statusMessage ?? ''}
          onChange={(e) => setProfile({ statusMessage: e.target.value })}
          onBlur={() => syncMe()}
          placeholder="상태 메시지"
          className="w-full bg-transparent text-[12px] text-slate-300 outline-none placeholder:text-slate-600"
        />
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={pickImage('avatarDataUrl')} />
        <input ref={bgInput} type="file" accept="image/*" hidden onChange={pickImage('chatBgDataUrl')} />
      </div>
      {err && <p className="mt-1 text-[11px] text-rose-400">{err}</p>}

      {/* 메시지 */}
      <div
        className="my-2 flex-1 space-y-2.5 overflow-y-auto rounded-xl bg-moose-dusk/40 bg-cover bg-center p-3"
        style={profile.chatBgDataUrl ? { backgroundImage: `url(${profile.chatBgDataUrl})` } : undefined}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-8 text-center">
            <Moose variant="face" className="w-16 opacity-90" alt="" />
            <p className="text-xs text-slate-400">동행자와 나눌 이야기를 남겨보세요</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.author === myName;
          const p = personOf(m.author);
          return (
            <div key={m.id} className={`flex items-end gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && <Avatar p={p} onClick={() => setViewPerson(p)} />}
              <div className={`max-w-[76%] ${mine ? 'items-end' : ''}`}>
                {!mine && <div className="mb-0.5 text-[10px] text-slate-400">{m.author}</div>}
                <div className="flex items-end gap-1">
                  {mine && <span className="text-[9px] text-slate-500">{hhmm(m.sentAt)}</span>}
                  <div className={`rounded-2xl px-3 py-1.5 text-sm ${
                    mine ? 'rounded-br-sm bg-moose-heart text-white' : 'rounded-tl-sm bg-moose-edge/95 text-slate-100'
                  }`}>
                    {m.text}
                  </div>
                  {!mine && <span className="text-[9px] text-slate-500">{hhmm(m.sentAt)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="메시지"
          className="flex-1 rounded-full bg-moose-edge px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
        <button onClick={send} className="rounded-full bg-moose-heart px-3 text-white"><Send size={16} /></button>
      </div>

      {viewPerson && (
        <Modal onClose={() => setViewPerson(null)} title={<span className="text-xs font-semibold text-slate-400">프로필</span>}>
          <div className="-mx-5 -my-4">
            <div
              className="h-28 bg-moose-edge bg-cover bg-center"
              style={viewPerson.bg ? { backgroundImage: `url(${viewPerson.bg})` } : undefined}
            />
            <div className="flex flex-col items-center px-4 pb-1">
              <div className="-mt-9 h-16 w-16 overflow-hidden rounded-full border-2 border-moose-night bg-moose-edge">
                {viewPerson.avatar
                  ? <img src={viewPerson.avatar} alt="" className="h-full w-full object-cover" />
                  : <Moose variant="face" className="h-full w-full object-cover" alt="" />}
              </div>
              <div className="mt-2 text-base font-bold text-white">{viewPerson.name}</div>
              {viewPerson.statusMessage
                ? <div className="mt-0.5 text-center text-[13px] text-slate-400">{viewPerson.statusMessage}</div>
                : <div className="mt-0.5 text-[12px] text-slate-600">상태 메시지 없음</div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

type FlightForm = { date: string; flightNo: string; carrier: string; depAirport: string; depTime: string; arrAirport: string; arrTime: string };
type TripFormData = {
  name: string; destination: string; startDate: string; endDate: string; timezone: string;
  outbound: FlightForm; inbound: FlightForm;
};
const BLANK_FLIGHT: FlightForm = { date: '', flightNo: '', carrier: '', depAirport: '', depTime: '', arrAirport: '', arrTime: '' };
const hasFlight = (fl: FlightForm) => fl.flightNo || fl.depAirport || fl.date;

function Trips() {
  const projects = useAppStore((s) => s.projects);
  const activeId = useAppStore((s) => s.activeProjectId);
  const setActive = useAppStore((s) => s.setActiveProject);
  const addProject = useAppStore((s) => s.addProject);
  const patchProject = useAppStore((s) => s.patchProject);
  const removeProject = useAppStore((s) => s.removeProject);
  const cloudUser = useAppStore((s) => s.cloudUser);

  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<Project | null>(null);
  const [modal, setModal] = useState<{ tripName: string; code?: string; error?: string; loading?: boolean } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const makeInvite = async (tripId: string, tripName: string) => {
    setModal({ tripName, loading: true });
    const r = await createInvite(tripId);
    setModal({ tripName, code: r.code, error: r.error });
  };
  const copyCode = () => {
    if (!modal?.code) return;
    navigator.clipboard?.writeText(modal.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const join = async () => {
    if (!joinCode.trim()) return;
    setJoinMsg('참여 중…');
    const r = await acceptInvite(joinCode);
    setJoinMsg(r.ok ? '참여 완료! 여행이 추가되었습니다' : r.error ?? '실패');
    if (r.ok) setJoinCode('');
  };

  const toFlight = (fl: FlightForm, fallbackDate: string): import('../types').Flight | undefined =>
    hasFlight(fl)
      ? { ...fl, date: fl.date || fallbackDate, carrier: fl.carrier || carrierOf(fl.flightNo) || undefined }
      : undefined;

  const saveNew = (d: TripFormData) => {
    const id = addProject({
      name: d.name.trim(), destination: d.destination.trim(),
      startDate: d.startDate, endDate: d.endDate, timezone: d.timezone,
      outbound: toFlight(d.outbound, d.startDate), inbound: toFlight(d.inbound, d.endDate),
    });
    setActive(id);
    setAdding(false);
  };
  const saveEdit = (id: string, d: TripFormData) => {
    patchProject(id, {
      name: d.name.trim(), destination: d.destination.trim(),
      startDate: d.startDate, endDate: d.endDate, timezone: d.timezone,
      outbound: toFlight(d.outbound, d.startDate), inbound: toFlight(d.inbound, d.endDate),
    });
    setEditId(null);
  };
  const confirmDelete = () => {
    if (!delTarget) return;
    if (cloudUser) deleteCloudTrip(delTarget.id);
    removeProject(delTarget.id);
    setDelTarget(null);
  };

  return (
    <div className="space-y-2 overflow-y-auto" onClick={() => setMenuId(null)}>
      {projects.map((p) =>
        editId === p.id ? (
          <TripForm key={p.id} initial={p} onSubmit={(d) => saveEdit(p.id, d)} onCancel={() => setEditId(null)} />
        ) : (
          <div
            key={p.id}
            className={`relative rounded-xl border p-3 ${
              p.id === activeId ? 'border-moose-heart bg-moose-heart/10' : 'border-white/5 bg-moose-dusk/70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => setActive(p.id)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <div className="font-title truncate text-sm font-bold text-white">{p.name}</div>
                  {p.id === activeId && <Check size={14} className="shrink-0 text-moose-heart" />}
                </div>
                <div className="truncate text-[11px] text-slate-400">{p.destination} · {p.startDate}~{p.endDate}</div>
                {outboundText(p) && <div className="truncate text-[10px] text-slate-500">✈ {outboundText(p)}</div>}
                {inboundText(p) && <div className="truncate text-[10px] text-slate-500">✈ {inboundText(p)}</div>}
              </button>
              <div className="relative shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === p.id ? null : p.id); }} className="p-1 text-slate-500">
                  <MoreVertical size={15} />
                </button>
                {menuId === p.id && (
                  <div className="modal-surface absolute right-0 z-20 mt-1 w-24 rounded-lg p-1 text-xs" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setEditId(p.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-slate-200 hover:bg-white/5">
                      <Pencil size={12} /> 수정
                    </button>
                    <button
                      onClick={() => { setDelTarget(p); setMenuId(null); }}
                      disabled={projects.length <= 1}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-rose-400 hover:bg-white/5 disabled:opacity-30"
                    >
                      <Trash2 size={12} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
            {cloudUser && (
              <div className="mt-2 border-t border-white/5 pt-2">
                <button onClick={() => makeInvite(p.id, p.name)} className="flex items-center gap-1 text-xs text-moose-heart">
                  <UserPlus size={13} /> 동행자 초대
                </button>
              </div>
            )}
          </div>
        ),
      )}

      {cloudUser && (
        <div className="flex gap-2 card border-0 p-2 text-xs">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="초대 코드 입력"
            className="flex-1 rounded bg-moose-edge px-2 py-1.5 font-mono tracking-widest text-slate-100 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600"
          />
          <button onClick={join} className="btn-heart rounded-lg px-3 font-semibold">참여</button>
        </div>
      )}
      {joinMsg && <p className="text-center text-[11px] text-moose-heart">{joinMsg}</p>}

      {adding ? (
        <TripForm onSubmit={saveNew} onCancel={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 py-3 text-xs text-slate-400">
          <Plus size={14} /> 여행 프로젝트 추가
        </button>
      )}
      <p className="pt-1 text-center text-[10px] text-slate-600">여행을 선택하면 일정·맛집·Todo·가계부가 해당 여행 데이터로 전환됩니다</p>

      {delTarget && (
        <Modal onClose={() => setDelTarget(null)} title={<span className="text-sm font-semibold text-white">여행 삭제</span>}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setDelTarget(null)} className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300">취소</button>
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white">삭제</button>
            </div>
          }>
          <p className="text-sm text-slate-300"><b className="text-white">{delTarget.name}</b> 여행과 그 안의 일정·맛집·Todo·가계부·채팅이 모두 삭제됩니다. 되돌릴 수 없어요.</p>
          {cloudUser && <p className="mt-2 text-[11px] text-slate-500">클라우드에서도 삭제되며, 동행자 화면에서도 사라집니다.</p>}
        </Modal>
      )}

      {modal && (
        <Modal
          onClose={() => setModal(null)}
          title={<span className="text-xs font-semibold text-slate-400">{modal.tripName} · 동행자 초대</span>}
        >
          <div className="space-y-3 text-center">
            {modal.loading && (
              <div className="flex flex-col items-center gap-2 py-6">
                <Moose variant="face" className="w-14 animate-pulse" alt="" />
                <p className="text-sm text-slate-400">코드 생성 중…</p>
              </div>
            )}

            {modal.error && (
              <div className="space-y-1.5 py-3">
                <AlertTriangle size={22} className="mx-auto text-amber-400" />
                <p className="text-xs leading-relaxed text-amber-300">{modal.error}</p>
              </div>
            )}

            {modal.code && (
              <>
                <div className="rounded-2xl bg-moose-heart/10 py-5">
                  <div className="font-mono text-[34px] font-bold tracking-[0.3em] text-moose-heart">{modal.code}</div>
                </div>
                <button onClick={copyCode} className="btn-heart flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold">
                  <Copy size={15} /> {copied ? '복사됨!' : '코드 복사'}
                </button>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  이 코드를 동행자에게 전달하세요.<br />
                  동행자가 로그인 후 <b className="text-slate-300">MY → 여행 선택 → 초대 코드 입력</b>에 넣으면
                  같은 여행을 함께 편집합니다. (7일간 유효)
                </p>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- 여행 추가/수정 폼 ---------- */
function toForm(p?: Project): TripFormData {
  const fl = (x?: import('../types').Flight): FlightForm => ({ ...BLANK_FLIGHT, ...(x ?? {}), carrier: x?.carrier ?? '' });
  return {
    name: p?.name ?? '', destination: p?.destination ?? '',
    startDate: p?.startDate ?? '', endDate: p?.endDate ?? '',
    timezone: p?.timezone ?? 'Asia/Ho_Chi_Minh',
    outbound: fl(p?.outbound), inbound: fl(p?.inbound),
  };
}

function TripForm({ initial, onSubmit, onCancel }: {
  initial?: Project;
  onSubmit: (d: TripFormData) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<TripFormData>(() => toForm(initial));
  const inp = 'rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none';
  const setLeg = (leg: 'outbound' | 'inbound', k: keyof FlightForm, v: string) =>
    setD((p) => ({ ...p, [leg]: { ...p[leg], [k]: v } }));
  const valid = d.name.trim() && d.startDate && d.endDate;

  return (
    <div className="space-y-2 card border-0 p-3 text-xs">
      <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="여행 이름 *" className={`w-full ${inp}`} />
      <input value={d.destination} onChange={(e) => setD({ ...d, destination: e.target.value })} placeholder="목적지 (예: 베트남 하노이)" className={`w-full ${inp}`} />
      <div className="flex gap-2">
        <input type="date" value={d.startDate} onChange={(e) => setD({ ...d, startDate: e.target.value })} className={`flex-1 ${inp}`} />
        <input type="date" value={d.endDate} onChange={(e) => setD({ ...d, endDate: e.target.value })} className={`flex-1 ${inp}`} />
      </div>
      <label className="block">
        <span className="text-[10px] text-slate-500">현지 시간대 (여행지)</span>
        <select value={d.timezone} onChange={(e) => setD({ ...d, timezone: e.target.value })} className={`mt-0.5 w-full ${inp}`}>
          {CITY_TZ.map((c) => <option key={c.tz} value={c.tz}>{c.label}</option>)}
        </select>
      </label>

      {(['outbound', 'inbound'] as const).map((leg) => {
        const f = d[leg];
        const auto = carrierOf(f.flightNo);
        return (
          <div key={leg} className="space-y-1.5 rounded-lg bg-white/[0.03] p-2">
            <div className="text-[10px] font-semibold text-slate-500">{leg === 'outbound' ? '✈ 출국편' : '✈ 귀국편'}</div>
            <div className="flex gap-1.5">
              <input type="date" value={f.date} onChange={(e) => setLeg(leg, 'date', e.target.value)} className={`min-w-0 flex-1 ${inp}`} />
              <input
                value={f.flightNo}
                onChange={(e) => setLeg(leg, 'flightNo', e.target.value)}
                placeholder="편명 VJ961" className={`w-24 ${inp}`}
              />
            </div>
            <input
              value={f.carrier || auto}
              onChange={(e) => setLeg(leg, 'carrier', e.target.value)}
              placeholder="항공사 (편명 입력 시 자동)"
              className={`w-full ${inp} ${!f.carrier && auto ? 'text-emerald-400' : ''}`}
            />
            <div className="flex items-center gap-1.5">
              <input value={f.depAirport} onChange={(e) => setLeg(leg, 'depAirport', e.target.value.toUpperCase())} placeholder="ICN" maxLength={4} className={`w-14 uppercase ${inp}`} />
              <input type="time" value={f.depTime} onChange={(e) => setLeg(leg, 'depTime', e.target.value)} className={`min-w-0 flex-1 ${inp}`} />
              <span className="text-slate-600">→</span>
              <input value={f.arrAirport} onChange={(e) => setLeg(leg, 'arrAirport', e.target.value.toUpperCase())} placeholder="HAN" maxLength={4} className={`w-14 uppercase ${inp}`} />
              <input type="time" value={f.arrTime} onChange={(e) => setLeg(leg, 'arrTime', e.target.value)} className={`min-w-0 flex-1 ${inp}`} />
            </div>
          </div>
        );
      })}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1 text-slate-400">취소</button>
        <button onClick={() => valid && onSubmit(d)} disabled={!valid} className="btn-heart rounded-xl px-4 py-1.5 font-semibold disabled:opacity-40">
          {initial ? '저장' : '추가'}
        </button>
      </div>
    </div>
  );
}

function Settings() {
  const settings = useAppStore((s) => s.settings);
  const setPin = useAppStore((s) => s.setPin);
  const setNotifyMemories = useAppStore((s) => s.setNotifyMemories);
  const lock = useAppStore((s) => s.lock);
  const cloudUser = useAppStore((s) => s.cloudUser);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');

  const toggleNotify = async () => {
    if (settings.notifyMemories) { setNotifyMemories(false); return; }
    setNotifyMemories(await ensureNotifyPermission());
  };

  const changePin = () => {
    if (cur !== settings.pin) return setMsg('현재 PIN이 일치하지 않습니다');
    if (!/^\d{6}$/.test(next)) return setMsg('새 PIN은 6자리 숫자여야 합니다');
    setPin(next);
    setCur(''); setNext(''); setMsg('PIN이 변경되었습니다');
  };

  return (
    <div className="space-y-4 overflow-y-auto text-sm">
      {cloudUser ? (
        <section className="space-y-3 card p-3">
          <div className="flex items-center gap-3">
            {cloudUser.avatar
              ? <img src={cloudUser.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              : <div className="h-10 w-10 overflow-hidden rounded-full bg-moose-edge"><Moose variant="face" className="h-full w-full object-cover" alt="" /></div>}
            <div>
              <div className="font-semibold text-white">{cloudUser.name}</div>
              <div className="text-[11px] text-emerald-400">클라우드 로그인됨 · 동행자와 실시간 동기화</div>
            </div>
          </div>
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-slate-300">
            <LogOut size={14} /> 로그아웃
          </button>
        </section>
      ) : (
        <section className="space-y-2 card p-3">
          <h3 className="font-semibold text-white">PIN 번호 변경</h3>
          <input value={cur} onChange={(e) => setCur(e.target.value)} inputMode="numeric" maxLength={6}
            placeholder="현재 PIN" className="w-full rounded bg-moose-edge px-3 py-2 text-slate-100 outline-none" />
          <input value={next} onChange={(e) => setNext(e.target.value)} inputMode="numeric" maxLength={6}
            placeholder="새 PIN (6자리)" className="w-full rounded bg-moose-edge px-3 py-2 text-slate-100 outline-none" />
          {msg && <p className="text-xs text-moose-heart">{msg}</p>}
          <button onClick={changePin} className="w-full rounded-lg btn-heart py-2 font-semibold">변경</button>
        </section>
      )}

      <section className="card p-3">
        <label className="flex items-center justify-between gap-2">
          <span>
            <span className="font-semibold text-white">여행 후 추억함 알림</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {canNotify()
                ? '여행이 끝나면 “둘이 함께 좋아한 곳” 알림을 보내드려요'
                : '이 브라우저는 알림을 지원하지 않아요'}
            </span>
          </span>
          <button
            role="switch"
            aria-checked={!!settings.notifyMemories}
            disabled={!canNotify()}
            onClick={toggleNotify}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              settings.notifyMemories ? 'bg-moose-heart' : 'bg-white/15'
            } disabled:opacity-40`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${settings.notifyMemories ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </label>
      </section>

      {!cloudUser && (
        <button onClick={lock} className="flex w-full items-center justify-center gap-2 rounded-xl border border-moose-edge py-3 text-slate-300">
          <LogOut size={15} /> 잠금 화면으로
        </button>
      )}
      <p className="text-center text-[10px] text-slate-600">
        맘무스 v0.4 · {cloudEnabled ? '클라우드 연결됨' : '로컬 모드'}
      </p>
    </div>
  );
}
