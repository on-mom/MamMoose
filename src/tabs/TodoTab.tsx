import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Todo, TodoPriority } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { MooseEmpty } from '../components/Moose';

const PRIO: Record<TodoPriority, { label: string; cls: string }> = {
  high: { label: '높음', cls: 'bg-rose-500/20 text-rose-300' },
  mid: { label: '보통', cls: 'bg-amber-500/20 text-amber-300' },
  low: { label: '낮음', cls: 'bg-slate-600/30 text-slate-300' },
};
const NEXT: Record<TodoPriority, TodoPriority> = { high: 'mid', mid: 'low', low: 'high' };
const RANK: Record<TodoPriority, number> = { high: 0, mid: 1, low: 2 };

export default function TodoTab() {
  const project = useActiveProject()!;
  const todos = useAppStore((s) => s.present[s.activeProjectId]?.todos ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const [text, setText] = useState('');
  const [groupByPrio, setGroupByPrio] = useState(false);

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

  const sorted = [...todos].sort((a, b) =>
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

      <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <input type="checkbox" checked={groupByPrio} onChange={(e) => setGroupByPrio(e.target.checked)} />
        우선순위순 정렬
      </label>

      <ul className="space-y-1">
        {sorted.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-moose-dusk/60"
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
            <button
              onClick={() => patch(t.id, { priority: NEXT[t.priority] })}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${PRIO[t.priority].cls}`}
            >
              {PRIO[t.priority].label}
            </button>
            <button onClick={() => remove(t.id)} className="shrink-0 text-slate-700 hover:text-rose-400">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li><MooseEmpty line="가볼 만한 곳, 챙길 것들을 적어보세요" sub="맘무가 하나하나 챙겨드릴게요" /></li>
        )}
      </ul>
    </div>
  );
}
