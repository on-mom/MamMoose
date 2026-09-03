import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor,
  closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Clock, MapPin, Sparkles, Heart, MessageCircle, Lock, Pencil } from 'lucide-react';
import type { TimelineItem } from '../types';
import { useAppStore, useActiveProject } from '../store/useAppStore';
import { uid } from '../lib/uid';
import { computeFocus } from '../lib/timezone';
import { coordsForArea } from '../lib/areaCoords';
import { useMemberNames, useMyName } from '../lib/members';
import Modal from '../components/Modal';
import { DiaryQuickWrite } from './DiaryView';

const COL = 'col-'; // droppable 접두사
const dayKeys = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));
const tripDays = (start: string, end: string) =>
  Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1);
const dateOfDay = (start: string, day: number) => {
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() + day - 1);
  return `${d.getMonth() + 1}/${d.getDate()} (${'일월화수목금토'[d.getDay()]})`;
};

type Board = Record<string, string[]>;

function boardFromItems(items: TimelineItem[], days: number): Board {
  const b: Board = {};
  for (const k of dayKeys(days)) b[k] = [];
  for (const it of [...items].sort((a, b2) => a.order - b2.order)) {
    (b[String(it.day)] ??= []).push(it.id);
  }
  return b;
}

export default function TimelineView() {
  const project = useActiveProject()!;
  const items = useAppStore((s) => s.present[s.activeProjectId]?.timeline ?? []);
  const spots = useAppStore((s) => s.present[s.activeProjectId]?.spots ?? []);
  const restaurants = useAppStore((s) => s.present[s.activeProjectId]?.restaurants ?? []);
  const mutate = useAppStore((s) => s.mutate);
  const days = tripDays(project.startDate, project.endDate);
  const [picker, setPicker] = useState(false);
  const [pickerDay, setPickerDay] = useState(1);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [detailId, setDetailId] = useState<string | null>(null);

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const [board, setBoard] = useState<Board>(() => boardFromItems(items, days));
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setBoard(boardFromItems(items, days));
  }, [items, days]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** id(아이템 또는 'col-2') → 소속 일차 키 */
  const containerOf = (id: string): string | undefined => {
    if (id.startsWith(COL)) return id.slice(COL.length);
    return Object.keys(board).find((k) => board[k].includes(id));
  };

  const onDragStart = (e: DragStartEvent) => {
    dragging.current = true;
    setActiveId(String(e.active.id));
    navigator.vibrate?.(12);
  };

  const onDragOver = (e: DragOverEvent) => {
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || overId === id) return;
    const from = containerOf(id);
    const to = containerOf(overId);
    if (!from || !to || from === to) return;
    setBoard((prev) => {
      const next: Board = { ...prev, [from]: prev[from].filter((x) => x !== id), [to]: [...prev[to]] };
      const overIdx = next[to].indexOf(overId); // overId가 컬럼이면 -1
      next[to].splice(overIdx >= 0 ? overIdx : next[to].length, 0, id);
      return next;
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActiveId(null);
    dragging.current = false;

    setBoard((prev) => {
      const next = { ...prev };
      const to = containerOf(overId ?? id) ?? containerOf(id);
      if (to && overId && !overId.startsWith(COL)) {
        const arr = [...next[to]];
        const oldIdx = arr.indexOf(id);
        const newIdx = arr.indexOf(overId);
        if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) next[to] = arrayMove(arr, oldIdx, newIdx);
      }
      commit(next);
      return next;
    });
  };

  const commit = (b: Board) => {
    mutate((doc) => {
      for (const k of Object.keys(b)) {
        b[k].forEach((id, idx) => {
          const it = doc.timeline.find((x) => x.id === id);
          if (it) { it.day = Number(k); it.order = idx; }
        });
      }
    });
  };

  const addItem = (day: number) =>
    mutate((doc) => {
      const order = doc.timeline.filter((i) => i.day === day).length;
      doc.timeline.push({
        id: uid(), projectId: project.id, day, order,
        startTime: '09:00', durationMin: 30, place: '새 일정', lat: null, lng: null, memo: '',
      });
    });

  const addPlace = (place: string, area: string, memo: string) =>
    mutate((doc) => {
      const order = doc.timeline.filter((i) => i.day === pickerDay).length;
      const c = area ? coordsForArea(area) : null;
      doc.timeline.push({
        id: uid(), projectId: project.id, day: pickerDay, order,
        startTime: '10:00', durationMin: 60, place,
        lat: c?.lat ?? null, lng: c?.lng ?? null, memo,
      });
      navigator.vibrate?.(10);
    });

  const focus = useMemo(() => computeFocus(project, items), [project, items]);
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focus.focusId]);

  return (
    <div className="edge space-y-4 py-3">
      <div className="flex items-center justify-between rounded-lg bg-moose-dusk/70 px-3 py-2 text-[11px] text-slate-400">
        <span>
          현지(하노이) <span className="text-slate-200">{focus.localHHMM}</span>
          {focus.deviceHHMM !== focus.localHHMM && <> · 내 기기 {focus.deviceHHMM}</>}
          {' · '}
          {focus.inTrip ? `여행 ${focus.day}일차 진행 중` : focus.day === 1 ? '여행 시작 전' : '여행 종료'}
        </span>
        <button onClick={() => setPicker(true)} className="flex shrink-0 items-center gap-1 text-moose-heart">
          <Sparkles size={12} /> 추천 스팟
        </button>
      </div>

      <DiaryQuickWrite />

      <div className="flex items-center justify-between rounded-lg bg-moose-dusk/50 px-2 py-1.5">
        <div className="flex gap-1 text-[11px]">
          <button
            onClick={() => setMode('read')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === 'read' ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            <Lock size={11} /> 읽기
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === 'edit' ? 'bg-moose-heart text-white' : 'text-slate-400'}`}
          >
            <Pencil size={11} /> 편집
          </button>
        </div>
        <span className="pr-1 text-[10px] text-slate-500">
          {mode === 'read' ? '항목을 눌러 좋아요·코멘트' : '저장 내용은 동행자에게 바로 반영'}
        </span>
      </div>

      {picker && (
        <Modal onClose={() => setPicker(false)} title={<span className="text-sm font-semibold text-white">추천 스팟에서 담기</span>}>
          <div className="space-y-3">
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {dayKeys(days).map((k) => (
                <button
                  key={k}
                  onClick={() => setPickerDay(Number(k))}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                    Number(k) === pickerDay ? 'btn-heart' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {k}일차
                </button>
              ))}
            </div>
            {spots.length > 0 && (
              <div>
                <div className="pb-1 text-[11px] font-semibold text-slate-500">추천 관광지 TOP{spots.length}</div>
                <div className="space-y-1">
                  {spots.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => addPlace(sp.name, sp.area, sp.tip)}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-left text-xs hover:bg-white/[0.06]"
                    >
                      <Plus size={13} className="shrink-0 text-moose-heart" />
                      <span className="min-w-0 flex-1 truncate text-slate-200">{sp.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-500">{sp.area}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="pb-1 text-[11px] font-semibold text-slate-500">맛집 · 카페</div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {restaurants.slice(0, 30).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addPlace(r.nameKo || r.name, r.area, r.menu || r.note)}
                    className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-left text-xs hover:bg-white/[0.06]"
                  >
                    <Plus size={13} className="shrink-0 text-moose-heart" />
                    <span className="min-w-0 flex-1 truncate text-slate-200">{r.nameKo || r.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">{r.area}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-600">담으면 {pickerDay}일차에 추가돼요 · 시간·순서는 드래그로 조정</p>
          </div>
        </Modal>
      )}

      {mode === 'read' ? (
        <div className="space-y-4">
          {dayKeys(days).map((k) => (
            <section key={k} className="space-y-2">
              <h3 className="font-title text-base font-bold text-white">
                {k}일차 <span className="text-xs font-normal text-slate-500">{dateOfDay(project.startDate, Number(k))}</span>
              </h3>
              {(board[k] ?? []).length === 0 && (
                <p className="rounded-lg border border-dashed border-moose-edge py-3 text-center text-[11px] text-slate-600">
                  일정이 없어요 · [편집]에서 추가하세요
                </p>
              )}
              {(board[k] ?? []).map((id) =>
                byId[id] ? (
                  <ReadCard
                    key={id}
                    item={byId[id]}
                    highlight={id === focus.focusId}
                    innerRef={id === focus.focusId ? focusRef : undefined}
                    onOpen={() => setDetailId(id)}
                  />
                ) : null,
              )}
            </section>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {dayKeys(days).map((k) => (
            <section key={k} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-title text-base font-bold text-white">
                  {k}일차 <span className="text-xs font-normal text-slate-500">{dateOfDay(project.startDate, Number(k))}</span>
                </h3>
                <button onClick={() => addItem(Number(k))} className="flex items-center gap-1 text-xs text-moose-heart">
                  <Plus size={14} /> 추가
                </button>
              </div>
              <DayColumn dayKey={k} itemIds={board[k] ?? []}>
                {(board[k] ?? []).map((id) =>
                  byId[id] ? (
                    <Row
                      key={id}
                      item={byId[id]}
                      highlight={id === focus.focusId}
                      innerRef={id === focus.focusId ? focusRef : undefined}
                    />
                  ) : null,
                )}
              </DayColumn>
            </section>
          ))}

          <DragOverlay>
            {activeId && byId[activeId] ? <Card item={byId[activeId]} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {detailId && byId[detailId] && (
        <ItemDetailModal item={byId[detailId]} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

/* ---------- 일차 컨테이너 (빈 날도 드롭 가능) ---------- */
function DayColumn({ dayKey, itemIds, children }: { dayKey: string; itemIds: string[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: COL + dayKey });
  return (
    <SortableContext id={COL + dayKey} items={itemIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`min-h-[46px] space-y-2 rounded-xl transition-colors ${isOver ? 'bg-moose-heart/5 ring-1 ring-moose-heart/20' : ''}`}
      >
        {children}
        {itemIds.length === 0 && (
          <p className="rounded-lg border border-dashed border-moose-edge py-3 text-center text-[11px] text-slate-600">
            여기로 일정을 끌어오거나 추가하세요
          </p>
        )}
      </div>
    </SortableContext>
  );
}

function Row({
  item, highlight, innerRef,
}: { item: TimelineItem; highlight?: boolean; innerRef?: Ref<HTMLDivElement> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div ref={innerRef}>
        <Card item={item} highlight={highlight} handleProps={{ ...attributes, ...listeners }} />
      </div>
    </div>
  );
}

/* ---------- 읽기전용 카드 ---------- */
function ReadCard({
  item, highlight, innerRef, onOpen,
}: { item: TimelineItem; highlight?: boolean; innerRef?: Ref<HTMLDivElement>; onOpen: () => void }) {
  const likes = item.likes ?? [];
  const comments = item.comments ?? [];
  return (
    <div ref={innerRef}>
      <button
        onClick={onOpen}
        className={`w-full rounded-xl border p-2.5 text-left transition ${
          highlight ? 'border-moose-heart bg-moose-heart/10' : 'border-white/5 bg-moose-dusk/70 hover:bg-white/[0.05]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-slate-400">{item.startTime}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{item.place}</span>
          {item.lat != null && <MapPin size={11} className="shrink-0 text-emerald-500" />}
        </div>
        {item.memo && <div className="mt-1 truncate text-[11px] text-slate-400">{item.memo}</div>}
        {(likes.length > 0 || comments.length > 0) && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px]">
            {likes.length > 0 && (
              <span className="flex items-center gap-0.5 text-moose-heart">
                <Heart size={11} fill="currentColor" /> {likes.join(' · ')}
              </span>
            )}
            {comments.length > 0 && (
              <span className="flex items-center gap-0.5 text-slate-500">
                <MessageCircle size={11} /> {comments.length}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

/* ---------- 항목 상세 (좋아요 · 코멘트) ---------- */
function ItemDetailModal({ item, onClose }: { item: TimelineItem; onClose: () => void }) {
  const mutate = useAppStore((s) => s.mutate);
  const me = useMyName();
  const members = useMemberNames();
  const [text, setText] = useState('');
  const likes = item.likes ?? [];
  const comments = item.comments ?? [];
  const iLike = likes.includes(me);
  const everyone = members.length > 0 && members.every((m) => likes.includes(m));

  const patchItem = (fn: (it: TimelineItem) => void) =>
    mutate((doc) => { const it = doc.timeline.find((x) => x.id === item.id); if (it) fn(it); });

  const toggleLike = () =>
    patchItem((it) => {
      const set = new Set(it.likes ?? []);
      set.has(me) ? set.delete(me) : set.add(me);
      it.likes = [...set];
    });
  const addComment = () => {
    if (!text.trim()) return;
    patchItem((it) => {
      (it.comments ??= []).push({ id: uid(), author: me, text: text.trim(), at: Date.now() });
    });
    setText('');
  };
  const delComment = (cid: string) =>
    patchItem((it) => { if (it.comments) it.comments = it.comments.filter((c) => c.id !== cid); });

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          <div className="font-title text-base font-bold text-white">{item.place}</div>
          <div className="mt-0.5 text-[12px] text-slate-400">
            {item.startTime} · 이동 {item.durationMin}분{everyone && ' · 💗 둘 다 좋아요'}
          </div>
        </>
      }
    >
      <div className="space-y-3">
        {item.memo && <div className="rounded-lg bg-white/[0.04] p-2.5 text-[13px] text-slate-200">{item.memo}</div>}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              iLike ? 'bg-moose-heart text-white' : 'border border-white/10 text-slate-300'
            }`}
          >
            <Heart size={14} fill={iLike ? 'currentColor' : 'none'} /> 좋아요
          </button>
          {likes.length > 0 && <span className="text-[11px] text-slate-400">{likes.join(' · ')}</span>}
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-500">코멘트 {comments.length > 0 && `· ${comments.length}`}</div>
          {comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-300">{c.author}</div>
                <div className="text-[13px] text-slate-100">{c.text}</div>
              </div>
              {c.author === me && (
                <button onClick={() => delComment(c.id)} className="shrink-0 text-slate-600 hover:text-rose-400">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="코멘트 남기기"
              className="min-w-0 flex-1 rounded-lg bg-moose-edge px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <button onClick={addComment} disabled={!text.trim()} className="btn-heart shrink-0 rounded-lg px-3 text-sm font-semibold disabled:opacity-40">
              등록
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Card({
  item, highlight, overlay, handleProps,
}: {
  item: TimelineItem;
  highlight?: boolean;
  overlay?: boolean;
  handleProps?: Record<string, unknown>;
}) {
  const mutate = useAppStore((s) => s.mutate);
  const patch = (p: Partial<TimelineItem>) =>
    mutate((doc) => {
      const it = doc.timeline.find((x) => x.id === item.id);
      if (it) Object.assign(it, p);
    });
  const remove = () => mutate((doc) => { doc.timeline = doc.timeline.filter((x) => x.id !== item.id); });

  return (
    <div
      className={`flex gap-2 rounded-xl border p-2.5 ${
        highlight ? 'border-moose-heart bg-moose-heart/10' : 'border-white/5 bg-moose-dusk/70'
      } ${overlay ? 'shadow-2xl' : ''}`}
    >
      <button className="mt-1 shrink-0 cursor-grab touch-none text-slate-600 active:cursor-grabbing" {...handleProps}>
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <input
          key={item.place}
          defaultValue={item.place}
          onBlur={(e) => e.target.value !== item.place && patch({ place: e.target.value })}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
          placeholder="장소명"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <label className="flex items-center gap-1">
            <Clock size={12} />
            <input
              type="time"
              value={item.startTime}
              onChange={(e) => patch({ startTime: e.target.value })}
              className="bg-transparent text-slate-200 outline-none"
            />
          </label>
          <label className="flex items-center gap-1">
            이동
            <input
              type="number"
              min={0}
              step={5}
              value={item.durationMin}
              onChange={(e) => patch({ durationMin: Number(e.target.value) || 0 })}
              className="w-12 bg-transparent text-right text-slate-200 outline-none"
            />
            분
          </label>
          {item.lat != null && (
            <span className="flex items-center gap-0.5 text-emerald-500">
              <MapPin size={11} /> 위치
            </span>
          )}
        </div>
        <input
          key={item.memo}
          defaultValue={item.memo ?? ''}
          onBlur={(e) => e.target.value !== (item.memo ?? '') && patch({ memo: e.target.value })}
          className="w-full bg-transparent text-[11px] text-slate-400 outline-none placeholder:text-slate-700"
          placeholder="메모"
        />
      </div>
      {!overlay && (
        <button onClick={remove} className="mt-1 shrink-0 text-slate-600 hover:text-rose-400">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
