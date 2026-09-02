import { useMemo, useState, type ReactNode } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor,
  closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronsUpDown, GripVertical, SlidersHorizontal } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  width: number;
  /** 정렬·검색·기본 렌더에 쓰는 값 */
  get: (row: T) => string | number;
  /** 커스텀 셀 렌더 (없으면 get 값) */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** 'text' 입력 검색 · 'multi' 값 다중선택 칩 · 'none' */
  filter?: 'text' | 'multi' | 'none';
}

/**
 * 재사용 표: 열 정밀 드래그 순서변경 · 열 표시/숨김 · 열별 검색/다중필터 · 정렬 · 셀 truncate.
 */
export default function DataTable<T>({
  rows, columns, rowKey, onRowClick, selectedKey, empty,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  empty?: ReactNode;
}) {
  const [order, setOrder] = useState<string[]>(columns.map((c) => c.key));
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [text, setText] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [colsOpen, setColsOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState<string | null>(null);

  const colMap = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);
  const visible = order.filter((k) => !hidden.has(k)).map((k) => colMap[k]).filter(Boolean);

  const multiOptions = (c: Column<T>) =>
    Array.from(new Set(rows.map((r) => String(c.get(r))).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko'));

  const filtered = useMemo(() => {
    let r = rows;
    for (const c of columns) {
      const q = text[c.key]?.trim().toLowerCase();
      if (q) r = r.filter((row) => String(c.get(row)).toLowerCase().includes(q));
      const sel = multi[c.key];
      if (sel && sel.size) r = r.filter((row) => sel.has(String(c.get(row))));
    }
    if (sort) {
      const c = colMap[sort.key];
      r = [...r].sort((a, b) => {
        const av = c.get(a), bv = c.get(b);
        return (typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'ko')) * sort.dir;
      });
    }
    return r;
  }, [rows, columns, text, multi, sort, colMap]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(String(active.id)), o.indexOf(String(over.id))));
  };
  const toggleSort = (k: string) => {
    if (!colMap[k].sortable) return;
    setSort((s) => (s?.key === k ? (s.dir === 1 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }));
  };
  const anyTextFilter = columns.some((c) => c.filter === 'text');
  const activeFilters =
    Object.values(text).filter(Boolean).length + Object.values(multi).filter((s) => s?.size).length;

  return (
    <div onClick={() => { setColsOpen(false); setMultiOpen(null); }}>
      <div className="flex items-center justify-between px-0.5 pb-1.5 text-xs text-slate-400">
        <span>{filtered.length}건{activeFilters ? ` · 필터 ${activeFilters}` : ''}</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setColsOpen((v) => !v); }}
            className="flex items-center gap-1 text-slate-400"
          >
            <SlidersHorizontal size={13} /> 열
          </button>
          {colsOpen && (
            <div className="modal-surface absolute right-0 z-30 mt-1.5 w-36 space-y-0.5 rounded-xl p-2 text-xs" onClick={(e) => e.stopPropagation()}>
              <div className="px-1 pb-1 text-[10px] text-slate-500">표시할 열</div>
              {order.map((k) => (
                <label key={k} className="flex items-center gap-2 rounded-lg px-1 py-1 text-slate-200 hover:bg-white/5">
                  <input
                    type="checkbox"
                    className="accent-moose-heart"
                    checked={!hidden.has(k)}
                    onChange={() => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; })}
                  />
                  {colMap[k].label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="no-scrollbar -mx-2.5 overflow-x-auto px-2.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <table className="border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>{visible.map((c) => <col key={c.key} style={{ width: c.width }} />)}</colgroup>
            <thead>
              <tr className="text-left text-slate-400">
                <SortableContext items={visible.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
                  {visible.map((c) => (
                    <Th
                      key={c.key}
                      col={c}
                      sortDir={sort?.key === c.key ? sort.dir : 0}
                      onSort={() => toggleSort(c.key)}
                      filterOn={!!text[c.key] || !!multi[c.key]?.size}
                      onOpenMulti={c.filter === 'multi' ? (e) => { e.stopPropagation(); setMultiOpen((m) => (m === c.key ? null : c.key)); } : undefined}
                    />
                  ))}
                </SortableContext>
              </tr>
              {anyTextFilter && (
                <tr>
                  {visible.map((c) => (
                    <th key={c.key} className="px-1.5 pb-1.5">
                      {c.filter === 'text' && (
                        <input
                          value={text[c.key] ?? ''}
                          onChange={(e) => setText((t) => ({ ...t, [c.key]: e.target.value }))}
                          placeholder="검색"
                          className="w-full rounded-lg bg-white/5 px-2 py-1 text-[11px] font-normal text-slate-200 outline-none ring-1 ring-white/5 placeholder:text-slate-600"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((row) => {
                const k = rowKey(row);
                return (
                  <tr
                    key={k}
                    onClick={() => onRowClick?.(row)}
                    className={`transition ${onRowClick ? 'cursor-pointer' : ''} ${
                      k === selectedKey ? 'bg-moose-heart/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {visible.map((c) => (
                      <td key={c.key} className="truncate border-b border-white/5 px-1.5 py-2.5 text-slate-200">
                        {c.render ? c.render(row) : c.get(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DndContext>
        {filtered.length === 0 && (empty ?? <p className="py-10 text-center text-xs text-slate-600">조건에 맞는 항목이 없어요</p>)}
      </div>

      {/* 다중 선택 필터 팝오버 */}
      {multiOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setMultiOpen(null)}>
          <div className="modal-surface max-h-[60vh] w-full space-y-1 overflow-y-auto rounded-t-3xl p-4 text-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2">
              <span className="font-semibold text-white">{colMap[multiOpen].label} 선택</span>
              <button onClick={() => setMulti((m) => ({ ...m, [multiOpen]: new Set() }))} className="text-xs text-slate-400">전체 해제</button>
            </div>
            {multiOptions(colMap[multiOpen]).map((opt) => {
              const sel = multi[multiOpen] ?? new Set<string>();
              return (
                <label key={opt} className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-slate-200 hover:bg-white/5">
                  <input
                    type="checkbox"
                    className="accent-moose-heart"
                    checked={sel.has(opt)}
                    onChange={() => setMulti((m) => {
                      const n = new Set(m[multiOpen] ?? []);
                      n.has(opt) ? n.delete(opt) : n.add(opt);
                      return { ...m, [multiOpen]: n };
                    })}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Th<T>({
  col, sortDir, onSort, filterOn, onOpenMulti,
}: {
  col: Column<T>;
  sortDir: 0 | 1 | -1;
  onSort: () => void;
  filterOn: boolean;
  onOpenMulti?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key });
  return (
    <th
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="select-none whitespace-nowrap px-1.5 pb-1.5 pt-1 font-medium"
    >
      <div className="flex items-center gap-1">
        <span className="cursor-grab touch-none text-slate-700 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical size={11} />
        </span>
        <button onClick={onSort} className={`flex items-center gap-0.5 ${col.sortable ? '' : 'cursor-default'}`}>
          {col.label}
          {col.sortable && (
            sortDir ? <span className="text-[9px] text-moose-heart">{sortDir === 1 ? '▲' : '▼'}</span>
              : <ChevronsUpDown size={10} className="text-slate-700" />
          )}
        </button>
        {onOpenMulti && (
          <button onClick={onOpenMulti} className={`text-[9px] ${filterOn ? 'text-moose-heart' : 'text-slate-700'}`}>▾</button>
        )}
      </div>
    </th>
  );
}
