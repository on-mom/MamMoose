import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Todo, TodoPriority } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { useMemberNames } from '../lib/members';
import { MooseEmpty } from '../components/Moose';

const PRIO: Record<TodoPriority, { label: string; cls: string }> = {
  high: { label: '높음', cls: 'bg-rose-500/20 text-rose-300' },
  mid: { label: '보통', cls: 'bg-amber-500/20 text-amber-300' },
  low: { label: '낮음', cls: 'bg-slate-600/30 text-slate-300' },
};
const PRIOS: TodoPriority[] = ['high', 'mid', 'low'];
const RANK: Record<TodoPriority, number> = { high: 0, mid: 1, low: 2 };
const UNASSIGNED = '미지정';

export default function TodoTab() {
  const project = useActiveProject()!;
  const todos = useAppStore((s) => s.present[s.activeProjectId]?.todos ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const members = useMemberNames();
  const [text, setText] = useState('');
  const [groupByPrio, setGroupByPrio] = useState(false);
  const [who, setWho] = useState<string>('전체');

  const add = () => {
    if (!text.trim()) return;
    mutate((doc) => {
      doc.todos.unshift({
        id: uid(), projectId: project.id, text: text.trim(),
        done: false, priority: 'mid', order: -Date.now(),
      });
    });
    setText('');
  };
  const patch = (id: string, p: Partial<Todo>) =>
    mutate((doc) => { const t = doc.todos.find((x) => x.id === id); if (t) Object.assign(t, p); });
  const remove = (id: string) =>
    mutate((doc) => { doc.todos = doc.todos.filter((x) => x.id !== id); });

  // 담당자 필터 칩: 참여자 + 실제 배정된 담당자 + 미지정
  const assignees = Array.from(
    new Set([...members, ...todos.map((t) => t.assignee).filter(Boolean) as string[]]),
  );
  const hasUnassigned = todos.some((t) => !t.assignee);

  const visible = todos.filter((t) =>
    who === '전체' ? true : who === UNASSIGNED ? !t.assignee : t.assignee === who,
  );
  const sorted = [...visible].sort((a, b) =>
    Number(a.done) - Number(b.done) ||
    (groupByPrio ? RANK[a.priority] - RANK[b.priority] : 0) ||
    a.order - b.order,
  );
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="edge space-y-3 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl font-bold text-white">Todo</h2>
        <span className="text-xs text-slate-500">{doneCount}/{todos.length} 완료</span>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="할 일 추가"
          className="flex-1 rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
        <button onClick={add} className="rounded-lg bg-moose-heart px-3 text-white"><Plus size={16} /></button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <input type="checkbox" checked={groupByPrio} onChange={(e) => setGroupByPrio(e.target.checked)} />
          우선순위순
        </label>
        {(assignees.length > 0 || hasUnassigned) && (
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {['전체', ...assignees, ...(hasUnassigned ? [UNASSIGNED] : [])].map((a) => (
              <button
                key={a}
                onClick={() => setWho(a)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] transition ${
                  who === a ? 'bg-moose-heart/25 text-moose-heart ring-1 ring-moose-heart/40' : 'bg-white/5 text-slate-400'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-1">
        {sorted.map((t) => (
          <li
            key={t.id}
            className="group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-2 hover:bg-moose-dusk/60"
          >
            <GripVertical size={14} className="shrink-0 text-moose-edge" />
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => patch(t.id, { done: e.target.checked })}
              className="h-4 w-4 shrink-0 accent-moose-heart"
            />
            <input
              key={t.text}
              defaultValue={t.text}
              onBlur={(e) => e.target.value.trim() && e.target.value !== t.text && patch(t.id, { text: e.target.value.trim() })}
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                t.done ? 'text-slate-600 line-through' : 'text-slate-100'
              }`}
            />
            <select
              value={t.priority}
              onChange={(e) => patch(t.id, { priority: e.target.value as TodoPriority })}
              className={`shrink-0 rounded-full border-0 px-2 py-0.5 text-[10px] outline-none ${PRIO[t.priority].cls}`}
            >
              {PRIOS.map((p) => <option key={p} value={p} className="bg-moose-edge text-slate-100">{PRIO[p].label}</option>)}
            </select>
            <select
              value={t.assignee ?? ''}
              onChange={(e) => patch(t.id, { assignee: e.target.value || undefined })}
              className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 outline-none"
            >
              <option value="" className="bg-moose-edge">담당 미지정</option>
              {members.map((m) => <option key={m} value={m} className="bg-moose-edge">{m}</option>)}
              {t.assignee && !members.includes(t.assignee) && (
                <option value={t.assignee} className="bg-moose-edge">{t.assignee}</option>
              )}
            </select>
            <button onClick={() => remove(t.id)} className="shrink-0 text-slate-700 hover:text-rose-400">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li><MooseEmpty line="가볼 만한 곳, 챙길 것들을 적어보세요" sub="맘무가 하나하나 챙겨드릴게요" /></li>
        )}
        {todos.length > 0 && sorted.length === 0 && (
          <li className="py-6 text-center text-xs text-slate-600">{who} 담당 할 일이 없어요</li>
        )}
      </ul>
    </div>
  );
}
