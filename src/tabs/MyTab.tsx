import { useRef, useState } from 'react';
import { Check, LogOut, Plus, Send, Camera, Image as ImageIcon, UserPlus, Copy, AlertTriangle } from 'lucide-react';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { cloudEnabled, signOut } from '../lib/supabase';
import { createInvite, acceptInvite } from '../store/cloudSync';
import { Moose } from '../components/Moose';
import Modal from '../components/Modal';
import { outboundText, inboundText } from '../lib/flight';

type Sub = 'chat' | 'trips' | 'settings';
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
  return (
    <div className="edge flex h-full flex-col py-3">
      <div className="mb-3 flex gap-1 rounded-lg bg-moose-dusk p-1 text-xs">
        {([['chat', '채팅'], ['trips', '여행 선택'], ['settings', '설정']] as const).map(([k, l]) => (
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
      {sub === 'chat' && <Chat />}
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
  const mutate = useAppStore((s) => s.mutate);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);

  const pickImage = (which: 'avatarDataUrl' | 'chatBgDataUrl') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setProfile({ [which]: await readImage(file) }); setErr(''); }
    catch (x) { setErr((x as Error).message); }
  };

  const cloudUser = useAppStore((s) => s.cloudUser);
  const send = () => {
    if (!text.trim()) return;
    mutate((doc) => {
      doc.messages.push({
        id: uid(), projectId: project.id,
        author: cloudUser?.name || profile.displayName || '나', text: text.trim(), sentAt: Date.now(),
      });
    });
    setText('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* 프로필 */}
      <div className="flex items-center gap-3 card p-3">
        <button onClick={() => avatarInput.current?.click()} className="relative">
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
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
          placeholder="프로필명"
          className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
        />
        <button onClick={() => bgInput.current?.click()} className="flex items-center gap-1 text-[11px] text-slate-400">
          <ImageIcon size={13} /> 배경
        </button>
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={pickImage('avatarDataUrl')} />
        <input ref={bgInput} type="file" accept="image/*" hidden onChange={pickImage('chatBgDataUrl')} />
      </div>
      {err && <p className="mt-1 text-[11px] text-rose-400">{err}</p>}

      {/* 메시지 */}
      <div
        className="my-2 flex-1 space-y-2 overflow-y-auto rounded-xl bg-moose-dusk/40 bg-cover bg-center p-3"
        style={profile.chatBgDataUrl ? { backgroundImage: `url(${profile.chatBgDataUrl})` } : undefined}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-8 text-center">
            <Moose variant="face" className="w-16 opacity-90" alt="" />
            <p className="text-xs text-slate-400">동행자와 나눌 이야기를 남겨보세요</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="max-w-[80%] rounded-2xl rounded-tl-sm bg-moose-edge/95 px-3 py-1.5">
            <div className="text-[10px] text-slate-400">{m.author}</div>
            <div className="text-sm text-slate-100">{m.text}</div>
            <div className="text-right text-[10px] text-slate-500">{hhmm(m.sentAt)}</div>
          </div>
        ))}
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
    </div>
  );
}

function Trips() {
  const projects = useAppStore((s) => s.projects);
  const activeId = useAppStore((s) => s.activeProjectId);
  const setActive = useAppStore((s) => s.setActiveProject);
  const addProject = useAppStore((s) => s.addProject);
  const cloudUser = useAppStore((s) => s.cloudUser);
  const [adding, setAdding] = useState(false);
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

  const blankFlight = { date: '', flightNo: '', depAirport: '', depTime: '', arrAirport: '', arrTime: '' };
  const [f, setF] = useState({
    name: '', destination: '', startDate: '', endDate: '', timezone: 'Asia/Ho_Chi_Minh',
    outbound: { ...blankFlight }, inbound: { ...blankFlight },
  });
  const setFlight = (leg: 'outbound' | 'inbound', k: keyof typeof blankFlight) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [leg]: { ...p[leg], [k]: e.target.value } }));
  const hasFlight = (fl: typeof blankFlight) => fl.flightNo || fl.depAirport || fl.date;

  const submit = () => {
    if (!f.name.trim() || !f.startDate || !f.endDate) return;
    const id = addProject({
      name: f.name.trim(), destination: f.destination.trim(),
      startDate: f.startDate, endDate: f.endDate, timezone: f.timezone,
      outbound: hasFlight(f.outbound) ? { ...f.outbound, date: f.outbound.date || f.startDate } : undefined,
      inbound: hasFlight(f.inbound) ? { ...f.inbound, date: f.inbound.date || f.endDate } : undefined,
    });
    setActive(id);
    setAdding(false);
    setF({ name: '', destination: '', startDate: '', endDate: '', timezone: 'Asia/Ho_Chi_Minh', outbound: { ...blankFlight }, inbound: { ...blankFlight } });
  };

  return (
    <div className="space-y-2 overflow-y-auto">
      {projects.map((p) => (
        <div
          key={p.id}
          className={`rounded-xl border p-3 ${
            p.id === activeId ? 'border-moose-heart bg-rose-950/20' : 'border-moose-edge bg-moose-dusk/70'
          }`}
        >
          <button onClick={() => setActive(p.id)} className="flex w-full items-center justify-between text-left">
            <div className="min-w-0">
              <div className="font-title text-sm font-bold text-white">{p.name}</div>
              <div className="truncate text-[11px] text-slate-400">
                {p.destination} · {p.startDate}~{p.endDate}
              </div>
              {outboundText(p) && <div className="truncate text-[10px] text-slate-500">✈ {outboundText(p)}</div>}
              {inboundText(p) && <div className="truncate text-[10px] text-slate-500">✈ {inboundText(p)}</div>}
            </div>
            {p.id === activeId && <Check size={16} className="shrink-0 text-moose-heart" />}
          </button>
          {cloudUser && (
            <div className="mt-2 border-t border-moose-edge pt-2">
              <button onClick={() => makeInvite(p.id, p.name)} className="flex items-center gap-1 text-xs text-moose-heart">
                <UserPlus size={13} /> 동행자 초대
              </button>
            </div>
          )}
        </div>
      ))}

      {cloudUser && (
        <div className="flex gap-2 card border-0 p-2 text-xs">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="초대 코드 입력"
            className="flex-1 rounded bg-moose-edge px-2 py-1.5 font-mono tracking-widest text-slate-100 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600"
          />
          <button onClick={join} className="rounded bg-moose-heart px-3 font-semibold text-white">참여</button>
        </div>
      )}
      {joinMsg && <p className="text-center text-[11px] text-moose-heart">{joinMsg}</p>}

      {adding ? (
        <div className="space-y-2 card border-0 p-3 text-xs">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="여행 이름 *"
            className="w-full rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
          <input value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} placeholder="목적지"
            className="w-full rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
          <div className="flex gap-2">
            <input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })}
              className="flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
            <input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })}
              className="flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
          </div>
          <input value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} placeholder="타임존 (IANA)"
            className="w-full rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />

          {(['outbound', 'inbound'] as const).map((leg) => (
            <div key={leg} className="space-y-1.5 rounded-lg bg-white/[0.03] p-2">
              <div className="text-[10px] font-semibold text-slate-500">{leg === 'outbound' ? '✈ 출국편' : '✈ 귀국편'}</div>
              <div className="flex gap-1.5">
                <input type="date" value={f[leg].date} onChange={setFlight(leg, 'date')}
                  className="min-w-0 flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
                <input value={f[leg].flightNo} onChange={setFlight(leg, 'flightNo')} placeholder="편명"
                  className="w-20 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <input value={f[leg].depAirport} onChange={setFlight(leg, 'depAirport')} placeholder="ICN" maxLength={4}
                  className="w-14 rounded bg-moose-edge px-2 py-1.5 uppercase text-slate-100 outline-none" />
                <input type="time" value={f[leg].depTime} onChange={setFlight(leg, 'depTime')}
                  className="min-w-0 flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
                <span className="text-slate-600">→</span>
                <input value={f[leg].arrAirport} onChange={setFlight(leg, 'arrAirport')} placeholder="HAN" maxLength={4}
                  className="w-14 rounded bg-moose-edge px-2 py-1.5 uppercase text-slate-100 outline-none" />
                <input type="time" value={f[leg].arrTime} onChange={setFlight(leg, 'arrTime')}
                  className="min-w-0 flex-1 rounded bg-moose-edge px-2 py-1.5 text-slate-100 outline-none" />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="px-3 py-1 text-slate-400">취소</button>
            <button onClick={submit} className="rounded btn-heart rounded-xl px-3 py-1 font-semibold">추가</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 py-3 text-xs text-slate-400">
          <Plus size={14} /> 여행 프로젝트 추가
        </button>
      )}
      <p className="pt-1 text-center text-[10px] text-slate-600">여행을 선택하면 일정·맛집·Todo·가계부가 해당 여행 데이터로 전환됩니다</p>

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

function Settings() {
  const settings = useAppStore((s) => s.settings);
  const setPin = useAppStore((s) => s.setPin);
  const lock = useAppStore((s) => s.lock);
  const cloudUser = useAppStore((s) => s.cloudUser);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');

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

      {!cloudUser && (
        <button onClick={lock} className="flex w-full items-center justify-center gap-2 rounded-xl border border-moose-edge py-3 text-slate-300">
          <LogOut size={15} /> 잠금 화면으로
        </button>
      )}
      <p className="text-center text-[10px] text-slate-600">
        맘무스 v0.3 · {cloudEnabled ? '클라우드 연결됨' : '로컬 모드'}
      </p>
    </div>
  );
}
