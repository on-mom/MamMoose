import { useMemo, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { DiaryEntry } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { useMyName } from '../lib/members';
import { Moose, MooseEmpty } from '../components/Moose';

export const MOODS = ['😍', '🥰', '😌', '😆', '😴', '🥲', '😤', '🤔'];

/** 오늘 날짜를 여행 기간 안으로 클램프 */
function tripToday(p: { startDate: string; endDate: string }): string {
  const t = new Date().toISOString().slice(0, 10);
  if (t < p.startDate) return p.startDate;
  if (t > p.endDate) return p.endDate;
  return t;
}
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${'일월화수목금토'[dt.getDay()]})`;
};

function useDiary() {
  const project = useActiveProject()!;
  const author = useMyName();
  const mutate = useAppStore((s) => s.mutate);
  const add = (text: string, mood?: string, date?: string) => {
    const t = text.trim();
    if (!t) return;
    mutate((doc) => {
      (doc.diary ??= []).push({
        id: uid(), projectId: project.id,
        date: date || tripToday(project), author, text: t, mood,
        createdAt: Date.now(),
      });
    });
  };
  const patch = (id: string, p: Partial<DiaryEntry>) =>
    mutate((doc) => { const e = doc.diary?.find((x) => x.id === id); if (e) Object.assign(e, p); });
  const remove = (id: string) =>
    mutate((doc) => { if (doc.diary) doc.diary = doc.diary.filter((x) => x.id !== id); });
  return { add, patch, remove, author, project };
}

/** 일정 탭에 들어가는 컴팩트 작성칸 */
export function DiaryQuickWrite() {
  const { add, project } = useDiary();
  const [text, setText] = useState('');
  const [mood, setMood] = useState<string>('');
  const submit = () => { add(text, mood || undefined); setText(''); setMood(''); };

  return (
    <div className="rounded-lg bg-moose-dusk/70 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-300">오늘 한 줄 · {fmtDate(tripToday(project))}</span>
        <span className="text-slate-600">MY › 일기에서 모아보기</span>
      </div>
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="한 줄 남기기"
          className="min-w-0 flex-1 rounded-md bg-moose-edge px-2.5 py-1.5 text-xs text-slate-100 outline-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="btn-heart shrink-0 rounded-md px-3 text-xs font-semibold disabled:opacity-40"
        >
          저장
        </button>
      </div>
      <div className="mt-1.5 flex gap-1">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood((v) => (v === m ? '' : m))}
            className={`rounded-md px-1 py-0.5 text-sm transition ${mood === m ? 'bg-moose-heart/25' : 'opacity-45 hover:opacity-100'}`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

/** MY › 일기 — 작성 + 날짜별 피드 */
export default function DiaryView() {
  const entries = useAppStore((s) => s.present[s.activeProjectId]?.diary ?? []);
  const people = useAppStore((s) => s.present[s.activeProjectId]?.people ?? {});
  const { add, patch, remove, author, project } = useDiary();
  const [text, setText] = useState('');
  const [mood, setMood] = useState<string>('');
  const [editId, setEditId] = useState<string | null>(null);

  const submit = () => { add(text, mood || undefined); setText(''); setMood(''); };

  const grouped = useMemo(() => {
    const g = new Map<string, DiaryEntry[]>();
    for (const e of [...entries].sort((a, b) => b.createdAt - a.createdAt)) {
      const arr = g.get(e.date);
      if (arr) arr.push(e);
      else g.set(e.date, [e]);
    }
    return [...g.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  return (
    <div className="space-y-3 overflow-y-auto pb-2">
      {/* 작성 */}
      <div className="card space-y-2 p-3">
        <div className="text-[11px] font-semibold text-slate-300">오늘 한 줄 · {fmtDate(tripToday(project))}</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 어땠어요?"
          rows={2}
          className="w-full resize-none rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood((v) => (v === m ? '' : m))}
                className={`rounded-md px-1 py-0.5 text-base transition ${mood === m ? 'bg-moose-heart/25' : 'opacity-45 hover:opacity-100'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={!text.trim()} className="btn-heart rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-40">
            남기기
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <MooseEmpty line="아직 남긴 한 줄이 없어요" sub="매일 한 줄이면 여행이 통째로 남아요" />
      )}

      {grouped.map(([date, list]) => (
        <div key={date} className="space-y-1.5">
          <div className="px-0.5 text-[11px] font-semibold text-slate-500">{fmtDate(date)}</div>
          {list.map((e) => {
            const p = people[e.author];
            const mine = e.author === author;
            return (
              <div key={e.id} className="rounded-xl border border-white/5 bg-moose-dusk/70 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <div className="h-5 w-5 overflow-hidden rounded-full bg-moose-edge">
                    {p?.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                      : <Moose variant="face" className="h-full w-full object-cover" alt="" />}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">{e.author}</span>
                  {e.mood && <span className="text-sm">{e.mood}</span>}
                  <span className="ml-auto text-[10px] text-slate-600">
                    {new Date(e.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  {mine && editId !== e.id && (
                    <>
                      <button onClick={() => setEditId(e.id)} className="text-slate-600 hover:text-slate-300"><Pencil size={12} /></button>
                      <button onClick={() => remove(e.id)} className="text-slate-600 hover:text-rose-400"><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
                {editId === e.id ? (
                  <EditLine
                    initial={e.text}
                    onSave={(v) => { patch(e.id, { text: v }); setEditId(null); }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div className="text-[13px] leading-relaxed text-slate-100">{e.text}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EditLine({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-start gap-1.5">
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        rows={2}
        className="min-w-0 flex-1 resize-none rounded-lg bg-moose-edge px-2.5 py-1.5 text-[13px] text-slate-100 outline-none"
      />
      <button onClick={() => v.trim() && onSave(v.trim())} className="mt-0.5 rounded-md bg-moose-heart p-1 text-white"><Check size={13} /></button>
      <button onClick={onCancel} className="mt-0.5 rounded-md border border-white/10 p-1 text-slate-400"><X size={13} /></button>
    </div>
  );
}
